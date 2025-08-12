// Chart model with CRUD operations

import { query, transaction, toCamelCase, toSnakeCase, DatabaseError } from '../database';
import { 
  Chart, 
  DataPoint, 
  CreateChartData, 
  UpdateChartData, 
  CreateDataPointData, 
  UpdateDataPointData,
  ChartFilters,
  DateRangeFilter,
  TrendCalculation,
  ChartStatistics
} from '../../types/chart';



// Create a new chart
export async function createChart(chartData: CreateChartData): Promise<Chart> {
  try {
    const snakeData = toSnakeCase(chartData);
    const result = await query(
      `INSERT INTO charts (user_id, name, category)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [snakeData.user_id, snakeData.name, snakeData.category]
    );
    
    if (result.rows.length === 0) {
      throw new DatabaseError('Failed to create chart');
    }
    
    const chart = toCamelCase(result.rows[0]) as Chart;
    chart.dataPoints = []; // New chart has no data points
    return chart;
  } catch (error) {
    throw new DatabaseError('Failed to create chart', error);
  }
}

// Get chart by ID with data points
export async function getChartById(id: string): Promise<Chart | null> {
  try {
    const chartResult = await query('SELECT * FROM charts WHERE id = $1', [id]);
    
    if (chartResult.rows.length === 0) {
      return null;
    }
    
    const chart = toCamelCase(chartResult.rows[0]) as Chart;
    
    // Get data points for the chart
    const dataPointsResult = await query(
      'SELECT * FROM data_points WHERE chart_id = $1 ORDER BY date ASC',
      [id]
    );
    
    chart.dataPoints = toCamelCase(dataPointsResult.rows) as DataPoint[];
    
    return chart;
  } catch (error) {
    throw new DatabaseError('Failed to get chart by ID', error);
  }
}

// Get charts by user ID with optional filters
export async function getChartsByUserId(userId: string, filters?: ChartFilters): Promise<Chart[]> {
  try {
    let queryText = 'SELECT * FROM charts WHERE user_id = $1';
    const params: any[] = [userId];
    let paramIndex = 2;
    
    if (filters?.category) {
      queryText += ` AND category = $${paramIndex}`;
      params.push(filters.category);
      paramIndex++;
    }
    
    if (filters?.search) {
      queryText += ` AND name ILIKE $${paramIndex}`;
      params.push(`%${filters.search}%`);
      paramIndex++;
    }
    
    queryText += ' ORDER BY updated_at DESC';
    
    const result = await query(queryText, params);
    const charts = toCamelCase(result.rows) as Chart[];
    
    // Get data points for each chart
    for (const chart of charts) {
      const dataPointsResult = await query(
        'SELECT * FROM data_points WHERE chart_id = $1 ORDER BY date ASC',
        [chart.id]
      );
      chart.dataPoints = toCamelCase(dataPointsResult.rows) as DataPoint[];
    }
    
    return charts;
  } catch (error) {
    throw new DatabaseError('Failed to get charts by user ID', error);
  }
}

// Update chart
export async function updateChart(id: string, updateData: UpdateChartData): Promise<Chart | null> {
  try {
    const snakeData = toSnakeCase(updateData);
    const fields = Object.keys(snakeData);
    const values = Object.values(snakeData);
    
    if (fields.length === 0) {
      throw new DatabaseError('No fields to update');
    }
    
    const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');
    
    const result = await query(
      `UPDATE charts SET ${setClause} WHERE id = $1 RETURNING *`,
      [id, ...values]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const chart = toCamelCase(result.rows[0]) as Chart;
    
    // Get data points for the updated chart
    const dataPointsResult = await query(
      'SELECT * FROM data_points WHERE chart_id = $1 ORDER BY date ASC',
      [id]
    );
    
    chart.dataPoints = toCamelCase(dataPointsResult.rows) as DataPoint[];
    
    return chart;
  } catch (error) {
    throw new DatabaseError('Failed to update chart', error);
  }
}

// Delete chart
export async function deleteChart(id: string): Promise<boolean> {
  try {
    const result = await query('DELETE FROM charts WHERE id = $1', [id]);
    return result.rowCount > 0;
  } catch (error) {
    throw new DatabaseError('Failed to delete chart', error);
  }
}

// Create data point
export async function createDataPoint(dataPointData: CreateDataPointData): Promise<DataPoint> {
  try {
    const result = await query(
      `INSERT INTO data_points (chart_id, measurement, date, name)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [dataPointData.chartId, dataPointData.measurement, dataPointData.date, dataPointData.name]
    );
    
    if (result.rows.length === 0) {
      throw new DatabaseError('Failed to create data point');
    }
    
    return toCamelCase(result.rows[0]) as DataPoint;
  } catch (error) {
    throw new DatabaseError('Failed to create data point', error);
  }
}

// Update data point
export async function updateDataPoint(id: string, updateData: UpdateDataPointData): Promise<DataPoint | null> {
  try {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 2;
    
    if (updateData.measurement !== undefined) {
      fields.push(`measurement = $${paramIndex}`);
      values.push(updateData.measurement);
      paramIndex++;
    }
    
    if (updateData.date !== undefined) {
      fields.push(`date = $${paramIndex}`);
      values.push(updateData.date);
      paramIndex++;
    }
    
    if (updateData.name !== undefined) {
      fields.push(`name = $${paramIndex}`);
      values.push(updateData.name);
      paramIndex++;
    }
    
    if (fields.length === 0) {
      throw new DatabaseError('No fields to update');
    }
    
    const setClause = fields.join(', ');
    
    const result = await query(
      `UPDATE data_points SET ${setClause} WHERE id = $1 RETURNING *`,
      [id, ...values]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return toCamelCase(result.rows[0]) as DataPoint;
  } catch (error) {
    throw new DatabaseError('Failed to update data point', error);
  }
}

// Delete data point
export async function deleteDataPoint(id: string): Promise<boolean> {
  try {
    const result = await query('DELETE FROM data_points WHERE id = $1', [id]);
    return result.rowCount > 0;
  } catch (error) {
    throw new DatabaseError('Failed to delete data point', error);
  }
}

// Get data points with date range filter
export async function getDataPointsInRange(chartId: string, dateRange: DateRangeFilter): Promise<DataPoint[]> {
  try {
    const result = await query(
      `SELECT * FROM data_points 
       WHERE chart_id = $1 AND date >= $2 AND date <= $3 
       ORDER BY date ASC`,
      [chartId, dateRange.startDate, dateRange.endDate]
    );
    
    return toCamelCase(result.rows) as DataPoint[];
  } catch (error) {
    throw new DatabaseError('Failed to get data points in range', error);
  }
}

// Calculate trend line using linear regression
export function calculateTrend(dataPoints: DataPoint[]): TrendCalculation {
  if (dataPoints.length < 2) {
    return { slope: 0, intercept: 0, rSquared: 0 };
  }
  
  const n = dataPoints.length;
  const xValues = dataPoints.map((_, index) => index);
  const yValues = dataPoints.map(point => point.measurement);
  
  // Calculate means
  const xMean = xValues.reduce((sum, x) => sum + x, 0) / n;
  const yMean = yValues.reduce((sum, y) => sum + y, 0) / n;
  
  // Calculate slope and intercept using least squares method
  let numerator = 0;
  let denominator = 0;
  
  for (let i = 0; i < n; i++) {
    numerator += (xValues[i] - xMean) * (yValues[i] - yMean);
    denominator += (xValues[i] - xMean) ** 2;
  }
  
  const slope = denominator === 0 ? 0 : numerator / denominator;
  const intercept = yMean - slope * xMean;
  
  // Calculate R-squared
  let totalSumSquares = 0;
  let residualSumSquares = 0;
  
  for (let i = 0; i < n; i++) {
    const predicted = slope * xValues[i] + intercept;
    totalSumSquares += (yValues[i] - yMean) ** 2;
    residualSumSquares += (yValues[i] - predicted) ** 2;
  }
  
  const rSquared = totalSumSquares === 0 ? 0 : 1 - (residualSumSquares / totalSumSquares);
  
  return { slope, intercept, rSquared };
}

// Get chart statistics
export async function getChartStatistics(chartId: string): Promise<ChartStatistics | null> {
  try {
    const dataPointsResult = await query(
      'SELECT * FROM data_points WHERE chart_id = $1 ORDER BY date ASC',
      [chartId]
    );
    
    const dataPoints = toCamelCase(dataPointsResult.rows) as DataPoint[];
    
    if (dataPoints.length === 0) {
      return null;
    }
    
    const measurements = dataPoints.map(dp => dp.measurement);
    const dates = dataPoints.map(dp => dp.date);
    
    const totalDataPoints = dataPoints.length;
    const averageValue = measurements.reduce((sum, val) => sum + val, 0) / totalDataPoints;
    const minValue = Math.min(...measurements);
    const maxValue = Math.max(...measurements);
    const trend = calculateTrend(dataPoints);
    
    const dateRange = {
      earliest: new Date(Math.min(...dates.map(d => d.getTime()))),
      latest: new Date(Math.max(...dates.map(d => d.getTime())))
    };
    
    return {
      totalDataPoints,
      averageValue,
      minValue,
      maxValue,
      trend,
      dateRange
    };
  } catch (error) {
    throw new DatabaseError('Failed to get chart statistics', error);
  }
}

// Get unique categories for a user
export async function getUserCategories(userId: string): Promise<string[]> {
  try {
    const result = await query(
      'SELECT DISTINCT category FROM charts WHERE user_id = $1 ORDER BY category',
      [userId]
    );
    
    return result.rows.map(row => row.category);
  } catch (error) {
    throw new DatabaseError('Failed to get user categories', error);
  }
}