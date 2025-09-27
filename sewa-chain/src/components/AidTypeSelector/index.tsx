'use client';

import { Button } from '@worldcoin/mini-apps-ui-kit-react';
import { AidTypeSelectorProps, AID_TYPE_ICONS, AID_TYPE_LABELS } from '@/types';

export function AidTypeSelector({ eligibilityChecks, onSelect }: AidTypeSelectorProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-center">Select Aid Type</h3>
      
      <div className="grid grid-cols-2 gap-4">
        {eligibilityChecks.map(({ aidType, eligibility }) => (
          <Button
            key={aidType}
            onClick={() => eligibility.eligible && onSelect(aidType)}
            disabled={!eligibility.eligible}
            className={`p-4 min-h-[120px] flex flex-col items-center justify-center ${
              eligibility.eligible ? 'bg-green-50 border-green-200' : 'bg-gray-50 opacity-60'
            }`}
          >
            <div className="text-3xl mb-2">{AID_TYPE_ICONS[aidType]}</div>
            <span className="text-sm font-medium">{AID_TYPE_LABELS[aidType]}</span>
            {!eligibility.eligible && (
              <div className="text-xs text-amber-700 mt-2">
                Available in {Math.ceil(eligibility.timeUntilEligible / (1000 * 60 * 60))}h
              </div>
            )}
          </Button>
        ))}
      </div>
    </div>
  );
}