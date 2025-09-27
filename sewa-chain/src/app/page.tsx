'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Page } from '@/components/PageLayout';
import { SewaLogo } from '@/components/SewaLogo';
import { UserTypeCard } from '@/components/UserTypeCard';
import { 
  DuplicatePreventionFeature, 
  BlockchainTransparencyFeature, 
  RealTimeTrackingFeature 
} from '@/components/FeatureHighlight';
import { Button } from '@worldcoin/mini-apps-ui-kit-react';

type UserType = 'volunteer' | 'beneficiary' | null;

export default function HomePage() {
  const [selectedUserType, setSelectedUserType] = useState<UserType>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleUserTypeSelection = (type: 'volunteer' | 'beneficiary') => {
    setSelectedUserType(type);
  };

  const handleGetStarted = async () => {
    if (!selectedUserType) return;
    
    setIsLoading(true);
    try {
      // Navigate to appropriate auth flow
      if (selectedUserType === 'volunteer') {
        router.push('/auth?type=volunteer');
      } else {
        router.push('/auth?type=beneficiary');
      }
    } catch (error) {
      console.error('Navigation error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Page>
      <Page.Main className="min-h-screen">
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-8 text-center">
          <div className="max-w-4xl mx-auto">
            {/* Logo */}
            <div className="flex justify-center mb-8">
              <SewaLogo size="lg" variant="light" showText={true} />
            </div>

            {/* Hero Content */}
            <div className="space-y-6 mb-12">
              <h1 className="sewa-text-hero text-gray-900 max-w-3xl mx-auto">
                Eliminate Duplicate Aid Distribution Through{' '}
                <span className="bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                  Blockchain Coordination
                </span>
              </h1>
              
              <p className="sewa-text-subtitle max-w-2xl mx-auto">
                SewaChain ensures every flood relief donation reaches unique families through 
                verified identity and transparent blockchain tracking on World Chain.
              </p>
            </div>

            {/* User Type Selection */}
            <div className="mb-16">
              <h2 className="text-2xl font-semibold text-gray-900 mb-8">
                Choose Your Role
              </h2>
              
              <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                <UserTypeCard
                  type="volunteer"
                  title="For Volunteers"
                  description="Help coordinate aid distribution with verified identity and real-time tracking. Make every donation count."
                  icon={
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  }
                  onSelect={() => handleUserTypeSelection('volunteer')}
                  isSelected={selectedUserType === 'volunteer'}
                />
                
                <UserTypeCard
                  type="beneficiary"
                  title="For Beneficiaries"
                  description="Receive aid efficiently with transparent tracking. Get the help you need with verified family registration."
                  icon={
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2v0a2 2 0 012-2h6.5l1 1H21l-3 6 3 6H8.5l-1-1H5a2 2 0 01-2-2z" />
                    </svg>
                  }
                  onSelect={() => handleUserTypeSelection('beneficiary')}
                  isSelected={selectedUserType === 'beneficiary'}
                />
              </div>

              {/* Call to Action */}
              {selectedUserType && (
                <div className="mt-8 fade-in">
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={handleGetStarted}
                    disabled={isLoading}
                    className="px-8 py-3 text-lg font-semibold"
                  >
                    {isLoading ? 'Loading...' : `Get Started as ${selectedUserType === 'volunteer' ? 'Volunteer' : 'Beneficiary'}`}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Feature Highlights */}
        <section className="bg-gray-50 py-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                How SewaChain Prevents Duplicate Distribution
              </h2>
              <p className="sewa-text-subtitle max-w-2xl mx-auto">
                Our blockchain-powered system ensures transparent, efficient, and fair aid distribution.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              <DuplicatePreventionFeature animationDelay={100} />
              <BlockchainTransparencyFeature animationDelay={200} />
              <RealTimeTrackingFeature animationDelay={300} />
            </div>
          </div>
        </section>

        {/* Call to Action Section */}
        <section className="py-16 bg-gradient-to-br from-blue-600 to-green-600">
          <div className="container mx-auto px-4 text-center">
            <div className="max-w-3xl mx-auto">
              <h2 className="text-3xl font-bold text-white mb-6">
                Join the Future of Disaster Relief
              </h2>
              <p className="text-xl text-blue-100 mb-8">
                Be part of a transparent, efficient flood relief system that ensures 
                every donation reaches those who need it most.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {!selectedUserType ? (
                  <>
                    <Button
                      variant="secondary"
                      size="lg"
                      onClick={() => setSelectedUserType('volunteer')}
                      className="bg-white text-blue-600 hover:bg-gray-50"
                    >
                      Start as Volunteer
                    </Button>
                    <Button
                      variant="tertiary"
                      size="lg"
                      onClick={() => setSelectedUserType('beneficiary')}
                      className="border-white text-white hover:bg-white hover:text-blue-600"
                    >
                      Get Aid as Beneficiary
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="secondary"
                    size="lg"
                    onClick={handleGetStarted}
                    disabled={isLoading}
                    className="bg-white text-blue-600 hover:bg-gray-50"
                  >
                    {isLoading ? 'Loading...' : 'Continue with SewaChain'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </section>
      </Page.Main>
    </Page>
  );
}
