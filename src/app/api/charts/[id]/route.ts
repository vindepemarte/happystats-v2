// Individual chart API endpoints - Get, Update, Delete

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';
import { getChartById, updateChart, deleteChart } from '../../../../lib/models/chart';
import { serializeDatesForJSON } from '../../../../lib/database';
import { z } from 'zod';

const updateChartSchema = z.object({
  name: z.string().min(1, 'Chart name is required').max(255, 'Chart name too long').optional(),
  category: z.string().min(1, 'Category is required').max(100, 'Category name too long').optional(),
});

// GET /api/charts/[id] - Get chart by ID
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

    return NextResponse.json({ chart: serializeDatesForJSON(chart) });

  } catch (error) {
    console.error('Chart fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chart' },
      { status: 500 }
    );
  }
}

// PUT /api/charts/[id] - Update chart
export async function PUT(
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
    const existingChart = await getChartById(params.id);

    if (!existingChart) {
      return NextResponse.json(
        { error: 'Chart not found' },
        { status: 404 }
      );
    }

    if (existingChart.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validationResult = updateChartSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.issues
        },
        { status: 400 }
      );
    }

    const updateData = validationResult.data;

    // Check if there's actually something to update
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    const updatedChart = await updateChart(params.id, updateData);

    if (!updatedChart) {
      return NextResponse.json(
        { error: 'Failed to update chart' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Chart updated successfully',
      chart: serializeDatesForJSON(updatedChart),
    });

  } catch (error) {
    console.error('Chart update error:', error);
    return NextResponse.json(
      { error: 'Failed to update chart' },
      { status: 500 }
    );
  }
}

// DELETE /api/charts/[id] - Delete chart
export async function DELETE(
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
    const existingChart = await getChartById(params.id);

    if (!existingChart) {
      return NextResponse.json(
        { error: 'Chart not found' },
        { status: 404 }
      );
    }

    if (existingChart.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    const deleted = await deleteChart(params.id);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Failed to delete chart' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Chart deleted successfully',
    });

  } catch (error) {
    console.error('Chart deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete chart' },
      { status: 500 }
    );
  }
}