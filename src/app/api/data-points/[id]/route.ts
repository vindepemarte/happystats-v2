// Individual data point API endpoints - Get, Update, Delete

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../lib/auth';
import { updateDataPoint, deleteDataPoint } from '../../../../lib/models/chart';
import { query, serializeDatesForJSON } from '../../../../lib/database';
import { z } from 'zod';

const updateDataPointSchema = z.object({
  measurement: z.number().finite('Measurement must be a valid number').optional(),
  date: z.string().refine((date) => !isNaN(Date.parse(date)), 'Invalid date format').optional(),
  name: z.string().min(1, 'Name is required').max(255, 'Name too long').optional(),
});

// Helper function to get data point with ownership check
async function getDataPointWithOwnership(dataPointId: string, userId: string) {
  const result = await query(`
    SELECT dp.*, c.user_id 
    FROM data_points dp
    JOIN charts c ON dp.chart_id = c.id
    WHERE dp.id = $1
  `, [dataPointId]);

  if (result.rows.length === 0) {
    return null;
  }

  const row = result.rows[0];
  if (row.user_id !== userId) {
    throw new Error('Access denied');
  }

  return {
    id: row.id,
    chartId: row.chart_id,
    measurement: parseFloat(row.measurement),
    date: row.date,
    name: row.name,
    createdAt: row.created_at,
  };
}

// GET /api/data-points/[id] - Get data point by ID
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
    const dataPoint = await getDataPointWithOwnership(params.id, session.user.id);

    if (!dataPoint) {
      return NextResponse.json(
        { error: 'Data point not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ dataPoint: serializeDatesForJSON(dataPoint) });

  } catch (error) {
    if (error instanceof Error && error.message === 'Access denied') {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    console.error('Data point fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data point' },
      { status: 500 }
    );
  }
}

// PUT /api/data-points/[id] - Update data point
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

    // First check if data point exists and user owns it
    const params = await context.params;
    const existingDataPoint = await getDataPointWithOwnership(params.id, session.user.id);

    if (!existingDataPoint) {
      return NextResponse.json(
        { error: 'Data point not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validationResult = updateDataPointSchema.safeParse(body);

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

    // Convert date string to Date object if provided
    const processedUpdateData: Record<string, unknown> = {};

    if (updateData.measurement !== undefined) {
      processedUpdateData.measurement = updateData.measurement;
    }

    if (updateData.name !== undefined) {
      processedUpdateData.name = updateData.name;
    }

    if (updateData.date !== undefined) {
      processedUpdateData.date = new Date(updateData.date);
    }

    const updatedDataPoint = await updateDataPoint(params.id, processedUpdateData);

    if (!updatedDataPoint) {
      return NextResponse.json(
        { error: 'Failed to update data point' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Data point updated successfully',
      dataPoint: serializeDatesForJSON(updatedDataPoint),
    });

  } catch (error) {
    if (error instanceof Error && error.message === 'Access denied') {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    console.error('Data point update error:', error);
    return NextResponse.json(
      { error: 'Failed to update data point' },
      { status: 500 }
    );
  }
}

// DELETE /api/data-points/[id] - Delete data point
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

    // First check if data point exists and user owns it
    const params = await context.params;
    const existingDataPoint = await getDataPointWithOwnership(params.id, session.user.id);

    if (!existingDataPoint) {
      return NextResponse.json(
        { error: 'Data point not found' },
        { status: 404 }
      );
    }

    const deleted = await deleteDataPoint(params.id);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Failed to delete data point' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Data point deleted successfully',
    });

  } catch (error) {
    if (error instanceof Error && error.message === 'Access denied') {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    console.error('Data point deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete data point' },
      { status: 500 }
    );
  }
}