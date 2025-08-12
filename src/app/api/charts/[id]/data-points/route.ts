// Data points API endpoints - Create and List for a specific chart

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../../lib/auth';
import { getChartById } from '../../../../../lib/models/chart';
import { createDataPoint } from '../../../../../lib/models/chart';
import { serializeDatesForJSON } from '../../../../../lib/database';
import { z } from 'zod';

const createDataPointSchema = z.object({
  measurement: z.number().finite('Measurement must be a valid number'),
  date: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid date format'),
  name: z.string().min(1, 'Name is required').max(255, 'Name too long'),
});

// GET /api/charts/[id]/data-points - List data points for a chart
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const params = await context.params;
    const chart = await getChartById(params.id);
    
    if (!chart) {
      return NextResponse.json(
        { error: 'Chart not found' },
        { status: 404 }
      );
    }

    // Check if user owns the chart
    if (chart.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Data points are already included in the chart from getChartById
    return NextResponse.json({
      dataPoints: serializeDatesForJSON(chart.dataPoints || []),
      count: chart.dataPoints?.length || 0,
    });

  } catch (error) {
    console.error('Data points fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data points' },
      { status: 500 }
    );
  }
}

// POST /api/charts/[id]/data-points - Create new data point
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // First check if chart exists and user owns it
    const params = await context.params;
    const chart = await getChartById(params.id);
    
    if (!chart) {
      return NextResponse.json(
        { error: 'Chart not found' },
        { status: 404 }
      );
    }

    if (chart.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validationResult = createDataPointSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          details: validationResult.error.issues 
        },
        { status: 400 }
      );
    }

    const { measurement, date, name } = validationResult.data;

    const dataPoint = await createDataPoint({
      chartId: params.id,
      measurement,
      date: new Date(date),
      name,
    });

    return NextResponse.json(
      { 
        message: 'Data point created successfully',
        dataPoint: serializeDatesForJSON(dataPoint)
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Data point creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create data point' },
      { status: 500 }
    );
  }
}