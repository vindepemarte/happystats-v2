// CSV import API endpoint

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';
import { withChartLimit } from '../../../../lib/middleware/subscription';
import { createChart } from '../../../../lib/models/chart';
import { parseAndValidateCSV, groupDataPointsByCategory } from '../../../../lib/csv-import';
import { serializeDatesForJSON } from '../../../../lib/database';
import { z } from 'zod';

const importCSVSchema = z.object({
  csvData: z.string().min(1, 'CSV data is required'),
  chartName: z.string().min(1, 'Chart name is required').max(255, 'Chart name too long'),
  skipFirstRow: z.boolean().optional().default(true),
});

// POST /api/charts/import - Import CSV data and create chart
export async function POST(request: NextRequest) {
  return withChartLimit(request, async (req, user) => {
    try {
      const body = await req.json();
      const validationResult = importCSVSchema.safeParse(body);
      
      if (!validationResult.success) {
        return NextResponse.json(
          { 
            error: 'Validation failed', 
            details: validationResult.error.issues 
          },
          { status: 400 }
        );
      }

      const { csvData, chartName, skipFirstRow } = validationResult.data;

      // Parse and validate CSV data
      const parseResult = parseAndValidateCSV(csvData, { skipFirstRow });
      
      if (!parseResult.isValid) {
        return NextResponse.json(
          {
            error: 'CSV validation failed',
            details: parseResult.errors,
            totalRows: parseResult.totalRows,
            validRows: parseResult.validRows.length
          },
          { status: 400 }
        );
      }

      if (parseResult.validRows.length === 0) {
        return NextResponse.json(
          {
            error: 'No valid data found in CSV',
            details: ['CSV contains no valid data rows']
          },
          { status: 400 }
        );
      }

      // Group data points by category
      const categoryGroups = groupDataPointsByCategory(parseResult.validRows);
      const categories = Object.keys(categoryGroups);

      // For now, create a single chart with the first category
      // In the future, we could allow users to choose or create multiple charts
      const primaryCategory = categories[0];
      const dataPointsForChart = categoryGroups[primaryCategory];

      // Create the chart
      const chart = await createChart({
        userId: user.id,
        name: chartName,
        category: primaryCategory,
      });

      // Add data points to the chart
      const { createDataPoint } = await import('../../../../lib/models/chart');
      const createdDataPoints = [];

      for (const csvDataPoint of dataPointsForChart) {
        try {
          const dataPoint = await createDataPoint({
            chartId: chart.id,
            measurement: csvDataPoint.measurement,
            date: new Date(csvDataPoint.date),
            name: csvDataPoint.name,
          });
          createdDataPoints.push(dataPoint);
        } catch (error) {
          console.error('Error creating data point:', error);
          // Continue with other data points even if one fails
        }
      }

      // Update chart with created data points
      chart.dataPoints = createdDataPoints;

      // Prepare response with import summary
      const importSummary = {
        totalRowsProcessed: parseResult.totalRows,
        validRowsFound: parseResult.validRows.length,
        dataPointsCreated: createdDataPoints.length,
        categoriesFound: categories,
        primaryCategory,
        skippedCategories: categories.slice(1), // Categories not imported
      };

      return NextResponse.json(
        {
          message: 'CSV imported successfully',
          chart: serializeDatesForJSON(chart),
          importSummary,
          warnings: categories.length > 1 ? [
            `Found ${categories.length} categories. Only "${primaryCategory}" was imported. Other categories: ${categories.slice(1).join(', ')}`
          ] : []
        },
        { status: 201 }
      );

    } catch (error) {
      console.error('CSV import error:', error);
      return NextResponse.json(
        { error: 'Failed to import CSV data' },
        { status: 500 }
      );
    }
  });
}

// POST /api/charts/import/validate - Validate CSV data without creating chart
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { csvData, skipFirstRow = true } = body;

    if (!csvData || typeof csvData !== 'string') {
      return NextResponse.json(
        { error: 'CSV data is required' },
        { status: 400 }
      );
    }

    // Parse and validate CSV data
    const parseResult = parseAndValidateCSV(csvData, { skipFirstRow });
    
    // Group data by category for preview
    const categoryGroups = parseResult.validRows.length > 0 
      ? groupDataPointsByCategory(parseResult.validRows)
      : {};

    return NextResponse.json({
      validation: {
        isValid: parseResult.isValid,
        errors: parseResult.errors,
        totalRows: parseResult.totalRows,
        validRows: parseResult.validRows.length,
      },
      preview: {
        categories: Object.keys(categoryGroups),
        sampleData: parseResult.validRows.slice(0, 5), // First 5 rows for preview
        categoryBreakdown: Object.entries(categoryGroups).map(([category, points]) => ({
          category,
          count: points.length,
          samplePoints: points.slice(0, 3)
        }))
      }
    });

  } catch (error) {
    console.error('CSV validation error:', error);
    return NextResponse.json(
      { error: 'Failed to validate CSV data' },
      { status: 500 }
    );
  }
}