// Charts API endpoints - Create and List

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';
import { createChart, getChartsByUserId } from '../../../lib/models/chart';
import { withChartLimit } from '../../../lib/middleware/subscription';
import { serializeDatesForJSON } from '../../../lib/database';
import { z } from 'zod';

const createChartSchema = z.object({
  name: z.string().min(1, 'Chart name is required').max(255, 'Chart name too long'),
  category: z.string().min(1, 'Category is required').max(100, 'Category name too long'),
});

const listChartsSchema = z.object({
  category: z.string().optional(),
  search: z.string().optional(),
});

// GET /api/charts - List user's charts
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const queryParams = {
      category: searchParams.get('category') || undefined,
      search: searchParams.get('search') || undefined,
    };

    const validationResult = listChartsSchema.safeParse(queryParams);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Invalid query parameters', 
          details: validationResult.error.issues 
        },
        { status: 400 }
      );
    }

    const filters = {
      ...validationResult.data,
      userId: session.user.id,
    };

    const charts = await getChartsByUserId(session.user.id, filters);

    return NextResponse.json({
      charts: serializeDatesForJSON(charts),
      count: charts.length,
    });

  } catch (error) {
    console.error('Charts list error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch charts' },
      { status: 500 }
    );
  }
}

// POST /api/charts - Create new chart
export async function POST(request: NextRequest) {
  return withChartLimit(request, async (req, user) => {
    try {
      const body = await req.json();
      const validationResult = createChartSchema.safeParse(body);
      
      if (!validationResult.success) {
        return NextResponse.json(
          { 
            error: 'Validation failed', 
            details: validationResult.error.issues 
          },
          { status: 400 }
        );
      }

      const { name, category } = validationResult.data;

      const chart = await createChart({
        userId: user.id,
        name,
        category,
      });

      return NextResponse.json(
        { 
          message: 'Chart created successfully',
          chart: serializeDatesForJSON(chart)
        },
        { status: 201 }
      );

    } catch (error) {
      console.error('Chart creation error:', error);
      return NextResponse.json(
        { error: 'Failed to create chart' },
        { status: 500 }
      );
    }
  });
}