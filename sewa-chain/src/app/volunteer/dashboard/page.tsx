'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useVolunteerSession } from '@/hooks/useVolunteerSession';
import { Page } from '@/components/PageLayout';
import { Button } from '@worldcoin/mini-apps-ui-kit-react';
import {
  UserCircleIcon,
  ClockIcon,
  ShieldCheckIcon,
  UsersIcon,
  GiftIcon,
  ChartBarIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';
import { getVolunteerDisplayInfo, formatSessionTimeRemaining } from '@/lib/volunteer-session';

export default function VolunteerDashboardPage() {
  const router = useRouter();
  const { session, isAuthenticated, isLoading, logout } = useVolunteerSession();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/volunteer/verify');
    }
  }, [isAuthenticated, isLoading, router]);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  if (isLoading) {
    return (
      <Page>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading volunteer session...</p>
          </div>
        </div>
      </Page>
    );
  }

  if (!session || !isAuthenticated) {
    return null; // Will redirect in useEffect
  }

  const displayInfo = getVolunteerDisplayInfo(session);

  return (
    <Page>
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <UserCircleIcon className="w-12 h-12 text-blue-500" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Volunteer Dashboard
                </h1>
                <p className="text-gray-600">
                  Welcome, {displayInfo.id}
                </p>
              </div>
            </div>
            <Button
              onClick={handleLogout}
              variant="secondary"
              className="flex items-center space-x-2"
            >
              <ArrowRightOnRectangleIcon className="w-4 h-4" />
              <span>Logout</span>
            </Button>
          </div>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Verification Status */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <ShieldCheckIcon className="w-8 h-8 text-green-500" />
              <div>
                <h3 className="font-semibold text-green-800">Verified</h3>
                <p className="text-sm text-green-600">
                  {displayInfo.verificationLevel} Level
                </p>
              </div>
            </div>
          </div>

          {/* Session Timer */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <ClockIcon className="w-8 h-8 text-blue-500" />
              <div>
                <h3 className="font-semibold text-blue-800">Session</h3>
                <p className="text-sm text-blue-600">
                  {formatSessionTimeRemaining(session)}
                </p>
              </div>
            </div>
          </div>

          {/* Permissions */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <UsersIcon className="w-8 h-8 text-purple-500" />
              <div>
                <h3 className="font-semibold text-purple-800">Permissions</h3>
                <p className="text-sm text-purple-600">
                  {displayInfo.permissions.length} granted
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Register Beneficiaries */}
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center space-x-4 mb-4">
              <UsersIcon className="w-10 h-10 text-blue-500" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Register Beneficiaries
                </h3>
                <p className="text-gray-600">
                  Register new families with Aadhaar verification
                </p>
              </div>
            </div>
            <Button
              onClick={() => router.push('/volunteer/register-beneficiary')}
              variant="primary"
              className="w-full"
            >
              Start Registration
            </Button>
          </div>

          {/* Distribute Aid */}
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center space-x-4 mb-4">
              <GiftIcon className="w-10 h-10 text-green-500" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Distribute Aid
                </h3>
                <p className="text-gray-600">
                  Scan QR codes and record aid distribution
                </p>
              </div>
            </div>
            <Button
              onClick={() => router.push('/volunteer/distribute-aid')}
              variant="primary"
              className="w-full"
            >
              Scan and Distribute
            </Button>
          </div>
        </div>

        {/* Analytics Card */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center space-x-4 mb-4">
            <ChartBarIcon className="w-10 h-10 text-orange-500" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Distribution Analytics
              </h3>
              <p className="text-gray-600">
                View real-time distribution data and impact metrics
              </p>
            </div>
          </div>
          <Button
            onClick={() => router.push('/volunteer/analytics')}
            variant="secondary"
            className="w-full"
          >
            View Analytics Dashboard
          </Button>
        </div>

        {/* Volunteer Information */}
        <div className="mt-6 bg-gray-50 rounded-lg p-4">
          <h4 className="font-semibold text-gray-800 mb-2">Volunteer Information</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-600">Volunteer ID:</span>
              <span className="ml-2 text-gray-800">{displayInfo.id}</span>
            </div>
            <div>
              <span className="font-medium text-gray-600">Verified On:</span>
              <span className="ml-2 text-gray-800">{displayInfo.verifiedAt}</span>
            </div>
            <div>
              <span className="font-medium text-gray-600">Verification Level:</span>
              <span className="ml-2 text-gray-800">{displayInfo.verificationLevel}</span>
            </div>
            <div>
              <span className="font-medium text-gray-600">Organization:</span>
              <span className="ml-2 text-gray-800">
                {displayInfo.organizationId || 'Independent'}
              </span>
            </div>
          </div>
          <div className="mt-3">
            <span className="font-medium text-gray-600">Permissions:</span>
            <div className="mt-1 flex flex-wrap gap-2">
              {displayInfo.permissions.map((permission) => (
                <span
                  key={permission}
                  className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                >
                  {permission.replace('_', ' ').toLowerCase()}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Page>
  );
}