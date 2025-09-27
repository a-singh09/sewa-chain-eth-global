"use client";

import { useRouter } from "next/navigation";
import { useVolunteerSession } from "@/hooks/useVolunteerSession";
import { Button } from "@worldcoin/mini-apps-ui-kit-react";
import {
  UserGroupIcon,
  CheckBadgeIcon,
  ClockIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { formatSessionTimeRemaining } from "@/lib/volunteer-session";

export function VolunteerCard() {
  const router = useRouter();
  const { session, isAuthenticated, isLoading } = useVolunteerSession();

  if (isLoading) {
    return (
      <div className="w-full max-w-sm mx-auto bg-white rounded-lg shadow-md border border-gray-200">
        <div className="p-4">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  // If volunteer is authenticated, show status
  if (isAuthenticated && session) {
    return (
      <div className="w-full max-w-sm mx-auto bg-white rounded-lg shadow-md border border-gray-200">
        <div className="p-4">
          <div className="flex items-center space-x-3 mb-3">
            <CheckBadgeIcon className="w-8 h-8 text-green-500" />
            <div>
              <h3 className="font-semibold text-green-800">
                Verified Volunteer
              </h3>
              <p className="text-sm text-green-600">{session.volunteerId}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2 mb-4">
            <ClockIcon className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">
              {formatSessionTimeRemaining(session)}
            </span>
          </div>

          <div className="space-y-2">
            <Button
              onClick={() => router.push("/volunteer/dashboard")}
              variant="primary"
              className="w-full"
            >
              Open Dashboard
            </Button>
            <Button
              onClick={() => router.push("/volunteer/distribute-aid")}
              variant="secondary"
              className="w-full"
            >
              Quick Distribute
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // If not authenticated, show verification prompt
  return (
    <div className="w-full max-w-sm mx-auto bg-white rounded-lg shadow-md border border-gray-200">
      <div className="p-4">
        <div className="flex items-center space-x-3 mb-3">
          <UserGroupIcon className="w-8 h-8 text-blue-500" />
          <div>
            <h3 className="font-semibold text-gray-900">Become a Volunteer</h3>
            <p className="text-sm text-gray-600">Verify with World ID</p>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <div className="flex items-start space-x-2">
            <ExclamationTriangleIcon className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Volunteers can:</p>
              <ul className="text-xs space-y-0.5">
                <li>• Register beneficiary families</li>
                <li>• Distribute aid securely</li>
                <li>• Track impact metrics</li>
              </ul>
            </div>
          </div>
        </div>

        <Button
          onClick={() => router.push("/volunteer/verify")}
          variant="primary"
          className="w-full"
        >
          Verify as Volunteer
        </Button>
      </div>
    </div>
  );
}
