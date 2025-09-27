"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useVolunteerSession } from "@/hooks/useVolunteerSession";
import { Page } from "@/components/PageLayout";
import { Navbar } from "@/components/Navbar";
import { Button } from "@worldcoin/mini-apps-ui-kit-react";
import {
  UserCircleIcon,
  ShieldCheckIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";

export default function AuthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userType = searchParams.get("type");
  const { session, isAuthenticated, isLoading } = useVolunteerSession();

  // Check if user is already authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated && session) {
      // If already authenticated as volunteer, go to dashboard
      router.push("/volunteer/dashboard");
    }
  }, [isAuthenticated, isLoading, session, router]);

  const handleVolunteerAuth = () => {
    // Navigate to volunteer verification flow
    router.push("/volunteer/verify");
  };

  const handleBeneficiaryAuth = () => {
    // For hackathon demo, redirect beneficiaries to registration page
    router.push("/register-family");
  };

  // Show loading state
  if (isLoading) {
    return (
      <Page>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading authentication...</p>
          </div>
        </div>
      </Page>
    );
  }

  // If already authenticated, show a redirect message
  if (isAuthenticated && session) {
    return (
      <Page>
        <div className="max-w-md mx-auto p-6 text-center">
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
            <ShieldCheckIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-green-800 mb-2">
              Already Authenticated
            </h2>
            <p className="text-green-700 mb-4">
              You are already logged in as a volunteer
            </p>
          </div>

          <Button
            onClick={() => router.push("/volunteer/dashboard")}
            variant="primary"
            className="w-full mb-4"
          >
            Go to Dashboard
          </Button>

          <Button
            onClick={() => router.push("/")}
            variant="secondary"
            className="w-full"
          >
            Back to Home
          </Button>
        </div>
      </Page>
    );
  }

  // If no user type specified, redirect to home
  if (!userType) {
    useEffect(() => {
      router.push("/");
    }, [router]);

    return (
      <Page>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <ExclamationCircleIcon className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Invalid Request
            </h2>
            <p className="text-gray-600 mb-4">No user type specified</p>
            <Button onClick={() => router.push("/")} variant="primary">
              Return to Home
            </Button>
          </div>
        </div>
      </Page>
    );
  }

  // Show appropriate auth flow based on user type
  if (userType === "volunteer") {
    return (
      <Page>
        <Page.Header className="p-0">
          <Navbar title="Volunteer Auth" showBackButton={true} />
        </Page.Header>
        <Page.Main className="mobile-p">
          <div className="max-w-md mx-auto">
            {/* Header */}
            <div className="text-center mb-6 sm:mb-8">
              <UserCircleIcon className="w-12 h-12 sm:w-16 sm:h-16 text-blue-600 mx-auto mb-3 sm:mb-4" />
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                Volunteer Authentication
              </h1>
              <p className="text-sm sm:text-base text-gray-600 px-2">
                Verify your identity to become an authorized aid distributor
              </p>
            </div>

            {/* Info Card */}
            <div className="alert-mobile alert-mobile-info mb-4 sm:mb-6">
              <h3 className="font-semibold text-blue-900 mb-2">
                What you'll get:
              </h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Authority to register beneficiary families</li>
                <li>• Ability to distribute aid and record transactions</li>
                <li>• Access to distribution tracking dashboard</li>
                <li>• Secure session with World ID verification</li>
              </ul>
            </div>

            {/* Auth Options */}
            <div className="space-y-3 sm:space-y-4">
              <Button
                onClick={handleVolunteerAuth}
                variant="primary"
                className="btn-mobile btn-mobile-full"
              >
                Verify with World ID
              </Button>

              <Button
                onClick={() => router.push("/")}
                variant="secondary"
                className="btn-mobile btn-mobile-full"
              >
                Back to Home
              </Button>
            </div>

            {/* Security Notice */}
            <div className="mt-6 text-center text-xs text-gray-500">
              <p>
                Your identity will be verified using World ID for security and
                to prevent fraud.
              </p>
            </div>
          </div>
        </Page.Main>
      </Page>
    );
  } else if (userType === "beneficiary") {
    return (
      <Page>
        <Page.Header className="p-0">
          <Navbar title="Family Registration" showBackButton={true} />
        </Page.Header>
        <Page.Main className="mobile-p">
          <div className="max-w-md mx-auto">
            {/* Header */}
            <div className="text-center mb-6 sm:mb-8">
              <UserCircleIcon className="w-12 h-12 sm:w-16 sm:h-16 text-green-600 mx-auto mb-3 sm:mb-4" />
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                Beneficiary Registration
              </h1>
              <p className="text-sm sm:text-base text-gray-600 px-2">
                Register to receive aid assistance during flood relief
              </p>
            </div>

            {/* Info Card */}
            <div className="alert-mobile alert-mobile-success mb-4 sm:mb-6">
              <h3 className="font-semibold text-green-900 mb-2">
                What you'll get:
              </h3>
              <ul className="text-sm text-green-800 space-y-1">
                <li>• Unique family identifier (URID) for tracking</li>
                <li>• Secure registration with Aadhaar verification</li>
                <li>• Access to receive aid without duplication</li>
                <li>• Transparent distribution records</li>
              </ul>
            </div>

            {/* Auth Options */}
            <div className="space-y-3 sm:space-y-4">
              <div className="alert-mobile alert-mobile-success mb-3 sm:mb-4">
                <p className="text-sm text-green-800">
                  <strong>Note:</strong> As a beneficiary, you can register for
                  aid assistance.
                </p>
              </div>

              <Button
                onClick={handleBeneficiaryAuth}
                variant="primary"
                className="btn-mobile btn-mobile-full"
              >
                Register as Beneficiary
              </Button>

              <Button
                onClick={() => router.push("/")}
                variant="secondary"
                className="btn-mobile btn-mobile-full"
              >
                Back to Home
              </Button>
            </div>
          </div>
        </Page.Main>
      </Page>
    );
  } else {
    // Invalid user type
    return (
      <Page>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <ExclamationCircleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Invalid User Type
            </h2>
            <p className="text-gray-600 mb-4">
              Please select a valid user type
            </p>
            <Button onClick={() => router.push("/")} variant="primary">
              Return to Home
            </Button>
          </div>
        </div>
      </Page>
    );
  }
}
