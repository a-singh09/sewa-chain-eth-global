'use client';

import React from 'react';
import { ClockIcon } from '@heroicons/react/24/outline';
import { ActivityTimelineProps, AID_TYPE_ICONS } from '@/types';

export function ActivityTimeline({ distributions, maxItems = 10 }: ActivityTimelineProps) {
  const recentDistributions = distributions
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, maxItems);

  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  if (recentDistributions.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        <div className="text-center text-gray-500 py-8">
          <ClockIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No recent distributions</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
      
      <div className="space-y-3">
        {recentDistributions.map((distribution, index) => (
          <div key={distribution.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl">
              {AID_TYPE_ICONS[distribution.aidType]}
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">
                {distribution.aidType.toLowerCase().replace('_', ' ')} distribution
              </p>
              <p className="text-xs text-gray-500 truncate">
                URID: {distribution.uridHash.substring(0, 12)}...
              </p>
              <p className="text-xs text-gray-500">
                {distribution.location}
              </p>
            </div>
            
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">
                {distribution.quantity}
              </p>
              <p className="text-xs text-gray-500">
                {formatTime(distribution.timestamp)}
              </p>
            </div>
          </div>
        ))}
      </div>
      
      {distributions.length > maxItems && (
        <div className="mt-4 text-center">
          <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
            View All Activity
          </button>
        </div>
      )}
    </div>
  );
}