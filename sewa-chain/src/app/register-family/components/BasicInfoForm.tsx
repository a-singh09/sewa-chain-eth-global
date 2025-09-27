"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@worldcoin/mini-apps-ui-kit-react";
import {
  UserIcon,
  MapPinIcon,
  PhoneIcon,
  UsersIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import { BasicInfoFormProps, FamilyRegistrationData } from "@/types";

const INDIAN_STATES = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Delhi",
  "Jammu and Kashmir",
  "Ladakh",
  "Puducherry",
  "Chandigarh",
  "Andaman and Nicobar Islands",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Lakshadweep",
];

export function BasicInfoForm({ onNext, initialData }: BasicInfoFormProps) {
  const [formData, setFormData] = useState<FamilyRegistrationData>({
    headOfFamily: initialData?.headOfFamily || "",
    familySize: initialData?.familySize || 1,
    location: initialData?.location || "",
    contactNumber: initialData?.contactNumber || "",
  });

  const [errors, setErrors] = useState<
    Partial<Record<keyof FamilyRegistrationData, string>>
  >({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateField = (
    field: keyof FamilyRegistrationData,
    value: string | number,
  ): string | null => {
    switch (field) {
      case "headOfFamily":
        const name = (value as string).trim();
        if (!name) return "Head of family name is required";
        if (name.length < 2) return "Name must be at least 2 characters long";
        if (name.length > 100) return "Name must be less than 100 characters";
        if (!/^[a-zA-Z\s.''-]+$/.test(name)) {
          return "Name can only contain letters, spaces, periods, apostrophes, and hyphens";
        }
        return null;

      case "familySize":
        const size = value as number;
        if (!size || size < 1) return "Family size must be at least 1";
        if (size > 50) return "Family size cannot exceed 50 members";
        if (!Number.isInteger(size))
          return "Family size must be a whole number";
        return null;

      case "location":
        if (!(value as string).trim()) return "Location is required";
        return null;

      case "contactNumber":
        const phone = (value as string).trim();
        if (!phone) return "Contact number is required";

        // Remove all non-digit characters for validation
        const digitsOnly = phone.replace(/\D/g, "");

        // Check for Indian mobile number patterns
        if (phone.startsWith("+91")) {
          if (digitsOnly.length !== 12)
            return "Indian mobile number should have 10 digits after +91";
          if (!/^[6-9]/.test(digitsOnly.slice(2)))
            return "Indian mobile number should start with 6, 7, 8, or 9";
        } else if (phone.startsWith("91") && digitsOnly.length === 12) {
          if (!/^[6-9]/.test(digitsOnly.slice(2)))
            return "Indian mobile number should start with 6, 7, 8, or 9";
        } else if (digitsOnly.length === 10) {
          if (!/^[6-9]/.test(digitsOnly))
            return "Indian mobile number should start with 6, 7, 8, or 9";
        } else if (digitsOnly.length < 10 || digitsOnly.length > 15) {
          return "Contact number should be between 10-15 digits";
        }

        return null;

      default:
        return null;
    }
  };

  const validateForm = useCallback((): boolean => {
    const newErrors: Partial<Record<keyof FamilyRegistrationData, string>> = {};

    // Validate all fields
    Object.keys(formData).forEach((key) => {
      const field = key as keyof FamilyRegistrationData;
      const error = validateField(field, formData[field]);
      if (error) {
        newErrors[field] = error;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Add a small delay to show loading state
      await new Promise((resolve) => setTimeout(resolve, 500));
      onNext(formData);
    } catch (error) {
      console.error("Form submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateField = (
    field: keyof FamilyRegistrationData,
    value: string | number,
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Real-time validation for better UX
    const error = validateField(field, value);
    setErrors((prev) => ({
      ...prev,
      [field]: error || undefined,
    }));
  };

  // Add debounced validation for better performance
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (
        formData.headOfFamily ||
        formData.contactNumber ||
        formData.location
      ) {
        // Only validate if user has started typing
        validateForm();
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [formData, validateForm]);

  return (
    <div className="space-y-6">
      <div className="text-center mb-6 sm:mb-8">
        <UsersIcon className="w-12 h-12 sm:w-16 sm:h-16 text-blue-600 mx-auto mb-3 sm:mb-4" />
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
          Family Registration
        </h2>
        <p className="text-sm sm:text-base text-gray-600 px-2">
          Enter basic family information to begin the registration process
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        {/* Head of Family */}
        <div>
          <label
            htmlFor="headOfFamily"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Head of Family Name *
          </label>
          <div className="relative">
            <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            <input
              id="headOfFamily"
              name="headOfFamily"
              type="text"
              value={formData.headOfFamily}
              onChange={(e) => updateField("headOfFamily", e.target.value)}
              placeholder="Enter full name"
              className={`w-full pl-10 pr-4 py-3 text-base border rounded-lg focus:ring-2 focus:outline-none ${
                errors.headOfFamily
                  ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                  : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
              }`}
              autoComplete="name"
              disabled={isSubmitting}
              aria-invalid={!!errors.headOfFamily}
              aria-describedby={
                errors.headOfFamily ? "headOfFamily-error" : undefined
              }
            />
          </div>
          {errors.headOfFamily && (
            <div className="mt-2 flex items-start">
              <ExclamationTriangleIcon className="w-4 h-4 text-red-500 mt-0.5 mr-1 flex-shrink-0" />
              <p id="headOfFamily-error" className="text-sm text-red-600">
                {errors.headOfFamily}
              </p>
            </div>
          )}
        </div>

        {/* Family Size */}
        <div>
          <label
            htmlFor="familySize"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Family Size *
          </label>
          <div className="relative">
            <UsersIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            <input
              id="familySize"
              name="familySize"
              type="number"
              min="1"
              max="50"
              step="1"
              value={formData.familySize}
              onChange={(e) =>
                updateField("familySize", parseInt(e.target.value) || 1)
              }
              className={`w-full pl-10 pr-4 py-3 text-base border rounded-lg focus:ring-2 focus:outline-none ${
                errors.familySize
                  ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                  : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
              }`}
              disabled={isSubmitting}
              aria-invalid={!!errors.familySize}
              aria-describedby="familySize-help familySize-error"
            />
          </div>
          {errors.familySize && (
            <div className="mt-2 flex items-start">
              <ExclamationTriangleIcon className="w-4 h-4 text-red-500 mt-0.5 mr-1 flex-shrink-0" />
              <p id="familySize-error" className="text-sm text-red-600">
                {errors.familySize}
              </p>
            </div>
          )}
          <div className="mt-2 flex items-start">
            <InformationCircleIcon className="w-4 h-4 text-blue-500 mt-0.5 mr-1 flex-shrink-0" />
            <p id="familySize-help" className="text-xs text-gray-600">
              Number of family members living together (including children and
              elderly)
            </p>
          </div>
        </div>

        {/* Location */}
        <div>
          <label
            htmlFor="location"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Location (State/District) *
          </label>
          <div className="relative">
            <MapPinIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 z-10 pointer-events-none" />
            <select
              id="location"
              name="location"
              value={formData.location}
              onChange={(e) => updateField("location", e.target.value)}
              className={`w-full pl-10 pr-10 py-3 text-base border rounded-lg bg-white appearance-none cursor-pointer min-h-[48px] touch-manipulation ${
                errors.location
                  ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                  : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
              }`}
              disabled={isSubmitting}
              aria-invalid={!!errors.location}
              aria-describedby={errors.location ? "location-error" : undefined}
              required
            >
              <option value="" disabled>
                Select your state
              </option>
              {INDIAN_STATES.map((state) => (
                <option key={state} value={state}>
                  {state}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <svg
                className="w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>
          {errors.location && (
            <div className="mt-2 flex items-start">
              <ExclamationTriangleIcon className="w-4 h-4 text-red-500 mt-0.5 mr-1 flex-shrink-0" />
              <p id="location-error" className="text-sm text-red-600">
                {errors.location}
              </p>
            </div>
          )}
        </div>

        {/* Contact Number */}
        <div>
          <label
            htmlFor="contactNumber"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Contact Number *
          </label>
          <div className="relative">
            <PhoneIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            <input
              id="contactNumber"
              name="contactNumber"
              type="tel"
              value={formData.contactNumber}
              onChange={(e) => updateField("contactNumber", e.target.value)}
              placeholder="+91 XXXXXXXXXX"
              className={`w-full pl-10 pr-4 py-3 text-base border rounded-lg focus:ring-2 focus:outline-none ${
                errors.contactNumber
                  ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                  : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
              }`}
              autoComplete="tel"
              disabled={isSubmitting}
              aria-invalid={!!errors.contactNumber}
              aria-describedby="contactNumber-help contactNumber-error"
            />
          </div>
          {errors.contactNumber && (
            <div className="mt-2 flex items-start">
              <ExclamationTriangleIcon className="w-4 h-4 text-red-500 mt-0.5 mr-1 flex-shrink-0" />
              <p id="contactNumber-error" className="text-sm text-red-600">
                {errors.contactNumber}
              </p>
            </div>
          )}
          <div className="mt-2 flex items-start">
            <InformationCircleIcon className="w-4 h-4 text-blue-500 mt-0.5 mr-1 flex-shrink-0" />
            <p id="contactNumber-help" className="text-xs text-gray-600">
              Include country code (e.g., +91 for India). This will be used for
              emergency contact.
            </p>
          </div>
        </div>

        <Button
          type="submit"
          variant="primary"
          className="w-full min-h-[52px] touch-manipulation text-base font-medium"
          disabled={
            isSubmitting ||
            Object.keys(errors).some(
              (key) => errors[key as keyof FamilyRegistrationData],
            )
          }
        >
          {isSubmitting ? (
            <div className="flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3" />
              Processing...
            </div>
          ) : (
            "Continue to Aadhaar Verification"
          )}
        </Button>
      </form>

      {/* Form Progress and Security Note */}
      <div className="space-y-3">
        {/* Form Completion Indicator */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-blue-700 font-medium">Form Progress</span>
            <span className="text-blue-600">
              {
                Object.values(formData).filter((value) =>
                  typeof value === "string" ? value.trim() : value > 0,
                ).length
              }{" "}
              / 4 fields completed
            </span>
          </div>
          <div className="mt-2 w-full bg-blue-100 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${
                  (Object.values(formData).filter((value) =>
                    typeof value === "string" ? value.trim() : value > 0,
                  ).length /
                    4) *
                  100
                }%`,
              }}
            />
          </div>
        </div>

        {/* Security and Privacy Note */}
        <div className="text-center space-y-2">
          <p className="text-xs text-gray-600">
            * Required fields. Your information is secured with end-to-end
            encryption.
          </p>
          <p className="text-xs text-green-600 flex items-center justify-center">
            <svg
              className="w-3 h-3 mr-1"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                clipRule="evenodd"
              />
            </svg>
            SSL encrypted and GDPR compliant
          </p>
        </div>
      </div>
    </div>
  );
}
