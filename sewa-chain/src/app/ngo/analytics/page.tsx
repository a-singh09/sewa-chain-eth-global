"use client";

import { useState, useEffect } from "react";
import { Page } from "@/components/PageLayout";
import { StatisticsCard } from "@/components/StatisticsCard";
import { WorldMapVisualization } from "@/components/WorldMapVisualization";
import { Button } from "@worldcoin/mini-apps-ui-kit-react";
import {
  ChartBarIcon,
  CurrencyDollarIcon,
  ClockIcon,
  MapPinIcon,
  ArrowTrendingUpIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";

interface RegionAnalytics {
  region: string;
  country: string;
  totalSpent: number;
  familiesReached: number;
  volunteersActive: number;
  needsMoreHelp: boolean;
  growthRate: number;
  avgResponseTime: number; // in hours
}

interface VolunteerRegionData {
  region: string;
  totalVolunteers: number;
  orbVerified: number;
  avgRating: number;
  totalDistributions: number;
  needsAttention: boolean;
}

export default function NGOAnalytics() {
  const [regionData, setRegionData] = useState<RegionAnalytics[]>([]);
  const [volunteerData, setVolunteerData] = useState<VolunteerRegionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState<
    "spending" | "volunteers" | "impact"
  >("spending");

  useEffect(() => {
    // Mock detailed regional data
    const mockRegionData: RegionAnalytics[] = [
      {
        region: "South Asia",
        country: "India",
        totalSpent: 687000,
        familiesReached: 4892,
        volunteersActive: 89,
        needsMoreHelp: false,
        growthRate: 32.4,
        avgResponseTime: 2.3,
      },
      {
        region: "Sub-Saharan Africa",
        country: "Kenya",
        totalSpent: 542000,
        familiesReached: 3786,
        volunteersActive: 67,
        needsMoreHelp: true,
        growthRate: 45.7,
        avgResponseTime: 4.1,
      },
      {
        region: "Latin America",
        country: "Brazil",
        totalSpent: 463000,
        familiesReached: 2934,
        volunteersActive: 54,
        needsMoreHelp: false,
        growthRate: 23.8,
        avgResponseTime: 3.2,
      },
      {
        region: "Southeast Asia",
        country: "Thailand",
        totalSpent: 367000,
        familiesReached: 2156,
        volunteersActive: 42,
        needsMoreHelp: true,
        growthRate: 18.5,
        avgResponseTime: 5.7,
      },
      {
        region: "Middle East",
        country: "Egypt",
        totalSpent: 245000,
        familiesReached: 1547,
        volunteersActive: 31,
        needsMoreHelp: true,
        growthRate: 12.3,
        avgResponseTime: 6.2,
      },
      {
        region: "Eastern Europe",
        country: "Poland",
        totalSpent: 146000,
        familiesReached: 532,
        volunteersActive: 18,
        needsMoreHelp: false,
        growthRate: 8.7,
        avgResponseTime: 2.8,
      },
    ];

    const mockVolunteerData: VolunteerRegionData[] = [
      {
        region: "South Asia",
        totalVolunteers: 89,
        orbVerified: 78,
        avgRating: 4.7,
        totalDistributions: 12450,
        needsAttention: false,
      },
      {
        region: "Sub-Saharan Africa",
        totalVolunteers: 67,
        orbVerified: 52,
        avgRating: 4.5,
        totalDistributions: 8934,
        needsAttention: false,
      },
      {
        region: "Latin America",
        totalVolunteers: 54,
        orbVerified: 48,
        avgRating: 4.6,
        totalDistributions: 6723,
        needsAttention: false,
      },
      {
        region: "Southeast Asia",
        totalVolunteers: 42,
        orbVerified: 31,
        avgRating: 4.2,
        totalDistributions: 4567,
        needsAttention: true,
      },
      {
        region: "Middle East",
        totalVolunteers: 31,
        orbVerified: 23,
        avgRating: 4.1,
        totalDistributions: 3245,
        needsAttention: true,
      },
      {
        region: "Eastern Europe",
        totalVolunteers: 18,
        orbVerified: 17,
        avgRating: 4.8,
        totalDistributions: 1876,
        needsAttention: false,
      },
    ];

    setTimeout(() => {
      setRegionData(mockRegionData);
      setVolunteerData(mockVolunteerData);
      setLoading(false);
    }, 1000);
  }, []);

  const totalStats = {
    totalSpent: regionData.reduce((sum, r) => sum + r.totalSpent, 0),
    totalFamilies: regionData.reduce((sum, r) => sum + r.familiesReached, 0),
    totalVolunteers: volunteerData.reduce(
      (sum, v) => sum + v.totalVolunteers,
      0,
    ),
    avgVerificationRate:
      volunteerData.length > 0
        ? (volunteerData.reduce(
            (sum, v) => sum + v.orbVerified / v.totalVolunteers,
            0,
          ) /
            volunteerData.length) *
          100
        : 0,
  };

  const regionsNeedingHelp = regionData.filter((r) => r.needsMoreHelp);
  const underperformingVolunteerRegions = volunteerData.filter(
    (v) => v.needsAttention,
  );

  return (
    <Page className="space-y-6">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              NGO Advanced Analytics
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Deep insights into regional spending, volunteer performance, and
              areas needing attention
            </p>
          </div>
          <div className="flex space-x-2">
            <Button
              variant={selectedMetric === "spending" ? "primary" : "secondary"}
              onClick={() => setSelectedMetric("spending")}
              size="sm"
            >
              Spending Analysis
            </Button>
            <Button
              variant={
                selectedMetric === "volunteers" ? "primary" : "secondary"
              }
              onClick={() => setSelectedMetric("volunteers")}
              size="sm"
            >
              Volunteer Metrics
            </Button>
            <Button
              variant={selectedMetric === "impact" ? "primary" : "secondary"}
              onClick={() => setSelectedMetric("impact")}
              size="sm"
            >
              Impact Analysis
            </Button>
          </div>
        </div>
      </div>

      <div className="px-6 pb-6 space-y-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading advanced analytics...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatisticsCard
                title="Total Regional Spending"
                value={`$${(totalStats.totalSpent / 1000000).toFixed(2)}M`}
                icon={<CurrencyDollarIcon className="w-8 h-8 text-green-600" />}
                trend={{ value: 28.7, isPositive: true }}
              />
              <StatisticsCard
                title="Families Impacted"
                value={totalStats.totalFamilies.toLocaleString()}
                icon={<UserGroupIcon className="w-8 h-8 text-blue-600" />}
                trend={{ value: 34.2, isPositive: true }}
              />
              <StatisticsCard
                title="Active Volunteers"
                value={totalStats.totalVolunteers.toString()}
                icon={<ShieldCheckIcon className="w-8 h-8 text-purple-600" />}
                trend={{ value: 19.4, isPositive: true }}
              />
              <StatisticsCard
                title="Avg Verification Rate"
                value={`${totalStats.avgVerificationRate.toFixed(1)}%`}
                icon={
                  <ArrowTrendingUpIcon className="w-8 h-8 text-orange-500" />
                }
                trend={{ value: 12.3, isPositive: true }}
              />
            </div>

            {/* World Map with Context */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center space-x-3 mb-6">
                <ChartBarIcon className="w-8 h-8 text-indigo-600" />
                <h2 className="text-xl font-semibold text-gray-900">
                  Global{" "}
                  {selectedMetric === "spending"
                    ? "Spending"
                    : selectedMetric === "volunteers"
                      ? "Volunteer"
                      : "Impact"}{" "}
                  Distribution
                </h2>
              </div>

              <div className="flex justify-center">
                <WorldMapVisualization
                  className="w-full max-w-full"
                  showVolunteerData={selectedMetric === "volunteers"}
                />
              </div>
            </div>

            {/* Alert Areas */}
            {(regionsNeedingHelp.length > 0 ||
              underperformingVolunteerRegions.length > 0) && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <ExclamationTriangleIcon className="w-6 h-6 text-amber-600" />
                  <h3 className="text-lg font-semibold text-amber-800">
                    Areas Requiring Attention
                  </h3>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {regionsNeedingHelp.length > 0 && (
                    <div>
                      <h4 className="font-medium text-amber-800 mb-2">
                        Regions Needing More Help
                      </h4>
                      <div className="space-y-2">
                        {regionsNeedingHelp.map((region) => (
                          <div
                            key={region.region}
                            className="bg-white rounded-lg p-3 border border-amber-200"
                          >
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="font-medium text-gray-900">
                                  {region.region}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {region.country}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-medium text-amber-700">
                                  Avg Response: {region.avgResponseTime}h
                                </p>
                                <p className="text-xs text-gray-600">
                                  {region.familiesReached.toLocaleString()}{" "}
                                  families
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {underperformingVolunteerRegions.length > 0 && (
                    <div>
                      <h4 className="font-medium text-amber-800 mb-2">
                        Volunteer Performance Issues
                      </h4>
                      <div className="space-y-2">
                        {underperformingVolunteerRegions.map((region) => (
                          <div
                            key={region.region}
                            className="bg-white rounded-lg p-3 border border-amber-200"
                          >
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="font-medium text-gray-900">
                                  {region.region}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {region.totalVolunteers} volunteers
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-medium text-amber-700">
                                  Rating: ⭐ {region.avgRating}
                                </p>
                                <p className="text-xs text-gray-600">
                                  {(
                                    (region.orbVerified /
                                      region.totalVolunteers) *
                                    100
                                  ).toFixed(0)}
                                  % verified
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Detailed Regional Analysis */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Regional Spending Analysis */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
                    <CurrencyDollarIcon className="w-6 h-6 text-green-600" />
                    <span>Regional Spending Breakdown</span>
                  </h2>
                  <Button variant="secondary" size="sm">
                    Export Data
                  </Button>
                </div>

                <div className="space-y-4">
                  {regionData.map((region, index) => (
                    <div
                      key={region.region}
                      className="border-l-4 border-green-200 pl-4 py-3 bg-gray-50 rounded-r-lg"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {region.region}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {region.country}
                          </p>
                        </div>
                        <div className="text-right">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              region.needsMoreHelp
                                ? "bg-red-100 text-red-800"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            {region.needsMoreHelp ? "Needs Help" : "Stable"}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Total Spent</p>
                          <p className="font-bold text-green-700">
                            ${(region.totalSpent / 1000).toFixed(0)}K
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">Families Reached</p>
                          <p className="font-bold text-blue-700">
                            {region.familiesReached.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">Growth Rate</p>
                          <p className="font-bold text-purple-700">
                            +{region.growthRate}%
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">Response Time</p>
                          <p className="font-bold text-orange-700">
                            {region.avgResponseTime}h
                          </p>
                        </div>
                      </div>

                      <div className="mt-3">
                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                          <span>
                            Cost per family: $
                            {(
                              region.totalSpent / region.familiesReached
                            ).toFixed(0)}
                          </span>
                          <span>
                            {region.volunteersActive} active volunteers
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full transition-all duration-300"
                            style={{
                              width: `${(region.totalSpent / Math.max(...regionData.map((r) => r.totalSpent))) * 100}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Volunteer Performance by Region */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
                    <UserGroupIcon className="w-6 h-6 text-blue-600" />
                    <span>Volunteer Performance by Region</span>
                  </h2>
                  <Button variant="secondary" size="sm">
                    View Details
                  </Button>
                </div>

                <div className="space-y-4">
                  {volunteerData.map((region) => (
                    <div
                      key={region.region}
                      className="border-l-4 border-blue-200 pl-4 py-3 bg-gray-50 rounded-r-lg"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {region.region}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {region.totalVolunteers} volunteers
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600">
                            ⭐ {region.avgRating}
                          </span>
                          {region.needsAttention && (
                            <ExclamationTriangleIcon className="w-4 h-4 text-amber-500" />
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                        <div>
                          <p className="text-gray-600">Orb Verified</p>
                          <p className="font-bold text-purple-700">
                            {region.orbVerified}/{region.totalVolunteers} (
                            {(
                              (region.orbVerified / region.totalVolunteers) *
                              100
                            ).toFixed(0)}
                            %)
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">Total Distributions</p>
                          <p className="font-bold text-green-700">
                            {region.totalDistributions.toLocaleString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex justify-between items-center">
                        <div className="text-xs text-gray-600">
                          Avg:{" "}
                          {(
                            region.totalDistributions / region.totalVolunteers
                          ).toFixed(0)}{" "}
                          distributions/volunteer
                        </div>
                        <div className="w-1/2 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-300 ${
                              region.needsAttention
                                ? "bg-amber-500"
                                : "bg-blue-600"
                            }`}
                            style={{
                              width: `${(region.orbVerified / region.totalVolunteers) * 100}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Summary Insights */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-100 rounded-xl p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <ArrowTrendingUpIcon className="w-6 h-6 text-indigo-600" />
                <span>Key Insights & Recommendations</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg p-4">
                  <h3 className="font-semibold text-indigo-900 mb-2">
                    Highest Impact Region
                  </h3>
                  <p className="text-2xl font-bold text-indigo-600 mb-1">
                    {regionData.length > 0
                      ? regionData.reduce((prev, current) =>
                          prev.familiesReached > current.familiesReached
                            ? prev
                            : current,
                        ).region
                      : "Loading..."}
                  </p>
                  <p className="text-sm text-gray-600">
                    {regionData.length > 0
                      ? regionData
                          .reduce((prev, current) =>
                            prev.familiesReached > current.familiesReached
                              ? prev
                              : current,
                          )
                          .familiesReached.toLocaleString()
                      : "0"}{" "}
                    families reached
                  </p>
                </div>

                <div className="bg-white rounded-lg p-4">
                  <h3 className="font-semibold text-green-900 mb-2">
                    Most Cost-Effective
                  </h3>
                  <p className="text-2xl font-bold text-green-600 mb-1">
                    {regionData.length > 0
                      ? regionData.reduce((prev, current) =>
                          prev.totalSpent / prev.familiesReached <
                          current.totalSpent / current.familiesReached
                            ? prev
                            : current,
                        ).region
                      : "Loading..."}
                  </p>
                  <p className="text-sm text-gray-600">
                    $
                    {regionData.length > 0
                      ? (
                          regionData.reduce((prev, current) =>
                            prev.totalSpent / prev.familiesReached <
                            current.totalSpent / current.familiesReached
                              ? prev
                              : current,
                          ).totalSpent /
                          regionData.reduce((prev, current) =>
                            prev.totalSpent / prev.familiesReached <
                            current.totalSpent / current.familiesReached
                              ? prev
                              : current,
                          ).familiesReached
                        ).toFixed(0)
                      : "0"}{" "}
                    per family
                  </p>
                </div>

                <div className="bg-white rounded-lg p-4">
                  <h3 className="font-semibold text-purple-900 mb-2">
                    Priority Focus Area
                  </h3>
                  <p className="text-2xl font-bold text-purple-600 mb-1">
                    {regionsNeedingHelp.length > 0
                      ? regionsNeedingHelp[0].region
                      : "All Stable"}
                  </p>
                  <p className="text-sm text-gray-600">
                    {regionsNeedingHelp.length > 0
                      ? `${regionsNeedingHelp[0].avgResponseTime}h avg response`
                      : "No immediate concerns"}
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </Page>
  );
}
