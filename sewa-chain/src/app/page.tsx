"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Page } from "@/components/PageLayout";
import { Navbar } from "@/components/Navbar";
import { SewaLogo } from "@/components/SewaLogo";
import { UserTypeCard } from "@/components/UserTypeCard";
import {
  DuplicatePreventionFeature,
  BlockchainTransparencyFeature,
  RealTimeTrackingFeature,
} from "@/components/FeatureHighlight";
import { Button } from "@worldcoin/mini-apps-ui-kit-react";

type UserType = "volunteer" | "beneficiary" | null;

export default function HomePage() {
  const [selectedUserType, setSelectedUserType] = useState<UserType>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleUserTypeSelection = (type: "volunteer" | "beneficiary") => {
    setSelectedUserType(type);
  };

  const handleGetStarted = async () => {
    if (!selectedUserType) return;

    setIsLoading(true);
    try {
      // Navigate to appropriate auth flow
      if (selectedUserType === "volunteer") {
        router.push("/auth?type=volunteer");
      } else {
        router.push("/auth?type=beneficiary");
      }
    } catch (error) {
      console.error("Navigation error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Page>
      <Page.Header className="p-0">
        <Navbar title="SewaChain" />
      </Page.Header>
      <Page.Main className="min-h-screen p-0">
        {/* Hero Section with Gradient Background */}
        <section className="relative w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12 text-center bg-gradient-to-br from-blue-50 via-white to-green-50 overflow-hidden">
          {/* Background Decorative Elements */}
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-0 left-0 w-72 h-72 bg-gradient-to-br from-blue-400/20 to-transparent rounded-full blur-3xl"></div>
            <div className="absolute top-20 right-0 w-96 h-96 bg-gradient-to-br from-green-400/20 to-transparent rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-transparent rounded-full blur-3xl"></div>
          </div>

          <div className="relative max-w-4xl mx-auto">
            {/* Logo with glow effect */}
            <div className="flex justify-center mb-8 sm:mb-10">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-green-500/20 rounded-full blur-xl"></div>
                <SewaLogo size="lg" variant="light" showText={true} />
              </div>
            </div>

            {/* Hero Content with enhanced gradients */}
            <div className="space-y-6 sm:space-y-8 mb-12 sm:mb-16">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight text-gray-900 max-w-3xl mx-auto px-2">
                Eliminate Duplicate Aid Distribution Through{" "}
                <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-green-600 bg-clip-text text-transparent animate-pulse">
                  Blockchain Coordination
                </span>
              </h1>

              <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto px-4 leading-relaxed">
                SewaChain ensures every flood relief donation reaches unique
                families through verified identity and transparent blockchain
                tracking on{" "}
                <span className="font-semibold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                  World Chain
                </span>
                .
              </p>

              {/* Feature badges */}
              <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mt-6 px-4">
                <div className="px-4 py-2 bg-gradient-to-r from-blue-100 to-blue-50 rounded-full border border-blue-200">
                  <span className="text-sm font-medium text-blue-700">
                    🔐 Identity Verified
                  </span>
                </div>
                <div className="px-4 py-2 bg-gradient-to-r from-green-100 to-green-50 rounded-full border border-green-200">
                  <span className="text-sm font-medium text-green-700">
                    ⛓️ Blockchain Secured
                  </span>
                </div>
                <div className="px-4 py-2 bg-gradient-to-r from-purple-100 to-purple-50 rounded-full border border-purple-200">
                  <span className="text-sm font-medium text-purple-700">
                    📊 Real-time Tracking
                  </span>
                </div>
              </div>
            </div>

            {/* User Type Selection with enhanced cards */}
            <div className="mb-16 sm:mb-20">
              <div className="text-center mb-8 sm:mb-12">
                <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-4 px-2">
                  Choose Your Role
                </h2>
                <p className="text-gray-600 max-w-lg mx-auto px-4">
                  Join our mission to make disaster relief more efficient and
                  transparent
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 max-w-4xl mx-auto px-2">
                <div
                  className={`relative group cursor-pointer transition-all duration-300 ${
                    selectedUserType === "volunteer"
                      ? "scale-105"
                      : "hover:scale-[1.02]"
                  }`}
                  onClick={() => handleUserTypeSelection("volunteer")}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-green-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div
                    className={`relative bg-white/80 backdrop-blur-sm border-2 rounded-2xl p-6 sm:p-8 transition-all duration-300 ${
                      selectedUserType === "volunteer"
                        ? "border-blue-500 bg-gradient-to-br from-blue-50 to-white shadow-xl shadow-blue-500/20"
                        : "border-gray-200 hover:border-blue-300 hover:shadow-lg"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div
                        className={`p-3 rounded-xl transition-colors duration-300 ${
                          selectedUserType === "volunteer"
                            ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white"
                            : "bg-blue-100 text-blue-600"
                        }`}
                      >
                        <svg
                          className="w-6 h-6"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                          />
                        </svg>
                      </div>
                      {selectedUserType === "volunteer" && (
                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                          <svg
                            className="w-4 h-4 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={3}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </div>
                      )}
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">
                      For Volunteers
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      Help coordinate aid distribution with verified identity
                      and real-time tracking. Make every donation count.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                        Coordinate
                      </span>
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                        Track
                      </span>
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full font-medium">
                        Verify
                      </span>
                    </div>
                  </div>
                </div>

                <div
                  className={`relative group cursor-pointer transition-all duration-300 ${
                    selectedUserType === "beneficiary"
                      ? "scale-105"
                      : "hover:scale-[1.02]"
                  }`}
                  onClick={() => handleUserTypeSelection("beneficiary")}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-blue-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div
                    className={`relative bg-white/80 backdrop-blur-sm border-2 rounded-2xl p-6 sm:p-8 transition-all duration-300 ${
                      selectedUserType === "beneficiary"
                        ? "border-green-500 bg-gradient-to-br from-green-50 to-white shadow-xl shadow-green-500/20"
                        : "border-gray-200 hover:border-green-300 hover:shadow-lg"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div
                        className={`p-3 rounded-xl transition-colors duration-300 ${
                          selectedUserType === "beneficiary"
                            ? "bg-gradient-to-br from-green-500 to-green-600 text-white"
                            : "bg-green-100 text-green-600"
                        }`}
                      >
                        <svg
                          className="w-6 h-6"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2v0a2 2 0 012-2h6.5l1 1H21l-3 6 3 6H8.5l-1-1H5a2 2 0 01-2-2z"
                          />
                        </svg>
                      </div>
                      {selectedUserType === "beneficiary" && (
                        <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                          <svg
                            className="w-4 h-4 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={3}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </div>
                      )}
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">
                      For Beneficiaries
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      Receive aid efficiently with transparent tracking. Get the
                      help you need with verified family registration.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                        Register
                      </span>
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                        Receive
                      </span>
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full font-medium">
                        Track
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Enhanced Call to Action */}
              {selectedUserType && (
                <div className="mt-8 sm:mt-10 fade-in px-2">
                  <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-green-600 rounded-2xl blur-lg opacity-25 group-hover:opacity-40 transition-opacity duration-300"></div>
                    <Button
                      variant="primary"
                      size="lg"
                      onClick={handleGetStarted}
                      disabled={isLoading}
                      className="relative w-full max-w-sm mx-auto min-h-[56px] px-8 py-4 text-lg font-semibold bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white border-0 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
                    >
                      {isLoading ? (
                        <div className="flex items-center justify-center">
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          Loading...
                        </div>
                      ) : (
                        <div className="flex items-center justify-center">
                          <span>
                            Get Started as{" "}
                            {selectedUserType === "volunteer"
                              ? "Volunteer"
                              : "Beneficiary"}
                          </span>
                          <svg
                            className="w-5 h-5 ml-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13 7l5 5m0 0l-5 5m5-5H6"
                            />
                          </svg>
                        </div>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Feature Highlights with modern card design */}
        <section className="relative py-16 sm:py-20 bg-gradient-to-br from-gray-50 via-white to-blue-50 overflow-hidden">
          {/* Background decorative elements */}
          <div className="absolute inset-0 opacity-40">
            <div className="absolute top-10 left-10 w-64 h-64 bg-gradient-to-br from-blue-400/20 to-transparent rounded-full blur-2xl"></div>
            <div className="absolute bottom-10 right-10 w-80 h-80 bg-gradient-to-br from-green-400/20 to-transparent rounded-full blur-2xl"></div>
          </div>

          <div className="relative w-full px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-gray-800 via-blue-800 to-green-800 bg-clip-text text-transparent mb-4 sm:mb-6 px-2">
                How SewaChain Prevents Duplicate Distribution
              </h2>
              <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto px-4 leading-relaxed">
                Our blockchain-powered system ensures transparent, efficient,
                and fair aid distribution through cutting-edge technology.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto">
              {/* Enhanced feature cards */}
              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-lg hover:shadow-xl transition-all duration-300 group-hover:border-blue-300">
                  <div className="mb-6">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25">
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
                          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                        />
                      </svg>
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">
                    Duplicate Prevention
                  </h3>
                  <p className="text-gray-600 leading-relaxed mb-4">
                    Advanced Aadhaar-based verification ensures each family
                    receives aid only once, eliminating fraud and waste.
                  </p>
                  <div className="flex items-center text-blue-600 text-sm font-medium">
                    <span>Learn more</span>
                    <svg
                      className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform duration-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-lg hover:shadow-xl transition-all duration-300 group-hover:border-green-300">
                  <div className="mb-6">
                    <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/25">
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
                          d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                        />
                      </svg>
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">
                    Blockchain Transparency
                  </h3>
                  <p className="text-gray-600 leading-relaxed mb-4">
                    Every transaction is recorded on World Chain, creating an
                    immutable and transparent aid distribution ledger.
                  </p>
                  <div className="flex items-center text-green-600 text-sm font-medium">
                    <span>Learn more</span>
                    <svg
                      className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform duration-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="group relative">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-lg hover:shadow-xl transition-all duration-300 group-hover:border-purple-300">
                  <div className="mb-6">
                    <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/25">
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
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">
                    Real-Time Tracking
                  </h3>
                  <p className="text-gray-600 leading-relaxed mb-4">
                    Live dashboard provides instant updates on aid distribution
                    progress and family verification status.
                  </p>
                  <div className="flex items-center text-purple-600 text-sm font-medium">
                    <span>Learn more</span>
                    <svg
                      className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform duration-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Enhanced Call to Action Section */}
        <section className="relative py-16 sm:py-20 bg-gradient-to-br from-blue-600 via-purple-600 to-green-600 overflow-hidden">
          {/* Animated background elements */}
          <div className="absolute inset-0">
            <div className="absolute top-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
            <div
              className="absolute bottom-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl animate-pulse"
              style={{ animationDelay: "1s" }}
            ></div>
            <div
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-white/5 rounded-full blur-2xl animate-pulse"
              style={{ animationDelay: "2s" }}
            ></div>
          </div>

          {/* Grid pattern overlay */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-y-12"></div>
          </div>

          <div className="relative w-full px-4 sm:px-6 lg:px-8 text-center">
            <div className="max-w-4xl mx-auto">
              <div className="mb-8 sm:mb-12">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6 sm:mb-8 px-2 leading-tight">
                  Join the Future of{" "}
                  <span className="relative">
                    <span className="bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
                      Disaster Relief
                    </span>
                    <div className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-yellow-300 to-orange-300 rounded-full"></div>
                  </span>
                </h2>
                <p className="text-xl sm:text-2xl text-blue-100 mb-6 sm:mb-8 px-4 leading-relaxed">
                  Be part of a transparent, efficient flood relief system that
                  ensures every donation reaches those who need it most.
                </p>

                {/* Stats section */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 mb-12 max-w-2xl mx-auto">
                  <div className="text-center">
                    <div className="text-3xl sm:text-4xl font-bold text-white mb-2">
                      100%
                    </div>
                    <div className="text-blue-200 text-sm sm:text-base">
                      Verified Families
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl sm:text-4xl font-bold text-white mb-2">
                      0
                    </div>
                    <div className="text-blue-200 text-sm sm:text-base">
                      Duplicate Distributions
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl sm:text-4xl font-bold text-white mb-2">
                      24/7
                    </div>
                    <div className="text-blue-200 text-sm sm:text-base">
                      Real-time Tracking
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center px-2">
                {!selectedUserType ? (
                  <>
                    <div className="relative group">
                      <div className="absolute inset-0 bg-white rounded-2xl blur-lg opacity-25 group-hover:opacity-40 transition-opacity duration-300"></div>
                      <Button
                        variant="secondary"
                        size="lg"
                        onClick={() => setSelectedUserType("volunteer")}
                        className="relative w-full max-w-sm mx-auto min-h-[56px] px-8 py-4 text-lg font-semibold bg-white text-blue-600 hover:bg-gray-50 border-0 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02]"
                      >
                        <div className="flex items-center justify-center">
                          <svg
                            className="w-5 h-5 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                            />
                          </svg>
                          Start as Volunteer
                        </div>
                      </Button>
                    </div>
                    <div className="relative group">
                      <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-white/30 rounded-2xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity duration-300"></div>
                      <Button
                        variant="tertiary"
                        size="lg"
                        onClick={() => setSelectedUserType("beneficiary")}
                        className="relative w-full max-w-sm mx-auto min-h-[56px] px-8 py-4 text-lg font-semibold border-2 border-white text-white hover:bg-white hover:text-blue-600 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02]"
                      >
                        <div className="flex items-center justify-center">
                          <svg
                            className="w-5 h-5 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2v0a2 2 0 012-2h6.5l1 1H21l-3 6 3 6H8.5l-1-1H5a2 2 0 01-2-2z"
                            />
                          </svg>
                          Get Aid as Beneficiary
                        </div>
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="relative group">
                    <div className="absolute inset-0 bg-white rounded-2xl blur-lg opacity-25 group-hover:opacity-40 transition-opacity duration-300"></div>
                    <Button
                      variant="secondary"
                      size="lg"
                      onClick={handleGetStarted}
                      disabled={isLoading}
                      className="relative w-full max-w-sm mx-auto min-h-[56px] px-8 py-4 text-lg font-semibold bg-white text-blue-600 hover:bg-gray-50 border-0 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02]"
                    >
                      {isLoading ? (
                        <div className="flex items-center justify-center">
                          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                          Loading...
                        </div>
                      ) : (
                        <div className="flex items-center justify-center">
                          <span>Continue with SewaChain</span>
                          <svg
                            className="w-5 h-5 ml-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13 7l5 5m0 0l-5 5m5-5H6"
                            />
                          </svg>
                        </div>
                      )}
                    </Button>
                  </div>
                )}
              </div>

              {/* Trust indicators */}
              <div className="mt-12 pt-8 border-t border-white/20">
                <p className="text-blue-200 text-sm mb-4">
                  Trusted by relief organizations worldwide
                </p>
                <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
                  <div className="flex items-center text-white text-sm">
                    <svg
                      className="w-4 h-4 mr-1"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    World Chain Verified
                  </div>
                  <div className="flex items-center text-white text-sm">
                    <svg
                      className="w-4 h-4 mr-1"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Aadhaar Secured
                  </div>
                  <div className="flex items-center text-white text-sm">
                    <svg
                      className="w-4 h-4 mr-1"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Blockchain Transparent
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </Page.Main>
    </Page>
  );
}
