"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@worldcoin/mini-apps-ui-kit-react";
import { SewaButton } from "@/components/CustomButton";
import {
  HomeIcon,
  UserIcon,
  QrCodeIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";
import { useVolunteerSession } from "@/hooks/useVolunteerSession";

interface NavbarProps {
  title?: string;
  showBackButton?: boolean;
  className?: string;
}

export function Navbar({
  title = "SewaChain",
  showBackButton = false,
  className = "",
}: NavbarProps) {
  const router = useRouter();
  const { session: volunteerSession, logout } = useVolunteerSession();

  const handleHomeClick = () => {
    router.push("/");
  };

  const handleBackClick = () => {
    router.back();
  };

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  return (
    <nav
      className={`bg-white shadow-sm border-b border-gray-200 safe-area-top ${className}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14 sm:h-16">
          {/* Left side - Logo/Title and Navigation */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {showBackButton ? (
              <button
                onClick={handleBackClick}
                className="inline-flex items-center justify-center p-2 text-gray-600 bg-transparent border border-transparent rounded-lg hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200 min-h-[40px] touch-target"
              >
                ←
              </button>
            ) : (
              <button
                onClick={handleHomeClick}
                className="inline-flex items-center justify-center space-x-2 p-2 text-gray-600 bg-transparent border border-transparent rounded-lg hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200 min-h-[40px] touch-target"
              >
                <HomeIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">Home</span>
              </button>
            )}

            <div className="flex items-center">
              <h1 className="text-lg sm:text-xl font-bold text-gray-900 truncate">
                {title}
              </h1>
            </div>
          </div>

          {/* Right side - User info and actions */}
          <div className="flex items-center space-x-1 sm:space-x-2">
            {volunteerSession ? (
              <>
                {/* Volunteer info */}
                <div className="hidden md:flex items-center space-x-2 text-sm text-gray-600">
                  <UserIcon className="w-4 h-4" />
                  <span>{volunteerSession.volunteerId.substring(0, 8)}...</span>
                </div>

                {/* Quick actions */}
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => router.push("/volunteer/distribute-aid")}
                    className="inline-flex items-center justify-center p-2 text-gray-600 bg-transparent border border-transparent rounded-lg hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200 min-h-[40px] touch-target"
                    title="Distribute Aid"
                  >
                    <QrCodeIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>

                  <button
                    onClick={() => router.push("/volunteer/dashboard")}
                    className="inline-flex items-center justify-center p-2 text-gray-600 bg-transparent border border-transparent rounded-lg hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200 min-h-[40px] touch-target"
                    title="Dashboard"
                  >
                    <ChartBarIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>

                  <button
                    onClick={handleLogout}
                    className="inline-flex items-center justify-center px-2 sm:px-3 py-1 text-xs sm:text-sm font-medium text-gray-900 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200 min-h-[40px] touch-target"
                  >
                    <span className="hidden sm:inline">Logout</span>
                    <span className="sm:hidden">Exit</span>
                  </button>
                </div>
              </>
            ) : (
              <button
                onClick={() => router.push("/auth")}
                className="inline-flex items-center justify-center px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-white bg-blue-600 border border-blue-600 rounded-lg hover:bg-blue-700 hover:border-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 min-h-[40px] touch-target"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

// Simple navbar variant for minimal pages
export function SimpleNavbar({
  title = "SewaChain",
  className = "",
}: {
  title?: string;
  className?: string;
}) {
  const router = useRouter();

  return (
    <nav className={`bg-white shadow-sm border-b border-gray-200 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push("/")}
              className="inline-flex items-center justify-center space-x-2 p-2 text-gray-600 bg-transparent border border-transparent rounded-lg hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200 min-h-[40px] touch-target"
            >
              <HomeIcon className="w-5 h-5" />
              <span className="font-bold text-gray-900">{title}</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

// Mobile-optimized bottom navigation
export function BottomNavbar() {
  const router = useRouter();
  const { session: volunteerSession } = useVolunteerSession();

  if (!volunteerSession) return null;

  const navItems = [
    {
      icon: HomeIcon,
      label: "Home",
      path: "/",
    },
    {
      icon: QrCodeIcon,
      label: "Distribute",
      path: "/volunteer/distribute-aid",
    },
    {
      icon: ChartBarIcon,
      label: "Dashboard",
      path: "/volunteer/dashboard",
    },
    {
      icon: UserIcon,
      label: "Profile",
      path: "/volunteer/profile",
    },
  ];

  return (
    <div className="mobile-nav safe-area-bottom">
      <div className="flex justify-around items-center">
        {navItems.map((item) => (
          <button
            key={item.path}
            onClick={() => router.push(item.path)}
            className="mobile-nav-item touch-target"
          >
            <item.icon className="mobile-nav-icon" />
            <span className="mobile-nav-label">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
