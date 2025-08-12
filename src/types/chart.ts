// Chart-related TypeScript interfaces

export interface Chart {
  id: string;
  userId: string;
  name: string;
  category: string;
  dataPoints: DataPoint[];
  createdAt: Date;
  updatedAt: Date;
}

export interface DataPoint {
  id: string;
  chartId: string;
  measurement: number;
  date: Date;
  name: string;
  createdAt: Date;
}

export interface CreateChartData {
  userId: string;
  name: string;
  category: string;
}

export interface UpdateChartData {
  name?: string;
  category?: string;
}

export interface CreateDataPointData {
  chartId: string;
  measurement: number;
  date: Date;
  name: string;
}

export interface UpdateDataPointData {
  measurement?: number;
  date?: Date;
  name?: string;
}

// Database row interfaces (match database column names)
export interface ChartRow {
  id: string;
  user_id: string;
  name: string;
  category: string;
  created_at: Date;
  updated_at: Date;
}

export interface DataPointRow {
  id: string;
  chart_id: string;
  measurement: number;
  date: Date;
  name: string;
  created_at: Date;
}

// Chart filtering and search interfaces
export interface ChartFilters {
  category?: string;
  search?: string;
  userId: string;
}

export interface DateRangeFilter {
  startDate: Date | null;
  endDate: Date | null;
}

// Chart statistics and trend calculation
export interface TrendCalculation {
  slope: number;
  intercept: number;
  rSquared: number;
}

export interface ChartStatistics {
  totalDataPoints: number;
  averageValue: number;
  minValue: number;
  maxValue: number;
  trend: TrendCalculation;
  dateRange: {
    earliest: Date;
    latest: Date;
  };
}

// CSV import/export interfaces
export interface CSVDataPoint {
  measurement: number;
  date: string; // ISO 8601 format
  name: string;
  category: string;
}

export interface ImportValidationResult {
  isValid: boolean;
  errors: string[];
  validRows: CSVDataPoint[];
  totalRows: number;
}