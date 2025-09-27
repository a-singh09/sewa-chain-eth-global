"use client";

import { useState, useEffect } from "react";
import { Page } from "@/components/PageLayout";
import { StatisticsCard } from "@/components/StatisticsCard";
import { WorldMapVisualization } from "@/components/WorldMapVisualization";
import { Button } from "@worldcoin/mini-apps-ui-kit-react";
import {
  BuildingOfficeIcon,
  CurrencyDollarIcon,
  UsersIcon,
  GiftIcon,
  MapIcon,
  ShieldCheckIcon,
  ChartBarIcon,
  TrophyIcon,
  HeartIcon,
  GlobeAltIcon,
} from "@heroicons/react/24/outline";

interface VolunteerPerformance {
  id: string;
  name: string;
  nullifier: string;
  location: string;
  totalDistributions: number;
  totalFamiliesHelped: number;
  totalAidValue: number;
  isOrbVerified: boolean;
  rating: number;
  joinDate: string;
}

interface FundAllocation {
  region: string;
  amount: number;
  percentage: number;
  impact: "high" | "medium" | "low";
  familiesReached: number;
}

interface NGOAnalytics {
  totalFundsAllocated: number;
  totalVolunteers: number;
  orbVerifiedVolunteers: number;
  totalFamiliesReached: number;
  totalDistributions: number;
  activeRegions: number;
  topPerformingVolunteers: VolunteerPerformance[];
  fundAllocation: FundAllocation[];
  monthlyGrowth: number;
  impactScore: number;
}

export default function NGODashboard() {
  const [analytics, setAnalytics] = useState<NGOAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedView, setSelectedView] = useState<
    "global" | "performance" | "allocation"
  >("global");

  // Mock data for NGO analytics
  useEffect(() => {
    const mockAnalytics: NGOAnalytics = {
      totalFundsAllocated: 2450000, // $2.45M
      totalVolunteers: 342,
      orbVerifiedVolunteers: 287,
      totalFamiliesReached: 15847,
      totalDistributions: 23456,
      activeRegions: 28,
      monthlyGrowth: 23.5,
      impactScore: 94.2,
      topPerformingVolunteers: [
        {
          id: "1",
          name: "Ravi Singh",
          nullifier: "0x1a2b3c4d...",
          location: "Punjab, India",
          totalDistributions: 1247,
          totalFamiliesHelped: 892,
          totalAidValue: 45600,
          isOrbVerified: true,
          rating: 4.9,
          joinDate: "2024-03-15",
        },
        {
          id: "2",
          name: "Maria Santos",
          nullifier: "0x2b3c4d5e...",
          location: "São Paulo, Brazil",
          totalDistributions: 1156,
          totalFamiliesHelped: 734,
          totalAidValue: 38900,
          isOrbVerified: true,
          rating: 4.8,
          joinDate: "2024-02-20",
        },
        {
          id: "3",
          name: "John Miller",
          nullifier: "0x3c4d5e6f...",
          location: "New York, USA",
          totalDistributions: 1089,
          totalFamiliesHelped: 687,
          totalAidValue: 52300,
          isOrbVerified: true,
          rating: 4.7,
          joinDate: "2024-01-10",
        },
        {
          id: "4",
          name: "Fatima Al-Rashid",
          nullifier: "0x4d5e6f7g...",
          location: "Cairo, Egypt",
          totalDistributions: 956,
          totalFamiliesHelped: 623,
          totalAidValue: 28700,
          isOrbVerified: true,
          rating: 4.6,
          joinDate: "2024-04-05",
        },
        {
          id: "5",
          name: "David Kim",
          nullifier: "0x5e6f7g8h...",
          location: "Seoul, South Korea",
          totalDistributions: 847,
          totalFamiliesHelped: 567,
          totalAidValue: 41200,
          isOrbVerified: false,
          rating: 4.5,
          joinDate: "2024-05-12",
        },
      ],
      fundAllocation: [
        {
          region: "South Asia",
          amount: 687000,
          percentage: 28.1,
          impact: "high",
          familiesReached: 4892,
        },
        {
          region: "Sub-Saharan Africa",
          amount: 542000,
          percentage: 22.1,
          impact: "high",
          familiesReached: 3786,
        },
        {
          region: "Latin America",
          amount: 463000,
          percentage: 18.9,
          impact: "medium",
          familiesReached: 2934,
        },
        {
          region: "Southeast Asia",
          amount: 367000,
          percentage: 15.0,
          impact: "medium",
          familiesReached: 2156,
        },
        {
          region: "Middle East",
          amount: 245000,
          percentage: 10.0,
          impact: "medium",
          familiesReached: 1547,
        },
        {
          region: "Eastern Europe",
          amount: 146000,
          percentage: 5.9,
          impact: "low",
          familiesReached: 532,
        },
      ],
    };

    setTimeout(() => {
      setAnalytics(mockAnalytics);
      setLoading(false);
    }, 1000);
  }, []);

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "high":
        return "text-green-600 bg-green-50";
      case "medium":
        return "text-yellow-600 bg-yellow-50";
      case "low":
        return "text-red-600 bg-red-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const getVerificationIcon = (isVerified: boolean) => {
    return isVerified ? (
      <ShieldCheckIcon className="w-4 h-4 text-green-500" />
    ) : (
      <ShieldCheckIcon className="w-4 h-4 text-gray-400" />
    );
  };

  return (
    <Page className="space-y-6">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">NGO Dashboard</h1>
            <p className="text-sm text-gray-600 mt-1">
              Comprehensive analytics and volunteer performance insights
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Impact Score:</span>
            <span className="text-lg font-bold text-green-600">
              {analytics?.impactScore || 0}/100
            </span>
          </div>
        </div>
      </div>

      <div className="px-6 pb-6 space-y-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading NGO analytics...</p>
            </div>
          </div>
        ) : (
          analytics && (
            <>
              {/* Header Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatisticsCard
                  title="Total Funds Allocated"
                  value={`$${(analytics.totalFundsAllocated / 1000000).toFixed(2)}M`}
                  icon={
                    <CurrencyDollarIcon className="w-8 h-8 text-green-600" />
                  }
                  trend={{ value: 23.5, isPositive: true }}
                />
                <StatisticsCard
                  title="Active Volunteers"
                  value={analytics.totalVolunteers.toString()}
                  icon={<UsersIcon className="w-8 h-8 text-blue-600" />}
                  trend={{ value: 18.2, isPositive: true }}
                />
                <StatisticsCard
                  title="Orb Verified"
                  value={`${((analytics.orbVerifiedVolunteers / analytics.totalVolunteers) * 100).toFixed(1)}%`}
                  icon={<ShieldCheckIcon className="w-8 h-8 text-purple-600" />}
                  trend={{ value: 12.7, isPositive: true }}
                />
                <StatisticsCard
                  title="Impact Score"
                  value={`${analytics.impactScore}/100`}
                  icon={<TrophyIcon className="w-8 h-8 text-orange-500" />}
                  trend={{ value: 5.8, isPositive: true }}
                />
              </div>

              {/* Secondary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <StatisticsCard
                  title="Families Reached"
                  value={analytics.totalFamiliesReached.toLocaleString()}
                  icon={<HeartIcon className="w-8 h-8 text-red-500" />}
                  trend={{ value: 28.4, isPositive: true }}
                />
                <StatisticsCard
                  title="Total Distributions"
                  value={analytics.totalDistributions.toLocaleString()}
                  icon={<GiftIcon className="w-8 h-8 text-indigo-600" />}
                  trend={{ value: 31.2, isPositive: true }}
                />
                <StatisticsCard
                  title="Active Regions"
                  value={analytics.activeRegions.toString()}
                  icon={<GlobeAltIcon className="w-8 h-8 text-teal-600" />}
                  trend={{ value: 16.7, isPositive: true }}
                />
              </div>

              {/* World Map Visualization */}
              <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                  <div className="flex items-center space-x-3">
                    <MapIcon className="w-8 h-8 text-indigo-600" />
                    <h2 className="text-xl font-semibold text-gray-900">
                      Global Impact Distribution
                    </h2>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant={
                        selectedView === "global" ? "primary" : "secondary"
                      }
                      onClick={() => setSelectedView("global")}
                      size="sm"
                    >
                      Global View
                    </Button>
                    <Button
                      variant={
                        selectedView === "performance" ? "primary" : "secondary"
                      }
                      onClick={() => setSelectedView("performance")}
                      size="sm"
                    >
                      Performance
                    </Button>
                    <Button
                      variant={
                        selectedView === "allocation" ? "primary" : "secondary"
                      }
                      onClick={() => setSelectedView("allocation")}
                      size="sm"
                    >
                      Fund Allocation
                    </Button>
                  </div>
                </div>

                <div className="flex justify-center">
                  <WorldMapVisualization
                    className="w-full max-w-full"
                    showVolunteerData={selectedView === "performance"}
                  />
                </div>
              </div>

              {/* Two Column Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Performing Volunteers */}
                <div className="bg-white rounded-xl shadow-md p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
                      <TrophyIcon className="w-6 h-6 text-orange-500" />
                      <span>Top Performing Volunteers</span>
                    </h2>
                    <Button variant="secondary" size="sm">
                      View All
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {analytics.topPerformingVolunteers.map(
                      (volunteer, index) => (
                        <div
                          key={volunteer.id}
                          className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <span
                                  className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                                    index === 0
                                      ? "bg-yellow-100 text-yellow-800"
                                      : index === 1
                                        ? "bg-gray-100 text-gray-800"
                                        : index === 2
                                          ? "bg-orange-100 text-orange-800"
                                          : "bg-blue-100 text-blue-800"
                                  }`}
                                >
                                  {index + 1}
                                </span>
                                <h3 className="font-semibold text-gray-900">
                                  {volunteer.name}
                                </h3>
                                {getVerificationIcon(volunteer.isOrbVerified)}
                              </div>
                              <p className="text-sm text-gray-600 mb-2">
                                {volunteer.location}
                              </p>
                              <div className="grid grid-cols-2 gap-4 text-xs text-gray-600">
                                <div>
                                  <span className="font-medium text-gray-900">
                                    {volunteer.totalDistributions}
                                  </span>
                                  <p>Distributions</p>
                                </div>
                                <div>
                                  <span className="font-medium text-gray-900">
                                    {volunteer.totalFamiliesHelped}
                                  </span>
                                  <p>Families Helped</p>
                                </div>
                                <div>
                                  <span className="font-medium text-gray-900">
                                    ${volunteer.totalAidValue.toLocaleString()}
                                  </span>
                                  <p>Aid Value</p>
                                </div>
                                <div>
                                  <span className="font-medium text-gray-900">
                                    ⭐ {volunteer.rating}
                                  </span>
                                  <p>Rating</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                </div>

                {/* Fund Allocation by Region */}
                <div className="bg-white rounded-xl shadow-md p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
                      <ChartBarIcon className="w-6 h-6 text-indigo-600" />
                      <span>Fund Allocation by Region</span>
                    </h2>
                    <Button variant="secondary" size="sm">
                      Download Report
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {analytics.fundAllocation.map((allocation, index) => (
                      <div
                        key={allocation.region}
                        className="border-l-4 border-indigo-200 pl-4 py-2"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-gray-900">
                            {allocation.region}
                          </h3>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getImpactColor(allocation.impact)}`}
                          >
                            {allocation.impact} impact
                          </span>
                        </div>

                        <div className="flex items-center justify-between mb-2">
                          <span className="text-lg font-bold text-gray-900">
                            ${(allocation.amount / 1000).toFixed(0)}K
                          </span>
                          <span className="text-sm text-gray-600">
                            {allocation.percentage}% of total
                          </span>
                        </div>

                        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                          <div
                            className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${allocation.percentage}%` }}
                          ></div>
                        </div>

                        <p className="text-sm text-gray-600">
                          {allocation.familiesReached.toLocaleString()} families
                          reached
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Total Allocated:</span>
                      <span className="font-semibold text-gray-900">
                        ${(analytics.totalFundsAllocated / 1000000).toFixed(2)}M
                      </span>
                    </div>
                    <div className="flex justify-between text-sm mt-1">
                      <span className="text-gray-600">
                        Total Families Reached:
                      </span>
                      <span className="font-semibold text-gray-900">
                        {analytics.totalFamiliesReached.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Insights */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-100 rounded-xl p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <BuildingOfficeIcon className="w-8 h-8 text-indigo-600" />
                  <h2 className="text-xl font-semibold text-gray-900">
                    NGO Impact Summary
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-indigo-600 mb-2">
                      {(
                        (analytics.orbVerifiedVolunteers /
                          analytics.totalVolunteers) *
                        100
                      ).toFixed(1)}
                      %
                    </div>
                    <p className="text-sm text-gray-700">
                      Orb Verification Rate
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      {analytics.orbVerifiedVolunteers} of{" "}
                      {analytics.totalVolunteers} volunteers
                    </p>
                  </div>

                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600 mb-2">
                      $
                      {(
                        analytics.totalFundsAllocated /
                        analytics.totalFamiliesReached
                      ).toFixed(0)}
                    </div>
                    <p className="text-sm text-gray-700">
                      Cost Per Family Reached
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      Efficiency metric improving by 15.3%
                    </p>
                  </div>

                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600 mb-2">
                      {(
                        analytics.totalDistributions / analytics.totalVolunteers
                      ).toFixed(0)}
                    </div>
                    <p className="text-sm text-gray-700">
                      Avg Distributions/Volunteer
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      23.5% increase from last month
                    </p>
                  </div>
                </div>
              </div>
            </>
          )
        )}
      </div>
    </Page>
  );
}
