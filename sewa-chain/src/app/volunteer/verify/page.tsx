'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { VolunteerVerification } from '@/components/VolunteerVerification';
import { useVolunteerSession } from '@/hooks/useVolunteerSession';
import { VolunteerSession, VerificationError } from '@/types';
import { Page } from '@/components/PageLayout';
import { Button } from '@worldcoin/mini-apps-ui-kit-react';
import { CheckBadgeIcon, UserIcon } from '@heroicons/react/24/outline';

export default function VolunteerVerifyPage() {
  const router = useRouter();
  const { session, isAuthenticated, login } = useVolunteerSession();
  const [isLoading, setIsLoading] = useState(false);

  const handleVolunteerVerified = async (volunteerData: VolunteerSession) => {
    setIsLoading(true);
    
    try {
      // Store session using the hook
      login(volunteerData);
      
      // Navigate to volunteer dashboard
      router.push('/volunteer/dashboard');
    } catch (error) {
      console.error('Failed to process volunteer verification:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerificationError = (error: VerificationError) => {
    console.error('Volunteer verification failed:', error);
    // Error is already displayed by the VolunteerVerification component
  };

  // If already authenticated, show success state
  if (isAuthenticated && session) {
    return (
      <Page>
        <div className="max-w-md mx-auto p-6 text-center">
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
            <CheckBadgeIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-green-800 mb-2">
              Already Verified as Volunteer
            </h2>
            <p className="text-green-700 mb-4">
              You are currently authenticated as volunteer {session.volunteerId}
            </p>
            <div className="text-sm text-green-600 mb-4">
              <p>Verification Level: <span className="font-semibold">{session.verificationLevel}</span></p>
              <p>Permissions: {session.permissions.length} granted</p>
            </div>
          </div>
          
          <Button
            onClick={() => router.push('/volunteer/dashboard')}
            variant="primary"
            className="w-full mb-4"
          >
            Go to Volunteer Dashboard
          </Button>
          
          <Button
            onClick={() => router.push('/home')}
            variant="secondary"
            className="w-full"
          >
            Back to Home
          </Button>
        </div>
      </Page>
    );
  }

  return (
    <Page>
      <div className="max-w-lg mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <UserIcon className="w-16 h-16 text-blue-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Volunteer Verification
          </h1>
          <p className="text-gray-600">
            Complete World ID verification to become an authorized volunteer for aid distribution.
          </p>
        </div>

        {/* Information Card */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-900 mb-2">What you will get:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Authority to register beneficiary families</li>
            <li>• Ability to distribute aid and record transactions</li>
            <li>• Access to distribution tracking dashboard</li>
            <li>• Secure session with Orb-level verification</li>
          </ul>
        </div>

        {/* Verification Component */}
        <VolunteerVerification
          onVerified={handleVolunteerVerified}
          onError={handleVerificationError}
          disabled={isLoading}
          className="mb-6"
        />

        {/* Back Button */}
        <Button
          onClick={() => router.push('/home')}
          variant="secondary"
          className="w-full"
          disabled={isLoading}
        >
          Back to Home
        </Button>

        {/* Help Text */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500 mb-2">
            Need help with World ID verification?
          </p>
          <a 
            href="https://docs.worldcoin.org/mini-apps" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-700 text-sm underline"
          >
            View World ID Documentation
          </a>
        </div>
      </div>
    </Page>
  );
}