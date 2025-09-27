"use client";

import React from "react";
import { Button } from "@worldcoin/mini-apps-ui-kit-react";
import {
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import {
  AidType,
  EligibilityResult,
  AidTypeSelectorProps,
  AID_TYPE_ICONS,
  AID_TYPE_LABELS,
} from "@/types";

export function AidTypeSelector({
  eligibilityChecks,
  onSelect,
}: AidTypeSelectorProps) {
  // Format time remaining for display
  const formatTimeRemaining = (milliseconds: number): string => {
    const hours = Math.ceil(milliseconds / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) {
      const remainingHours = hours % 24;
      return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
    } else {
      return `${hours}h`;
    }
  };

  // Get status color based on eligibility
  const getStatusColor = (eligible: boolean): string => {
    return eligible ? "text-green-600" : "text-red-600";
  };

  // Get background color based on eligibility
  const getBackgroundColor = (eligible: boolean): string => {
    return eligible
      ? "bg-green-50 border-green-200"
      : "bg-red-50 border-red-200";
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4">
        {eligibilityChecks.map(({ aidType, eligibility }) => (
          <AidTypeCard
            key={aidType}
            aidType={aidType}
            eligibility={eligibility}
            onSelect={onSelect}
            formatTimeRemaining={formatTimeRemaining}
            getStatusColor={getStatusColor}
            getBackgroundColor={getBackgroundColor}
          />
        ))}
      </div>

      {/* Help Text */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-600 text-sm font-medium">i</span>
            </div>
          </div>
          <div className="ml-3">
            <h4 className="text-sm font-medium text-blue-900">
              Aid Distribution Guidelines
            </h4>
            <div className="mt-1 text-sm text-blue-700">
              <ul className="list-disc list-inside space-y-1">
                <li>
                  Each family has cooldown periods between aid distributions
                </li>
                <li>Green items are available for immediate distribution</li>
                <li>Red items show time remaining until next eligibility</li>
                <li>Emergency medical aid may override standard cooldowns</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Individual Aid Type Card Component
function AidTypeCard({
  aidType,
  eligibility,
  onSelect,
  formatTimeRemaining,
  getStatusColor,
  getBackgroundColor,
}: {
  aidType: AidType;
  eligibility: EligibilityResult;
  onSelect: (aidType: AidType) => void;
  formatTimeRemaining: (ms: number) => string;
  getStatusColor: (eligible: boolean) => string;
  getBackgroundColor: (eligible: boolean) => string;
}) {
  const handleSelect = () => {
    if (eligibility.eligible) {
      onSelect(aidType);
    }
  };

  return (
    <div
      className={`
        border rounded-lg p-4 transition-all duration-200
        ${
          eligibility.eligible
            ? "bg-white border-gray-200 hover:border-blue-300 hover:shadow-md cursor-pointer"
            : getBackgroundColor(eligibility.eligible)
        }
      `}
      onClick={handleSelect}
    >
      <div className="flex items-center justify-between">
        {/* Aid Type Info */}
        <div className="flex items-center space-x-3">
          <div className="text-2xl">{AID_TYPE_ICONS[aidType]}</div>
          <div>
            <h3 className="font-medium text-gray-900">
              {AID_TYPE_LABELS[aidType]}
            </h3>
            <div className="flex items-center mt-1">
              {eligibility.eligible ? (
                <>
                  <CheckCircleIcon className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600 font-medium">
                    Available Now
                  </span>
                </>
              ) : (
                <>
                  <ClockIcon className="w-4 h-4 text-red-500 mr-1" />
                  <span className="text-sm text-red-600 font-medium">
                    Available in{" "}
                    {formatTimeRemaining(eligibility.timeUntilEligible)}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Action Button or Status */}
        <div className="flex items-center">
          {eligibility.eligible ? (
            <Button
              variant="primary"
              size="sm"
              className="min-h-[36px] px-4"
              onClick={(e) => {
                e.stopPropagation();
                handleSelect();
              }}
            >
              Select
            </Button>
          ) : (
            <div className="text-right">
              <div className="text-xs text-gray-500">Last distributed</div>
              {eligibility.lastDistribution && (
                <div className="text-xs text-gray-600">
                  {new Date(
                    eligibility.lastDistribution.timestamp,
                  ).toLocaleDateString()}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Last Distribution Details (for ineligible items) */}
      {!eligibility.eligible && eligibility.lastDistribution && (
        <div className="mt-3 pt-3 border-t border-red-200">
          <div className="text-xs text-red-600 space-y-1">
            <div className="flex justify-between">
              <span>Quantity:</span>
              <span>{eligibility.lastDistribution.quantity}</span>
            </div>
            <div className="flex justify-between">
              <span>Location:</span>
              <span className="truncate ml-2 max-w-32">
                {eligibility.lastDistribution.location}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Cooldown Progress Bar (for ineligible items) */}
      {!eligibility.eligible && (
        <div className="mt-3">
          <div className="flex justify-between text-xs text-red-600 mb-1">
            <span>Cooldown Progress</span>
            <span>
              {Math.round(
                ((Date.now() - (eligibility.lastDistribution?.timestamp || 0)) /
                  (Date.now() -
                    (eligibility.lastDistribution?.timestamp || 0) +
                    eligibility.timeUntilEligible)) *
                  100,
              )}
              %
            </span>
          </div>
          <div className="w-full bg-red-200 rounded-full h-2">
            <div
              className="bg-red-500 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${Math.round(
                  ((Date.now() -
                    (eligibility.lastDistribution?.timestamp || 0)) /
                    (Date.now() -
                      (eligibility.lastDistribution?.timestamp || 0) +
                      eligibility.timeUntilEligible)) *
                    100,
                )}%`,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// Export default
export default AidTypeSelector;
