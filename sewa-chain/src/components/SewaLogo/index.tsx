import React from 'react';

interface SewaLogoProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'light' | 'dark';
  showText?: boolean;
  className?: string;
}

export const SewaLogo: React.FC<SewaLogoProps> = ({
  size = 'md',
  variant = 'light',
  showText = true,
  className = '',
}) => {
  const sizeClasses = {
    sm: showText ? 'h-8' : 'h-6 w-6',
    md: showText ? 'h-12' : 'h-8 w-8',
    lg: showText ? 'h-16' : 'h-12 w-12',
  };

  const textSizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
  };

  const colorClasses = {
    light: 'text-gray-900',
    dark: 'text-white',
  };

  const iconColor = variant === 'light' ? '#2563eb' : '#60a5fa';

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Water Drop + Chain Icon */}
      <div className={`${sizeClasses[size]} flex items-center justify-center`}>
        <svg
          viewBox="0 0 40 40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          {/* Water Drop */}
          <path
            d="M20 8C20 8 12 16 12 22C12 26.4183 15.5817 30 20 30C24.4183 30 28 26.4183 28 22C28 16 20 8 20 8Z"
            fill={iconColor}
            fillOpacity="0.8"
          />
          {/* Chain Links */}
          <circle
            cx="8"
            cy="20"
            r="3"
            fill="none"
            stroke={iconColor}
            strokeWidth="2"
          />
          <circle
            cx="32"
            cy="20"
            r="3"
            fill="none"
            stroke={iconColor}
            strokeWidth="2"
          />
          <line
            x1="11"
            y1="20"
            x2="17"
            y2="20"
            stroke={iconColor}
            strokeWidth="2"
            strokeLinecap="round"
          />
          <line
            x1="23"
            y1="20"
            x2="29"
            y2="20"
            stroke={iconColor}
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Logo Text */}
      {showText && (
        <div className="flex flex-col">
          <h1 className={`font-bold ${textSizeClasses[size]} ${colorClasses[variant]} leading-none`}>
            SewaChain
          </h1>
          {size === 'lg' && (
            <p className={`text-sm ${variant === 'light' ? 'text-gray-600' : 'text-gray-300'} leading-none mt-1`}>
              Flood Relief Coordination
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default SewaLogo;