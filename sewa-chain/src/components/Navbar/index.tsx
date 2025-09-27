"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@worldcoin/mini-apps-ui-kit-react";
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
    <nav className={`bg-white shadow-sm border-b border-gray-200 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left side - Logo/Title and Navigation */}
          <div className="flex items-center space-x-4">
            {showBackButton ? (
              <Button
                onClick={handleBackClick}
                variant="tertiary"
                className="p-2 min-h-[40px]"
              >
                ←
              </Button>
            ) : (
              <Button
                onClick={handleHomeClick}
                variant="tertiary"
                className="flex items-center space-x-2 p-2 min-h-[40px]"
              >
                <HomeIcon className="w-5 h-5" />
                <span className="hidden sm:inline">Home</span>
              </Button>
            )}

            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">{title}</h1>
            </div>
          </div>

          {/* Right side - User info and actions */}
          <div className="flex items-center space-x-2">
            {volunteerSession ? (
              <>
                {/* Volunteer info */}
                <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-600">
                  <UserIcon className="w-4 h-4" />
                  <span>{volunteerSession.volunteerId.substring(0, 8)}...</span>
                </div>

                {/* Quick actions */}
                <div className="flex items-center space-x-1">
                  <Button
                    onClick={() => router.push("/volunteer/distribute-aid")}
                    variant="tertiary"
                    className="p-2 min-h-[40px]"
                    title="Distribute Aid"
                  >
                    <QrCodeIcon className="w-5 h-5" />
                  </Button>

                  <Button
                    onClick={() => router.push("/volunteer/dashboard")}
                    variant="tertiary"
                    className="p-2 min-h-[40px]"
                    title="Dashboard"
                  >
                    <ChartBarIcon className="w-5 h-5" />
                  </Button>

                  <Button
                    onClick={handleLogout}
                    variant="secondary"
                    className="text-sm px-3 py-1 min-h-[40px]"
                  >
                    Logout
                  </Button>
                </div>
              </>
            ) : (
              <Button
                onClick={() => router.push("/auth")}
                variant="primary"
                className="text-sm px-4 py-2 min-h-[40px]"
              >
                Sign In
              </Button>
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
            <Button
              onClick={() => router.push("/")}
              variant="tertiary"
              className="flex items-center space-x-2 p-2 min-h-[40px]"
            >
              <HomeIcon className="w-5 h-5" />
              <span className="font-bold text-gray-900">{title}</span>
            </Button>
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
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 sm:hidden">
      <div className="flex justify-around items-center py-2">
        {navItems.map((item) => (
          <button
            key={item.path}
            onClick={() => router.push(item.path)}
            className="flex flex-col items-center space-y-1 p-2 text-gray-600 hover:text-blue-600 transition-colors"
          >
            <item.icon className="w-5 h-5" />
            <span className="text-xs">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
