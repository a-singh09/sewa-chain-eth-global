'use client';

import React, { useState } from 'react';
import { Button, Input, Select } from '@worldcoin/mini-apps-ui-kit-react';
import { 
  UserIcon, 
  MapPinIcon, 
  PhoneIcon, 
  UsersIcon 
} from '@heroicons/react/24/outline';
import { BasicInfoFormProps, FamilyRegistrationData } from '@/types';

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Puducherry', 'Chandigarh',
  'Andaman and Nicobar Islands', 'Dadra and Nagar Haveli and Daman and Diu',
  'Lakshadweep'
];

export function BasicInfoForm({ onNext, initialData }: BasicInfoFormProps) {
  const [formData, setFormData] = useState<FamilyRegistrationData>({
    headOfFamily: initialData?.headOfFamily || '',
    familySize: initialData?.familySize || 1,
    location: initialData?.location || '',
    contactNumber: initialData?.contactNumber || ''
  });
  
  const [errors, setErrors] = useState<Partial<Record<keyof FamilyRegistrationData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof FamilyRegistrationData, string>> = {};

    // Head of Family validation
    if (!formData.headOfFamily.trim()) {
      newErrors.headOfFamily = 'Head of family name is required';
    } else if (formData.headOfFamily.trim().length < 2) {
      newErrors.headOfFamily = 'Name must be at least 2 characters long';
    } else if (!/^[a-zA-Z\s.]+$/.test(formData.headOfFamily.trim())) {
      newErrors.headOfFamily = 'Name can only contain letters, spaces, and periods';
    }

    // Family Size validation
    if (formData.familySize < 1 || formData.familySize > 20) {
      newErrors.familySize = 'Family size must be between 1 and 20';
    }

    // Location validation
    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
    }

    // Contact Number validation
    if (!formData.contactNumber.trim()) {
      newErrors.contactNumber = 'Contact number is required';
    } else if (!/^[+]?[\d\s\-()]{10,15}$/.test(formData.contactNumber.trim())) {
      newErrors.contactNumber = 'Please enter a valid contact number (10-15 digits)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Add a small delay to show loading state
      await new Promise(resolve => setTimeout(resolve, 500));
      onNext(formData);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateField = (field: keyof FamilyRegistrationData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <UsersIcon className="w-16 h-16 text-blue-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Family Registration
        </h2>
        <p className="text-gray-600">
          Enter basic family information to begin the registration process
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Head of Family */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Head of Family Name *
          </label>
          <div className="relative">
            <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              value={formData.headOfFamily}
              onChange={(e) => updateField('headOfFamily', e.target.value)}
              placeholder="Enter full name"
              className={`pl-10 min-h-[44px] ${errors.headOfFamily ? 'border-red-300 focus:ring-red-500' : ''}`}
              autoComplete="name"
              disabled={isSubmitting}
            />
          </div>
          {errors.headOfFamily && (
            <p className="mt-1 text-sm text-red-600">{errors.headOfFamily}</p>
          )}
        </div>

        {/* Family Size */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Family Size *
          </label>
          <div className="relative">
            <UsersIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="number"
              min="1"
              max="20"
              value={formData.familySize}
              onChange={(e) => updateField('familySize', parseInt(e.target.value) || 1)}
              className={`pl-10 min-h-[44px] ${errors.familySize ? 'border-red-300 focus:ring-red-500' : ''}`}
              disabled={isSubmitting}
            />
          </div>
          {errors.familySize && (
            <p className="mt-1 text-sm text-red-600">{errors.familySize}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            Number of family members living together
          </p>
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Location (State/District) *
          </label>
          <div className="relative">
            <MapPinIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 z-10" />
            <Select
              value={formData.location}
              onValueChange={(value) => updateField('location', value)}
              placeholder="Select your state"
              className={`pl-10 min-h-[44px] ${errors.location ? 'border-red-300' : ''}`}
              disabled={isSubmitting}
            >
              {INDIAN_STATES.map((state) => (
                <Select.Item key={state} value={state}>
                  {state}
                </Select.Item>
              ))}
            </Select>
          </div>
          {errors.location && (
            <p className="mt-1 text-sm text-red-600">{errors.location}</p>
          )}
        </div>

        {/* Contact Number */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Contact Number *
          </label>
          <div className="relative">
            <PhoneIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="tel"
              value={formData.contactNumber}
              onChange={(e) => updateField('contactNumber', e.target.value)}
              placeholder="+91 XXXXXXXXXX"
              className={`pl-10 min-h-[44px] ${errors.contactNumber ? 'border-red-300 focus:ring-red-500' : ''}`}
              autoComplete="tel"
              disabled={isSubmitting}
            />
          </div>
          {errors.contactNumber && (
            <p className="mt-1 text-sm text-red-600">{errors.contactNumber}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            Include country code (e.g., +91 for India)
          </p>
        </div>

        <Button 
          type="submit" 
          variant="primary" 
          className="w-full min-h-[44px] touch-manipulation"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <div className="flex items-center justify-center">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Processing...
            </div>
          ) : (
            'Continue to Aadhaar Verification'
          )}
        </Button>
      </form>

      {/* Accessibility note */}
      <div className="text-center">
        <p className="text-xs text-gray-500">
          * Required fields. Your information is secured with end-to-end encryption.
        </p>
      </div>
    </div>
  );
}