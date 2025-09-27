'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useVolunteerSession } from '@/hooks/useVolunteerSession';
import { Page } from '@/components/PageLayout';
import { QRScanner } from '@/components/QRScanner';
import { AidTypeSelector } from '@/components/AidTypeSelector';
import { Button, Input } from '@worldcoin/mini-apps-ui-kit-react';
import { 
  QrCodeIcon, 
  GiftIcon, 
  ClockIcon, 
  CheckCircleIcon,
  ArrowPathIcon,
  ArrowRightOnRectangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { AidType, DistributionEligibility } from '@/types';
import { getContractService } from '@/services/ContractService';

export default function DistributeAidPage() {
  const router = useRouter();
  const { session, isAuthenticated, isLoading: sessionLoading } = useVolunteerSession();
  const [scannedURID, setScannedURID] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [eligibilityChecks, setEligibilityChecks] = useState<DistributionEligibility[]>([]);
  const [selectedAidType, setSelectedAidType] = useState<AidType | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [location, setLocation] = useState('');
  const [distributionResult, setDistributionResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isEligibilityLoading, setIsEligibilityLoading] = useState(false);

  // Check authentication
  useEffect(() => {
    if (!sessionLoading && !isAuthenticated) {
      router.push('/volunteer/verify');
    }
  }, [isAuthenticated, sessionLoading, router]);

  // Check eligibility when a URID is scanned
  useEffect(() => {
    if (scannedURID) {
      checkEligibility();
    }
  }, [scannedURID]);

  const checkEligibility = async () => {
    if (!scannedURID) return;
    
    setIsEligibilityLoading(true);
    setError(null);
    setEligibilityChecks([]);
    
    try {
      // Check eligibility for all aid types
      const aidTypes: AidType[] = [
        AidType.FOOD,
        AidType.MEDICAL,
        AidType.SHELTER,
        AidType.CLOTHING,
        AidType.WATER,
        AidType.CASH
      ];
      
      const eligibilityPromises = aidTypes.map(async (aidType) => {
        try {
          const response = await fetch(`/api/distributions/history?urid=${scannedURID}&aidType=${aidType}`);
          const result = await response.json();
          
          return {
            aidType,
            eligibility: result.success ? { 
              eligible: result.eligible, 
              timeUntilEligible: result.timeUntilEligible || 0 
            } : {
              eligible: false,
              timeUntilEligible: 0
            }
          };
        } catch (error) {
          return {
            aidType,
            eligibility: { eligible: false, timeUntilEligible: 0 }
          };
        }
      });
      
      const eligibilityResults = await Promise.all(eligibilityPromises);
      setEligibilityChecks(eligibilityResults);
    } catch (err) {
      setError('Failed to check eligibility');
      console.error('Eligibility check error:', err);
    } finally {
      setIsEligibilityLoading(false);
    }
  };

  const handleQRScan = (urid: string) => {
    setScannedURID(urid);
    setDistributionResult(null);
    setSelectedAidType(null);
    setQuantity(1);
    setLocation('');
    setError(null);
  };

  const handleAidTypeSelect = (aidType: AidType) => {
    const eligibility = eligibilityChecks.find(e => e.aidType === aidType)?.eligibility;
    if (eligibility?.eligible) {
      setSelectedAidType(aidType);
    }
  };

  const handleRecordDistribution = async () => {
    if (!scannedURID || !selectedAidType || !session || !location.trim()) {
      setError('Please complete all required fields');
      return;
    }

    if (quantity <= 0) {
      setError('Quantity must be greater than 0');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Prepare distribution data
      const distributionData = {
        urid: scannedURID,
        volunteerSession: session.sessionToken || 'mock-session',
        distribution: {
          aidType: selectedAidType,
          quantity,
          location: location.trim(),
        }
      };

      // Call API to record distribution
      const response = await fetch('/api/distributions/record', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(distributionData),
      });

      const result = await response.json();

      if (result.success) {
        setDistributionResult({
          success: true,
          distributionId: result.distributionId,
          transactionHash: result.transactionHash,
        });
        // Show success message
      } else {
        setError(result.error?.message || 'Failed to record distribution');
      }
    } catch (err) {
      setError('Network error occurred');
      console.error('Distribution recording error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartNew = () => {
    setScannedURID(null);
    setSelectedAidType(null);
    setQuantity(1);
    setLocation('');
    setDistributionResult(null);
    setError(null);
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
      <div className="max-w-4xl mx-auto p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <GiftIcon className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Distribute Aid</h1>
          </div>
          <Button
            onClick={() => router.push('/volunteer/dashboard')}
            variant="secondary"
            className="flex items-center space-x-2"
          >
            <ArrowRightOnRectangleIcon className="w-4 h-4" />
            <span>Dashboard</span>
          </Button>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-xl shadow-md p-6">
          {distributionResult ? (
            // Success screen
            <div className="text-center py-8">
              <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Distribution Recorded!</h2>
              <p className="text-gray-600 mb-6">
                Aid distribution has been successfully recorded on the blockchain.
              </p>
              
              <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">URID:</span>
                    <p className="font-mono">{scannedURID}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Aid Type:</span>
                    <p>{selectedAidType}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Quantity:</span>
                    <p>{quantity}</p>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Location:</span>
                    <p>{location}</p>
                  </div>
                </div>
                
                {distributionResult.transactionHash && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <span className="font-medium text-gray-700">Transaction Hash:</span>
                    <p className="font-mono text-sm break-all mt-1">{distributionResult.transactionHash}</p>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  onClick={handleStartNew}
                  variant="primary"
                  className="min-h-[44px]"
                >
                  Record Another Distribution
                </Button>
                <Button
                  onClick={() => router.push('/volunteer/dashboard')}
                  variant="secondary"
                  className="min-h-[44px]"
                >
                  Go to Dashboard
                </Button>
              </div>
            </div>
          ) : !scannedURID ? (
            // QR Scanner screen
            <div>
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                  <QrCodeIcon className="w-8 h-8 text-blue-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Scan Beneficiary URID</h2>
                <p className="text-gray-600">
                  Scan the QR code or enter the URID of the beneficiary family to distribute aid
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex items-start space-x-3">
                  <InformationCircleIcon className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-medium text-gray-900">How it works:</h3>
                    <ol className="text-sm text-gray-600 list-decimal list-inside space-y-1 mt-1">
                      <li>Scan the beneficiary's URID QR code</li>
                      <li>Check eligibility for different aid types</li>
                      <li>Select aid type and enter details</li>
                      <li>Record distribution on blockchain</li>
                    </ol>
                  </div>
                </div>
              </div>

              <QRScanner
                onScan={handleQRScan}
                onError={(err) => setError(err)}
                isActive={true}
                className="mb-6"
              />

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <p className="text-red-700">{error}</p>
                </div>
              )}
            </div>
          ) : (
            // Distribution form screen
            <div>
              <div className="text-center mb-6">
                <CheckCircleIcon className="w-12 h-12 text-green-500 mx-auto mb-2" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Beneficiary Found</h2>
                <p className="text-gray-600">
                  URID: <span className="font-mono font-bold">{scannedURID}</span>
                </p>
              </div>

              {isEligibilityLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Checking eligibility...</p>
                </div>
              ) : (
                <>
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Aid Type</h3>
                    <AidTypeSelector 
                      eligibilityChecks={eligibilityChecks} 
                      onSelect={handleAidTypeSelect} 
                    />
                  </div>

                  {selectedAidType && (
                    <div className="space-y-4">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-blue-800 font-medium">
                          Selected: {selectedAidType} aid for this family
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Quantity/Amount
                        </label>
                        <Input
                          type="number"
                          min="1"
                          value={quantity}
                          onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-full"
                          placeholder="Enter quantity"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Distribution Location
                        </label>
                        <Input
                          type="text"
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          className="w-full"
                          placeholder="Enter location where aid was distributed"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          This helps track where aid is being distributed
                        </p>
                      </div>

                      {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                          <p className="text-red-700">{error}</p>
                        </div>
                      )}

                      <div className="flex flex-col sm:flex-row gap-3 pt-4">
                        <Button
                          onClick={handleRecordDistribution}
                          disabled={isLoading}
                          variant="primary"
                          className="min-h-[44px] flex-1"
                        >
                          {isLoading ? (
                            <span className="flex items-center justify-center">
                              <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" />
                              Recording...
                            </span>
                          ) : (
                            'Record Distribution'
                          )}
                        </Button>
                        
                        <Button
                          onClick={() => setScannedURID(null)}
                          variant="secondary"
                          className="min-h-[44px] flex-1"
                        >
                          Scan Another
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Help Section */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Need help? Contact your coordinator or visit our support center.</p>
        </div>
      </div>
    </Page>
  );
}