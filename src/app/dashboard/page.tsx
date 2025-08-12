// Main dashboard page with chart grid display

"use client";

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { LoadingPage } from '../../components/ui/LoadingSpinner';
import { ChartGrid } from '../../components/charts/ChartGrid';
import { ChartFilters } from '../../components/charts/ChartFilters';
import { CreateChartButton } from '../../components/charts/CreateChartButton';
import CSVImportButton from '../../components/charts/CSVImportButton';
import { Chart } from '../../types/chart';

interface DashboardStats {
    totalCharts: number;
    totalDataPoints: number;
    chartsWithData: number;
    recentActivity: string;
}

const DashboardPage: React.FC = () => {
    const { data: session, status } = useSession();
    const router = useRouter();

    const [charts, setCharts] = useState<Chart[]>([]);
    const [filteredCharts, setFilteredCharts] = useState<Chart[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isFiltering, setIsFiltering] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentFilters, setCurrentFilters] = useState<{
        search?: string;
        category?: string;
    }>({});

    // Redirect to login if not authenticated
    useEffect(() => {
        if (status === 'loading') return;

        if (!session) {
            router.push('/auth/login');
            return;
        }
    }, [session, status, router]);

    // Load charts and categories
    const loadDashboardData = async () => {
        try {
            setIsLoading(true);
            setError(null);

            // Load charts
            const chartsResponse = await fetch('/api/charts');
            if (!chartsResponse.ok) {
                throw new Error('Failed to load charts');
            }
            const chartsData = await chartsResponse.json();

            setCharts(chartsData.charts || []);
            setFilteredCharts(chartsData.charts || []);

            // Extract unique categories
            const uniqueCategories = Array.from(
                new Set((chartsData.charts || []).map((chart: Chart) => chart.category))
            ).sort() as string[];
            setCategories(uniqueCategories);

            // Calculate dashboard statistics
            const totalCharts = chartsData.charts?.length || 0;
            const totalDataPoints = (chartsData.charts || []).reduce(
                (sum: number, chart: Chart) => sum + (chart.dataPoints?.length || 0),
                0
            );
            const chartsWithData = (chartsData.charts || []).filter(
                (chart: Chart) => chart.dataPoints && chart.dataPoints.length > 0
            ).length;

            // Find most recent activity
            let mostRecentDate: Date | null = null;
            (chartsData.charts || []).forEach((chart: Chart) => {
                if (chart.dataPoints && chart.dataPoints.length > 0) {
                    chart.dataPoints.forEach(dp => {
                        const dpDate = new Date(dp.createdAt);
                        if (!mostRecentDate || dpDate > mostRecentDate) {
                            mostRecentDate = dpDate;
                        }
                    });
                }
            });

            const recentActivity = mostRecentDate
                ? (mostRecentDate as Date).toLocaleDateString()
                : 'No activity yet';
            setStats({
                totalCharts,
                totalDataPoints,
                chartsWithData,
                recentActivity,
            });

        } catch (error) {
            console.error('Dashboard loading error:', error);
            setError('Failed to load dashboard data. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    // Initial data load
    useEffect(() => {
        if (session) {
            loadDashboardData();
        }
    }, [session]);

    // Handle filter changes
    const handleFiltersChange = async (filters: { search?: string; category?: string }) => {
        setCurrentFilters(filters);
        setIsFiltering(true);

        try {
            // Apply filters to the existing charts data
            let filtered = [...charts];

            // Apply search filter
            if (filters.search) {
                const searchTerm = filters.search.toLowerCase();
                filtered = filtered.filter(chart =>
                    chart.name.toLowerCase().includes(searchTerm) ||
                    chart.category.toLowerCase().includes(searchTerm)
                );
            }

            // Apply category filter
            if (filters.category) {
                filtered = filtered.filter(chart => chart.category === filters.category);
            }

            setFilteredCharts(filtered);
        } catch (error) {
            console.error('Filter error:', error);
        } finally {
            setIsFiltering(false);
        }
    };

    // Handle chart creation
    const handleChartCreated = (newChart: Chart) => {
        setCharts(prev => [newChart, ...prev]);

        // Update filtered charts if no filters are active
        if (!currentFilters.search && !currentFilters.category) {
            setFilteredCharts(prev => [newChart, ...prev]);
        }

        // Update categories if new category
        if (!categories.includes(newChart.category)) {
            setCategories(prev => [...prev, newChart.category].sort());
        }

        // Update stats
        if (stats) {
            setStats(prev => prev ? {
                ...prev,
                totalCharts: prev.totalCharts + 1,
            } : null);
        }
    };

    // Handle chart deletion
    const handleChartDeleted = async (chartId: string) => {
        try {
            const response = await fetch(`/api/charts/${chartId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                throw new Error('Failed to delete chart');
            }

            // Remove from both charts arrays
            setCharts(prev => prev.filter(chart => chart.id !== chartId));
            setFilteredCharts(prev => prev.filter(chart => chart.id !== chartId));

            // Update stats
            if (stats) {
                const deletedChart = charts.find(chart => chart.id === chartId);
                const deletedDataPoints = deletedChart?.dataPoints?.length || 0;

                setStats(prev => prev ? {
                    ...prev,
                    totalCharts: prev.totalCharts - 1,
                    totalDataPoints: prev.totalDataPoints - deletedDataPoints,
                    chartsWithData: deletedDataPoints > 0 ? prev.chartsWithData - 1 : prev.chartsWithData,
                } : null);
            }

        } catch (error) {
            console.error('Delete error:', error);
            setError('Failed to delete chart. Please try again.');
        }
    };

    // Handle chart editing - navigate to full-view chart page
    const handleChartEdit = (chart: Chart) => {
        router.push(`/charts/${chart.id}`);
    };

    // Show loading state
    if (status === 'loading' || isLoading) {
        return (
            <div className="container mx-auto p-4">
                <div className="flex items-center justify-center min-h-[400px]">
                    <LoadingPage message="Loading your dashboard..." />
                </div>
            </div>
        );
    }

    // Show error state
    if (error) {
        return (
            <div className="container mx-auto p-4">
                <div className="flex items-center justify-center min-h-[400px]">
                    <Card className="max-w-md">
                        <CardContent className="pt-6 text-center">
                            <div className="mx-auto h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                                <svg className="h-8 w-8 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-medium text-foreground mb-2">Something went wrong</h3>
                            <p className="text-muted-foreground mb-4">{error}</p>
                            <Button onClick={loadDashboardData}>
                                Try Again
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 space-y-6">
            {/* Dashboard Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
                    <p className="text-muted-foreground">
                        Track and visualize your personal data
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                    <CSVImportButton onImportSuccess={handleChartCreated} />
                    <CreateChartButton onChartCreated={handleChartCreated} />
                </div>
            </div>

            {/* Dashboard Statistics */}
            {stats && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-primary">{stats.totalCharts}</div>
                                <div className="text-sm text-muted-foreground">Total Charts</div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-chart-1">{stats.totalDataPoints}</div>
                                <div className="text-sm text-muted-foreground">Data Points</div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-chart-2">{stats.chartsWithData}</div>
                                <div className="text-sm text-muted-foreground">Active Charts</div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-center">
                                <div className="text-xs font-medium text-muted-foreground mb-1">Last Activity</div>
                                <div className="text-sm font-medium">{stats.recentActivity}</div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Search and Filters */}
            <Card>
                <CardHeader>
                    <CardTitle>Your Charts</CardTitle>
                </CardHeader>
                <CardContent>
                    <ChartFilters
                        onFiltersChange={handleFiltersChange}
                        categories={categories}
                        isLoading={isFiltering}
                    />
                </CardContent>
            </Card>

            {/* Charts Grid */}
            <div className="space-y-4">
                {/* Results Summary */}
                {(currentFilters.search || currentFilters.category) && (
                    <div className="text-sm text-muted-foreground">
                        Showing {filteredCharts.length} of {charts.length} charts
                        {currentFilters.search && ` matching "${currentFilters.search}"`}
                        {currentFilters.category && ` in "${currentFilters.category}"`}
                    </div>
                )}

                {/* Chart Grid */}
                <ChartGrid
                    charts={filteredCharts}
                    isLoading={isFiltering}
                    onDeleteChart={handleChartDeleted}
                    onEditChart={handleChartEdit}
                />

                {/* Empty State for Filtered Results */}
                {!isFiltering && filteredCharts.length === 0 && charts.length > 0 && (
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-center py-8">
                                <div className="mx-auto h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                                    <svg className="h-8 w-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-medium text-foreground mb-2">No charts found</h3>
                                <p className="text-muted-foreground mb-4">
                                    Try adjusting your search or filter criteria
                                </p>
                                <Button
                                    variant="outline"
                                    onClick={() => handleFiltersChange({})}
                                >
                                    Clear Filters
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
};

export default DashboardPage;