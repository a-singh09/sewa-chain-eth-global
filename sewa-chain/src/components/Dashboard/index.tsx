'use client';

import React, { useState, useEffect } from 'react';
import { 
  UsersIcon, 
  TruckIcon, 
  UserGroupIcon,
  ChartBarIcon 
} from '@heroicons/react/24/outline';
import { StatisticsCard } from '@/components/StatisticsCard';
import { ActivityTimeline } from '@/components/ActivityTimeline';
import { DashboardProps, DashboardStats, Distribution } from '@/types';

export function Dashboard({ userRole, refreshInterval = 30000 }: DashboardProps) {
  const [stats, setStats] = useState<DashboardStats>({
    totalFamilies: 0,
    totalDistributions: 0,
    activeVolunteers: 0,
    recentDistributions: []
  });
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch stats from contract
      const response = await fetch('/api/contract/stats');
      const contractStats = await response.json();
      
      // Fetch recent distributions
      const distributionsResponse = await fetch('/api/distributions/history?limit=10');
      const distributionsData = await distributionsResponse.json();
      
      setStats({
        totalFamilies: contractStats.totalFamilies || 0,
        totalDistributions: distributionsData.distributions?.length || 0,
        activeVolunteers: 12, // Mock data
        recentDistributions: distributionsData.distributions || []
      });
      
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    
    // Set up auto-refresh
    const interval = setInterval(fetchDashboardData, refreshInterval);
    
    return () => clearInterval(interval);
  }, [refreshInterval]);

  const mockDistributions: Distribution[] = [
    {
      id: '1',
      uridHash: '0x1234567890abcdef1234567890abcdef12345678',
      volunteerNullifier: '0xabcdef1234567890abcdef1234567890abcdef12',
      aidType: 'FOOD',
      quantity: 5,
      location: 'Mumbai, Maharashtra',
      timestamp: Date.now() - 3600000,
      confirmed: true
    },
    {
      id: '2',
      uridHash: '0x2345678901bcdef12345678901bcdef123456789',
      volunteerNullifier: '0xbcdef1234567890abcdef1234567890abcdef123',
      aidType: 'MEDICAL',
      quantity: 2,
      location: 'Delhi, India',
      timestamp: Date.now() - 7200000,
      confirmed: true
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {userRole === 'admin' ? 'Admin Dashboard' : 'Volunteer Dashboard'}
          </h1>
          <p className="text-gray-600">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        </div>
        
        <button
          onClick={fetchDashboardData}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatisticsCard
          title="Total Families"
          value={stats.totalFamilies}
          icon={<UsersIcon className="w-8 h-8" />}
          trend={{ value: 12, isPositive: true }}
        />
        
        <StatisticsCard
          title="Distributions"
          value={stats.totalDistributions}
          icon={<TruckIcon className="w-8 h-8" />}
          trend={{ value: 8, isPositive: true }}
        />
        
        <StatisticsCard
          title="Active Volunteers"
          value={stats.activeVolunteers}
          icon={<UserGroupIcon className="w-8 h-8" />}
          trend={{ value: 5, isPositive: true }}
        />
        
        <StatisticsCard
          title="Success Rate"
          value="98.5%"
          icon={<ChartBarIcon className="w-8 h-8" />}
          trend={{ value: 2, isPositive: true }}
        />
      </div>

      {/* Activity Timeline */}
      <ActivityTimeline 
        distributions={stats.recentDistributions.length > 0 ? stats.recentDistributions : mockDistributions}
        maxItems={8}
      />
      
      {/* Additional Info for Volunteers */}
      {userRole === 'volunteer' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <button className="text-left p-2 bg-white rounded border hover:bg-gray-50">
              📋 Register New Family
            </button>
            <button className="text-left p-2 bg-white rounded border hover:bg-gray-50">
              📦 Distribute Aid
            </button>
          </div>
        </div>
      )}
    </div>
  );
}