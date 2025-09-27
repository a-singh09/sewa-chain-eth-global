"use client";

import React, { useState, useEffect } from "react";
import { MiniKit } from "@worldcoin/minikit-js";
import { useWorldChainContracts } from "@/hooks/useWorldChainContracts";
import { useVolunteerSession } from "@/hooks/useVolunteerSession";
import { AidType } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";

/**
 * World Chain Integration Demo Component
 * Shows actual blockchain integration with World Chain contracts
 */
export function WorldChainIntegration() {
  const { session, isAuthenticated } = useVolunteerSession();
  const {
    registerFamily,
    recordDistribution,
    validateFamily,
    checkEligibility,
    getFamilyInfo,
    getTotalFamilies,
    getVolunteerStats,
    isLoading,
    error,
    isConfigured,
    configErrors,
  } = useWorldChainContracts();

  // State for family registration
  const [familyAadhaar, setFamilyAadhaar] = useState("");
  const [familySize, setFamilySize] = useState(1);
  const [registrationResult, setRegistrationResult] = useState<any>(null);

  // State for distribution recording
  const [distributionAadhaar, setDistributionAadhaar] = useState("");
  const [aidType, setAidType] = useState<AidType>(AidType.FOOD);
  const [quantity, setQuantity] = useState(1);
  const [location, setLocation] = useState("");
  const [distributionResult, setDistributionResult] = useState<any>(null);

  // State for family validation
  const [validationAadhaar, setValidationAadhaar] = useState("");
  const [validationResult, setValidationResult] = useState<any>(null);

  // State for statistics
  const [stats, setStats] = useState<any>(null);

  // Load statistics on mount
  useEffect(() => {
    const loadStats = async () => {
      try {
        const [totalFamilies, volunteerStats] = await Promise.all([
          getTotalFamilies(),
          getVolunteerStats(),
        ]);
        setStats({ totalFamilies, volunteerStats });
      } catch (error) {
        console.error("Error loading stats:", error);
      }
    };

    if (isAuthenticated) {
      loadStats();
    }
  }, [isAuthenticated, getTotalFamilies, getVolunteerStats]);

  // Handle family registration
  const handleRegisterFamily = async () => {
    if (!familyAadhaar || familySize < 1) return;

    setRegistrationResult(null);
    const result = await registerFamily(familyAadhaar, familySize);
    setRegistrationResult(result);

    if (result.success) {
      // Refresh stats
      const totalFamilies = await getTotalFamilies();
      setStats((prev: any) => ({ ...prev, totalFamilies }));
    }
  };

  // Handle distribution recording
  const handleRecordDistribution = async () => {
    if (!distributionAadhaar || !location) return;

    setDistributionResult(null);
    const result = await recordDistribution(
      distributionAadhaar,
      aidType,
      quantity,
      location,
    );
    setDistributionResult(result);

    if (result.success) {
      // Refresh volunteer stats
      const volunteerStats = await getVolunteerStats();
      setStats((prev: any) => ({ ...prev, volunteerStats }));
    }
  };

  // Handle family validation
  const handleValidateFamily = async () => {
    if (!validationAadhaar) return;

    setValidationResult({ loading: true });

    try {
      const [isValid, familyInfo, eligibilityFood, eligibilityMedical] =
        await Promise.all([
          validateFamily(validationAadhaar),
          getFamilyInfo(validationAadhaar),
          checkEligibility(validationAadhaar, AidType.FOOD),
          checkEligibility(validationAadhaar, AidType.MEDICAL),
        ]);

      setValidationResult({
        isValid,
        familyInfo,
        eligibility: {
          [AidType.FOOD]: eligibilityFood,
          [AidType.MEDICAL]: eligibilityMedical,
        },
      });
    } catch (error) {
      setValidationResult({ error: "Validation failed" });
    }
  };

  if (!isConfigured) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-500" />
            World Chain Configuration Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              World Chain contracts are not properly configured:
              <ul className="mt-2 list-disc list-inside">
                {configErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!isAuthenticated) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>World Chain Integration</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Please authenticate as a volunteer to access World Chain features.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!MiniKit.isInstalled()) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>World Chain Integration</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              World App is required for blockchain transactions. Please open
              this app in World App.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            World Chain Integration Active
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {stats?.totalFamilies || 0}
              </div>
              <div className="text-sm text-gray-600">Total Families</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {stats?.volunteerStats?.distributionCount || 0}
              </div>
              <div className="text-sm text-gray-600">Your Distributions</div>
            </div>
            <div className="text-center">
              <Badge variant="outline" className="text-xs">
                Volunteer: {session?.volunteerId}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert>
          <XCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Family Registration */}
        <Card>
          <CardHeader>
            <CardTitle>Register Family</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="family-aadhaar">Aadhaar Number</Label>
              <Input
                id="family-aadhaar"
                type="text"
                placeholder="123456789012"
                value={familyAadhaar}
                onChange={(e) => setFamilyAadhaar(e.target.value)}
                maxLength={12}
              />
            </div>
            <div>
              <Label htmlFor="family-size">Family Size</Label>
              <Input
                id="family-size"
                type="number"
                min={1}
                max={20}
                value={familySize}
                onChange={(e) => setFamilySize(parseInt(e.target.value) || 1)}
              />
            </div>
            <Button
              onClick={handleRegisterFamily}
              disabled={isLoading || !familyAadhaar || familySize < 1}
              className="w-full"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Register on Blockchain
            </Button>

            {registrationResult && (
              <Alert>
                {registrationResult.success ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
                <AlertDescription>
                  {registrationResult.success ? (
                    <div>
                      <div>Family registered successfully!</div>
                      {registrationResult.transactionHash && (
                        <div className="mt-2">
                          <a
                            href={`https://worldchain-sepolia.blockscout.com/tx/${registrationResult.transactionHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline flex items-center gap-1"
                          >
                            View Transaction{" "}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      )}
                    </div>
                  ) : (
                    registrationResult.error
                  )}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Distribution Recording */}
        <Card>
          <CardHeader>
            <CardTitle>Record Distribution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="distribution-aadhaar">Aadhaar Number</Label>
              <Input
                id="distribution-aadhaar"
                type="text"
                placeholder="123456789012"
                value={distributionAadhaar}
                onChange={(e) => setDistributionAadhaar(e.target.value)}
                maxLength={12}
              />
            </div>
            <div>
              <Label htmlFor="aid-type">Aid Type</Label>
              <Select
                value={aidType}
                onValueChange={(value) => setAidType(value as AidType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(AidType).map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                min={1}
                max={1000}
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              />
            </div>
            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                type="text"
                placeholder="Distribution location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
            <Button
              onClick={handleRecordDistribution}
              disabled={isLoading || !distributionAadhaar || !location}
              className="w-full"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Record on Blockchain
            </Button>

            {distributionResult && (
              <Alert>
                {distributionResult.success ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
                <AlertDescription>
                  {distributionResult.success ? (
                    <div>
                      <div>Distribution recorded successfully!</div>
                      {distributionResult.transactionHash && (
                        <div className="mt-2">
                          <a
                            href={`https://worldchain-sepolia.blockscout.com/tx/${distributionResult.transactionHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline flex items-center gap-1"
                          >
                            View Transaction{" "}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      )}
                    </div>
                  ) : (
                    distributionResult.error
                  )}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Family Validation */}
      <Card>
        <CardHeader>
          <CardTitle>Validate Family</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Aadhaar Number"
              value={validationAadhaar}
              onChange={(e) => setValidationAadhaar(e.target.value)}
              maxLength={12}
            />
            <Button
              onClick={handleValidateFamily}
              disabled={!validationAadhaar}
            >
              Validate
            </Button>
          </div>

          {validationResult && (
            <div className="space-y-4">
              {validationResult.loading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Validating...</span>
                </div>
              ) : validationResult.error ? (
                <Alert>
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>{validationResult.error}</AlertDescription>
                </Alert>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Family Status</h4>
                    <Badge
                      variant={
                        validationResult.isValid ? "default" : "destructive"
                      }
                    >
                      {validationResult.isValid
                        ? "Valid & Active"
                        : "Not Found/Inactive"}
                    </Badge>
                  </div>

                  {validationResult.familyInfo && (
                    <div>
                      <h4 className="font-semibold mb-2">Family Info</h4>
                      <div className="text-sm space-y-1">
                        <div>
                          Size: {validationResult.familyInfo.familySize}
                        </div>
                        <div>
                          Registered:{" "}
                          {new Date(
                            validationResult.familyInfo.registrationTime * 1000,
                          ).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  )}

                  {validationResult.eligibility && (
                    <div className="md:col-span-2">
                      <h4 className="font-semibold mb-2">Aid Eligibility</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(validationResult.eligibility).map(
                          ([type, eligibility]: [string, any]) => (
                            <div
                              key={type}
                              className="flex items-center justify-between p-2 border rounded"
                            >
                              <span className="text-sm">{type}</span>
                              <Badge
                                variant={
                                  eligibility.eligible ? "default" : "secondary"
                                }
                              >
                                {eligibility.eligible
                                  ? "Eligible"
                                  : `Wait ${Math.ceil(eligibility.timeUntilEligible / 3600)}h`}
                              </Badge>
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default WorldChainIntegration;
