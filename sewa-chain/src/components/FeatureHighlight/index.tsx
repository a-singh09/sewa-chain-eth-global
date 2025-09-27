import React from 'react';

interface FeatureHighlightProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  animationDelay?: number;
  className?: string;
}

export const FeatureHighlight: React.FC<FeatureHighlightProps> = ({
  icon,
  title,
  description,
  animationDelay = 0,
  className = '',
}) => {
  return (
    <div
      className={`
        p-6 bg-white rounded-xl border border-gray-200 
        hover:border-blue-200 hover:shadow-md
        transition-all duration-300 fade-in
        ${className}
      `}
      style={{ 
        animationDelay: `${animationDelay}ms` 
      }}
    >
      {/* Icon Container */}
      <div className="flex items-center justify-center w-14 h-14 mb-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
        <div className="text-blue-600 text-2xl">
          {icon}
        </div>
      </div>

      {/* Content */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-900 leading-tight">
          {title}
        </h3>
        <p className="text-gray-600 leading-relaxed text-sm">
          {description}
        </p>
      </div>

      {/* Visual Accent */}
      <div className="mt-4 h-1 w-12 bg-gradient-to-r from-blue-600 to-green-600 rounded-full"></div>
    </div>
  );
};

// Preset feature components for flood relief context
export const DuplicatePreventionFeature: React.FC<{ animationDelay?: number }> = ({ animationDelay }) => (
  <FeatureHighlight
    icon={
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    }
    title="Duplicate Prevention"
    description="Unique family IDs prevent multiple distributions to the same household, ensuring fair aid distribution to all families in need."
    animationDelay={animationDelay}
  />
);

export const BlockchainTransparencyFeature: React.FC<{ animationDelay?: number }> = ({ animationDelay }) => (
  <FeatureHighlight
    icon={
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
    }
    title="Blockchain Transparency"
    description="All aid distributions are permanently recorded on World Chain, providing complete audit trail and ensuring accountability."
    animationDelay={animationDelay}
  />
);

export const RealTimeTrackingFeature: React.FC<{ animationDelay?: number }> = ({ animationDelay }) => (
  <FeatureHighlight
    icon={
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    }
    title="Real-Time Tracking"
    description="Live dashboard shows distribution progress and impact metrics, providing immediate visibility into ongoing relief efforts."
    animationDelay={animationDelay}
  />
);

export default FeatureHighlight;