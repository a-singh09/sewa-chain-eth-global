import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useVolunteerSession } from "@/hooks/useVolunteerSession";
import { Page } from "@/components/PageLayout";
import { StatisticsCard } from "@/components/StatisticsCard";
import { ActivityTimeline } from "@/components/ActivityTimeline";
import { WorldMapVisualization } from "@/components/WorldMapVisualization";
import { Button } from "@worldcoin/mini-apps-ui-kit-react";
import {
  ArrowRightOnRectangleIcon,
  ChartBarIcon,
  UsersIcon,
  GiftIcon,
  ClockIcon,
  MapIcon,
  WalletIcon,
} from "@heroicons/react/24/outline";

interface DistributionData {
  uridHash: string;
  volunteerNullifier: string;
  aidType: string;
  quantity: number;
  location: string;
  timestamp: number;
  formattedDate: string;
}

interface AnalyticsData {
  totalFamilies: number;
  totalDistributions: number;
  activeVolunteers: number;
  recentDistributions: DistributionData[];
}

export default function AnalyticsPage() {
  const router = useRouter();
  const {
    session,
    isAuthenticated,
    isLoading: sessionLoading,
  } = useVolunteerSession();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check authentication
  useEffect(() => {
    if (!sessionLoading && !isAuthenticated) {
      router.push("/volunteer/verify");
    } else if (isAuthenticated) {
      fetchAnalyticsData();
    }
  }, [isAuthenticated, sessionLoading, router]);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch distribution history for recent activity
      const recentResponse = await fetch("/api/distributions/history?limit=10");
      const recentData = await recentResponse.json();

      // For now, use mock data for statistics - in a real app these would come from separate endpoints
      if (recentResponse.ok) {
        setAnalyticsData({
          totalFamilies: 156, // Mock data - would come from API
          totalDistributions: recentData.totalCount || 0,
          activeVolunteers: 24, // Mock data - would come from API
          recentDistributions: recentData.distributions || [],
        });
      } else {
        throw new Error("Failed to fetch analytics data");
      }
    } catch (err) {
      setError("Failed to load analytics data");
      console.error("Analytics fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (sessionLoading) {
    return (
      <Page>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading session...</p>
          </div>
        </div>
      </Page>
    );
  }

  if (!isAuthenticated) {
    return null; // Redirect handled by useEffect
  }

  return (
    <Page>
      <div className="max-w-6xl mx-auto p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <ChartBarIcon className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">
              Analytics Dashboard
            </h1>
          </div>
          <Button
            onClick={() => router.push("/volunteer/dashboard")}
            variant="secondary"
            className="flex items-center space-x-2"
          >
            <ArrowRightOnRectangleIcon className="w-4 h-4" />
            <span>Dashboard</span>
          </Button>
        </div>

        {/* Loading/Error states */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}

        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <p className="text-red-700">{error}</p>
            <Button
              onClick={fetchAnalyticsData}
              variant="secondary"
              className="mt-4"
            >
              Retry
            </Button>
          </div>
        )}

        {/* Analytics Cards */}
        {!loading && !error && analyticsData && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatisticsCard
                title="Total Families"
                value={analyticsData.totalFamilies.toString()}
                icon={<UsersIcon className="w-8 h-8 text-blue-600" />}
                trend={{ value: 12, isPositive: true }}
              />
              <StatisticsCard
                title="Total Distributions"
                value={analyticsData.totalDistributions.toString()}
                icon={<GiftIcon className="w-8 h-8 text-green-600" />}
                trend={{ value: 8, isPositive: true }}
              />
              <StatisticsCard
                title="Active Volunteers"
                value={analyticsData.activeVolunteers.toString()}
                icon={<WalletIcon className="w-8 h-8 text-purple-600" />}
                trend={{ value: 15, isPositive: true }}
              />
              <StatisticsCard
                title="Today's Distributions"
                value="24"
                icon={<ClockIcon className="w-8 h-8 text-orange-500" />}
                trend={{ value: 20, isPositive: true }}
              />
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-md p-6 mb-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Recent Distributions
                </h2>
                <Button variant="secondary">View All</Button>
              </div>

              {analyticsData.recentDistributions.length > 0 ? (
                <ActivityTimeline
                  distributions={analyticsData.recentDistributions.map(
                    (item, index) => ({
                      id: `dist-${index}-${item.timestamp}`,
                      uridHash: item.uridHash,
                      volunteerNullifier: item.volunteerNullifier,
                      aidType: item.aidType as any, // Convert string to AidType enum
                      quantity: item.quantity,
                      location: item.location,
                      timestamp: item.timestamp,
                      confirmed: true, // Assume confirmed for analytics display
                    }),
                  )}
                />
              ) : (
                <div className="text-center py-8">
                  <GiftIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No recent distributions</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Distributions will appear here as they are recorded
                  </p>
                </div>
              )}
            </div>

            {/* World Map Visualization */}
            <div className="bg-white rounded-xl shadow-md p-6 mb-6">
              <div className="flex items-center space-x-3 mb-6">
                <MapIcon className="w-8 h-8 text-indigo-600" />
                <h2 className="text-xl font-semibold text-gray-900">
                  Global Support Distribution
                </h2>
              </div>

              <div className="flex justify-center">
                <WorldMapVisualization className="w-full max-w-full" />
              </div>
            </div>

            {/* Aid Type Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Aid Type Distribution */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">
                  Aid Type Distribution
                </h2>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Food</span>
                    <span className="font-medium">45%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-green-600 h-2.5 rounded-full"
                      style={{ width: "45%" }}
                    ></div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Medical</span>
                    <span className="font-medium">25%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-red-600 h-2.5 rounded-full"
                      style={{ width: "25%" }}
                    ></div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Shelter</span>
                    <span className="font-medium">20%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-blue-600 h-2.5 rounded-full"
                      style={{ width: "20%" }}
                    ></div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Other</span>
                    <span className="font-medium">10%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-yellow-600 h-2.5 rounded-full"
                      style={{ width: "10%" }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Distribution Trends */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">
                  Weekly Trends
                </h2>

                <div className="bg-gray-50 rounded-lg p-6 text-center">
                  <ChartBarIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Distribution Over Time
                  </h3>
                  <p className="text-gray-500">
                    Graph showing distribution activity over the past week
                  </p>
                  <Button variant="secondary" className="mt-4">
                    View Detailed Chart
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Help Section */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            Need help? Contact your coordinator or visit our support center.
          </p>
        </div>
      </div>
    </Page>
  );
}
