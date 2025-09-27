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

  const handleNGOAuth = () => {
    // Navigate to NGO dashboard (in a real app, this would have proper auth)
    router.push("/ngo/dashboard");
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
            className="force-white-text w-full mb-4 !text-white"
            style={{ color: "white !important" }}
          >
            <span
              className="!text-white font-semibold"
              style={{ color: "white !important" }}
            >
              Go to Dashboard
            </span>
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
            <Button
              onClick={() => router.push("/")}
              variant="primary"
              className="force-white-text !text-white"
              style={{ color: "white !important" }}
            >
              <span
                className="!text-white font-semibold"
                style={{ color: "white !important" }}
              >
                Return to Home
              </span>
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
                className="force-white-text btn-mobile btn-mobile-full !text-white"
                style={{ color: "white !important" }}
              >
                <span
                  className="!text-white font-semibold"
                  style={{ color: "white !important" }}
                >
                  Verify with World ID
                </span>
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
                className="force-white-text btn-mobile btn-mobile-full !text-white"
                style={{ color: "white !important" }}
              >
                <span
                  className="!text-white font-semibold"
                  style={{ color: "white !important" }}
                >
                  Register as Beneficiary
                </span>
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
  } else if (userType === "ngo") {
    return (
      <Page>
        <Page.Header className="p-0">
          <Navbar title="NGO Access" showBackButton={true} />
        </Page.Header>
        <Page.Main className="flex-1 flex flex-col justify-center items-center p-6 bg-gradient-to-br from-purple-50 to-indigo-50">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full border border-purple-100">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                NGO Dashboard Access
              </h2>
              <p className="text-gray-600 text-sm">
                Access comprehensive analytics and volunteer management
              </p>
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                As an NGO, you can:
              </h3>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• Monitor global aid distribution impact</li>
                <li>• Track volunteer performance and verification</li>
                <li>• Analyze fund allocation efficiency</li>
                <li>• Identify areas needing more support</li>
                <li>• Generate comprehensive impact reports</li>
              </ul>
            </div>

            <div className="space-y-4">
              <Button
                variant="primary"
                size="lg"
                className="force-white-text w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 !text-white"
                style={{ color: "white !important" }}
                onClick={handleNGOAuth}
              >
                <span
                  className="!text-white font-semibold"
                  style={{ color: "white !important" }}
                >
                  Access NGO Dashboard
                </span>
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
            <Button
              onClick={() => router.push("/")}
              variant="primary"
              className="force-white-text !text-white"
              style={{ color: "white !important" }}
            >
              <span
                className="!text-white font-semibold"
                style={{ color: "white !important" }}
              >
                Return to Home
              </span>
            </Button>
          </div>
        </div>
      </Page>
    );
  }
}
