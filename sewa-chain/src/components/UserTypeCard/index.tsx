import React from "react";

interface UserTypeCardProps {
  type: "volunteer" | "beneficiary";
  title: string;
  description: string;
  icon: React.ReactNode;
  onSelect: () => void;
  isSelected?: boolean;
  className?: string;
}

export const UserTypeCard: React.FC<UserTypeCardProps> = ({
  type,
  title,
  description,
  icon,
  onSelect,
  isSelected = false,
  className = "",
}) => {
  const baseClasses = `
    relative p-4 sm:p-6 rounded-xl border-2 transition-all duration-200 cursor-pointer
    touch-target card-hover focus-ring bg-white card-mobile
    ${
      isSelected
        ? "border-blue-600 shadow-lg ring-2 ring-blue-600 ring-opacity-20"
        : "border-gray-200 hover:border-blue-300 hover:shadow-md"
    }
  `;

  const handleClick = () => {
    onSelect();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onSelect();
    }
  };

  return (
    <div
      className={`${baseClasses} ${className}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`Select ${title}`}
      aria-pressed={isSelected}
    >
      {/* Selection Indicator */}
      {isSelected && (
        <div className="absolute top-3 sm:top-4 right-3 sm:right-4">
          <div className="w-5 h-5 sm:w-6 sm:h-6 bg-blue-600 rounded-full flex items-center justify-center">
            <svg
              className="w-3 h-3 sm:w-4 sm:h-4 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </div>
      )}

      {/* Icon */}
      <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 mb-3 sm:mb-4 bg-blue-50 rounded-lg">
        <div className="text-blue-600">{icon}</div>
      </div>

      {/* Content */}
      <div className="space-y-2">
        <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
          {title}
        </h3>
        <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
          {description}
        </p>
      </div>

      {/* Call to Action */}
      <div className="mt-4">
        <div
          className={`
          inline-flex items-center text-sm font-medium transition-colors
          ${
            isSelected
              ? "text-blue-700"
              : "text-blue-600 group-hover:text-blue-700"
          }
        `}
        >
          Get Started
          <svg
            className="ml-1 w-4 h-4"
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

      {/* User Type Badge */}
      <div className="absolute top-0 left-6 transform -translate-y-1/2">
        <span
          className={`
          px-3 py-1 text-xs font-medium rounded-full
          ${
            type === "volunteer"
              ? "bg-green-100 text-green-800"
              : "bg-orange-100 text-orange-800"
          }
        `}
        >
          {type === "volunteer" ? "Volunteer" : "Beneficiary"}
        </span>
      </div>
    </div>
  );
};

export default UserTypeCard;
