"use client";

import React from "react";
import { BottomNavbar } from "@/components/Navbar";

interface MobileLayoutProps {
  children: React.ReactNode;
  showBottomNav?: boolean;
  className?: string;
}

export const MobileLayout: React.FC<MobileLayoutProps> = ({
  children,
  showBottomNav = false,
  className = "",
}) => {
  return (
    <div className={`min-h-screen bg-gray-50 ${className}`}>
      {children}
      {showBottomNav && <BottomNavbar />}
    </div>
  );
};

export default MobileLayout;
