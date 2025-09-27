"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import Globe from "globe.gl";

interface SupportData {
  lat: number;
  lng: number;
  text: string;
  supportLevel: "high" | "medium" | "low";
  value: number;
  city: string;
  country: string;
  aidDistributed: number;
  familiesHelped: number;
}

interface GlobalSupportVisualizationProps {
  width?: number;
  height?: number;
  className?: string;
  showVolunteerData?: boolean;
}

export function GlobalSupportVisualization({
  width,
  height,
  className = "",
  showVolunteerData = false,
}: GlobalSupportVisualizationProps) {
  const globeRef = useRef<HTMLDivElement>(null);
  const globeInstance = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentZoom, setCurrentZoom] = useState(2.5);
  const [dimensions, setDimensions] = useState({
    width: width || 800,
    height: height || 400,
  });

  // Handle responsive dimensions - better for mobile
  useEffect(() => {
    const updateDimensions = () => {
      if (globeRef.current) {
        const container = globeRef.current.parentElement;
        if (container) {
          const containerWidth = container.offsetWidth;
          const isMobile = window.innerWidth <= 768;
          const newWidth = Math.min(
            containerWidth - 16,
            width || (isMobile ? containerWidth : 800),
          );
          const aspectRatio = isMobile ? 0.6 : 0.7; // Better mobile ratio
          const newHeight = Math.max(
            newWidth * aspectRatio,
            isMobile ? 300 : 400,
          );

          setDimensions({
            width: newWidth,
            height: newHeight,
          });
        }
      }
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, [width, height]);

  // Mock data for different regions with varying support levels
  const mockSupportData: SupportData[] = useMemo(
    () => [
      // High support areas (large circles, green color) - India
      {
        lat: 28.6139,
        lng: 77.209,
        text: "New Delhi",
        supportLevel: "high",
        value: 95,
        city: "New Delhi",
        country: "India",
        aidDistributed: 15420,
        familiesHelped: 3855,
      },
      {
        lat: 19.076,
        lng: 72.8777,
        text: "Mumbai",
        supportLevel: "high",
        value: 89,
        city: "Mumbai",
        country: "India",
        aidDistributed: 12350,
        familiesHelped: 3087,
      },
      {
        lat: 12.9716,
        lng: 77.5946,
        text: "Bangalore",
        supportLevel: "high",
        value: 87,
        city: "Bangalore",
        country: "India",
        aidDistributed: 10890,
        familiesHelped: 2722,
      },
      {
        lat: 22.5726,
        lng: 88.3639,
        text: "Kolkata",
        supportLevel: "high",
        value: 82,
        city: "Kolkata",
        country: "India",
        aidDistributed: 9670,
        familiesHelped: 2417,
      },

      // Medium support areas (medium circles, orange color) - India
      {
        lat: 17.385,
        lng: 78.4867,
        text: "Hyderabad",
        supportLevel: "medium",
        value: 65,
        city: "Hyderabad",
        country: "India",
        aidDistributed: 6540,
        familiesHelped: 1635,
      },
      {
        lat: 13.0827,
        lng: 80.2707,
        text: "Chennai",
        supportLevel: "medium",
        value: 61,
        city: "Chennai",
        country: "India",
        aidDistributed: 5890,
        familiesHelped: 1472,
      },
      {
        lat: 23.2599,
        lng: 77.4126,
        text: "Bhopal",
        supportLevel: "medium",
        value: 58,
        city: "Bhopal",
        country: "India",
        aidDistributed: 4820,
        familiesHelped: 1205,
      },
      {
        lat: 26.9124,
        lng: 75.7873,
        text: "Jaipur",
        supportLevel: "medium",
        value: 54,
        city: "Jaipur",
        country: "India",
        aidDistributed: 4230,
        familiesHelped: 1057,
      },

      // Low support areas (small circles, red color) - India
      {
        lat: 15.2993,
        lng: 74.124,
        text: "Goa",
        supportLevel: "low",
        value: 32,
        city: "Goa",
        country: "India",
        aidDistributed: 1890,
        familiesHelped: 472,
      },
      {
        lat: 34.0837,
        lng: 74.7973,
        text: "Srinagar",
        supportLevel: "low",
        value: 28,
        city: "Srinagar",
        country: "India",
        aidDistributed: 1450,
        familiesHelped: 362,
      },
      {
        lat: 25.3176,
        lng: 82.9739,
        text: "Varanasi",
        supportLevel: "low",
        value: 25,
        city: "Varanasi",
        country: "India",
        aidDistributed: 1120,
        familiesHelped: 280,
      },
      {
        lat: 27.1767,
        lng: 78.0081,
        text: "Agra",
        supportLevel: "low",
        value: 22,
        city: "Agra",
        country: "India",
        aidDistributed: 980,
        familiesHelped: 245,
      },

      // International locations - High support
      {
        lat: 40.7128,
        lng: -74.006,
        text: "New York",
        supportLevel: "high",
        value: 91,
        city: "New York",
        country: "USA",
        aidDistributed: 14250,
        familiesHelped: 3562,
      },
      {
        lat: 51.5074,
        lng: -0.1278,
        text: "London",
        supportLevel: "high",
        value: 88,
        city: "London",
        country: "UK",
        aidDistributed: 11200,
        familiesHelped: 2800,
      },
      {
        lat: 35.6762,
        lng: 139.6503,
        text: "Tokyo",
        supportLevel: "high",
        value: 86,
        city: "Tokyo",
        country: "Japan",
        aidDistributed: 10500,
        familiesHelped: 2625,
      },
      {
        lat: 55.7558,
        lng: 37.6176,
        text: "Moscow",
        supportLevel: "high",
        value: 84,
        city: "Moscow",
        country: "Russia",
        aidDistributed: 9800,
        familiesHelped: 2450,
      },

      // International - Medium support
      {
        lat: -33.8688,
        lng: 151.2093,
        text: "Sydney",
        supportLevel: "medium",
        value: 67,
        city: "Sydney",
        country: "Australia",
        aidDistributed: 7120,
        familiesHelped: 1780,
      },
      {
        lat: 52.52,
        lng: 13.405,
        text: "Berlin",
        supportLevel: "medium",
        value: 63,
        city: "Berlin",
        country: "Germany",
        aidDistributed: 6300,
        familiesHelped: 1575,
      },
      {
        lat: 48.8566,
        lng: 2.3522,
        text: "Paris",
        supportLevel: "medium",
        value: 61,
        city: "Paris",
        country: "France",
        aidDistributed: 5890,
        familiesHelped: 1472,
      },
      {
        lat: 1.3521,
        lng: 103.8198,
        text: "Singapore",
        supportLevel: "medium",
        value: 59,
        city: "Singapore",
        country: "Singapore",
        aidDistributed: 5420,
        familiesHelped: 1355,
      },

      // International - Lower support
      {
        lat: -23.5505,
        lng: -46.6333,
        text: "São Paulo",
        supportLevel: "low",
        value: 45,
        city: "São Paulo",
        country: "Brazil",
        aidDistributed: 3200,
        familiesHelped: 800,
      },
      {
        lat: 19.4326,
        lng: -99.1332,
        text: "Mexico City",
        supportLevel: "low",
        value: 42,
        city: "Mexico City",
        country: "Mexico",
        aidDistributed: 2890,
        familiesHelped: 722,
      },
      {
        lat: -34.6037,
        lng: -58.3816,
        text: "Buenos Aires",
        supportLevel: "low",
        value: 38,
        city: "Buenos Aires",
        country: "Argentina",
        aidDistributed: 2450,
        familiesHelped: 612,
      },
      {
        lat: 30.0444,
        lng: 31.2357,
        text: "Cairo",
        supportLevel: "low",
        value: 35,
        city: "Cairo",
        country: "Egypt",
        aidDistributed: 2100,
        familiesHelped: 525,
      },

      // Africa - More data points
      {
        lat: -26.2041,
        lng: 28.0473,
        text: "Johannesburg",
        supportLevel: "medium",
        value: 58,
        city: "Johannesburg",
        country: "South Africa",
        aidDistributed: 4200,
        familiesHelped: 1050,
      },
      {
        lat: 6.5244,
        lng: 3.3792,
        text: "Lagos",
        supportLevel: "low",
        value: 41,
        city: "Lagos",
        country: "Nigeria",
        aidDistributed: 2680,
        familiesHelped: 670,
      },
      {
        lat: -1.2921,
        lng: 36.8219,
        text: "Nairobi",
        supportLevel: "medium",
        value: 52,
        city: "Nairobi",
        country: "Kenya",
        aidDistributed: 3580,
        familiesHelped: 895,
      },

      // Asia - More data points
      {
        lat: 39.9042,
        lng: 116.4074,
        text: "Beijing",
        supportLevel: "high",
        value: 83,
        city: "Beijing",
        country: "China",
        aidDistributed: 9200,
        familiesHelped: 2300,
      },
      {
        lat: 37.5665,
        lng: 126.978,
        text: "Seoul",
        supportLevel: "high",
        value: 81,
        city: "Seoul",
        country: "South Korea",
        aidDistributed: 8750,
        familiesHelped: 2187,
      },
      {
        lat: 25.2048,
        lng: 55.2708,
        text: "Dubai",
        supportLevel: "medium",
        value: 64,
        city: "Dubai",
        country: "UAE",
        aidDistributed: 5680,
        familiesHelped: 1420,
      },

      // European expansion
      {
        lat: 41.9028,
        lng: 12.4964,
        text: "Rome",
        supportLevel: "medium",
        value: 56,
        city: "Rome",
        country: "Italy",
        aidDistributed: 4150,
        familiesHelped: 1037,
      },
      {
        lat: 40.4168,
        lng: -3.7038,
        text: "Madrid",
        supportLevel: "medium",
        value: 53,
        city: "Madrid",
        country: "Spain",
        aidDistributed: 3890,
        familiesHelped: 972,
      },
      {
        lat: 59.3293,
        lng: 18.0686,
        text: "Stockholm",
        supportLevel: "high",
        value: 79,
        city: "Stockholm",
        country: "Sweden",
        aidDistributed: 7850,
        familiesHelped: 1962,
      },
    ],
    [],
  );

  // Punjab region data - shown when zoomed into India
  const punjabData: SupportData[] = useMemo(
    () => [
      {
        lat: 31.634,
        lng: 74.8723,
        text: "Amritsar",
        supportLevel: showVolunteerData ? "high" : "medium",
        value: showVolunteerData ? 92 : 68,
        city: "Amritsar",
        country: "India",
        aidDistributed: showVolunteerData ? 8950 : 4200,
        familiesHelped: showVolunteerData ? 2237 : 1050,
      },
      {
        lat: 30.901,
        lng: 75.8573,
        text: "Ludhiana",
        supportLevel: showVolunteerData ? "high" : "medium",
        value: showVolunteerData ? 89 : 65,
        city: "Ludhiana",
        country: "India",
        aidDistributed: showVolunteerData ? 8200 : 3800,
        familiesHelped: showVolunteerData ? 2050 : 950,
      },
      {
        lat: 30.7333,
        lng: 76.7794,
        text: "Chandigarh",
        supportLevel: showVolunteerData ? "high" : "medium",
        value: showVolunteerData ? 87 : 62,
        city: "Chandigarh",
        country: "India",
        aidDistributed: showVolunteerData ? 7650 : 3500,
        familiesHelped: showVolunteerData ? 1912 : 875,
      },
      {
        lat: 31.326,
        lng: 75.5762,
        text: "Jalandhar",
        supportLevel: showVolunteerData ? "medium" : "low",
        value: showVolunteerData ? 74 : 45,
        city: "Jalandhar",
        country: "India",
        aidDistributed: showVolunteerData ? 5200 : 2100,
        familiesHelped: showVolunteerData ? 1300 : 525,
      },
      {
        lat: 30.3398,
        lng: 76.3869,
        text: "Patiala",
        supportLevel: showVolunteerData ? "medium" : "low",
        value: showVolunteerData ? 71 : 42,
        city: "Patiala",
        country: "India",
        aidDistributed: showVolunteerData ? 4850 : 1950,
        familiesHelped: showVolunteerData ? 1212 : 487,
      },
    ],
    [showVolunteerData],
  );

  // Combined data based on zoom level
  const getCurrentData = () => {
    const baseData = mockSupportData;
    if (currentZoom < 1.8) {
      // When zoomed into India region, show Punjab data too
      return [...baseData, ...punjabData];
    }
    return baseData;
  };

  const getSupportColor = (supportLevel: string) => {
    switch (supportLevel) {
      case "high":
        return "#10B981"; // green-500
      case "medium":
        return "#F59E0B"; // amber-500
      case "low":
        return "#EF4444"; // red-500
      default:
        return "#6B7280"; // gray-500
    }
  };

  const getSupportSize = (value: number) => {
    if (value >= 80) return 0.8; // Large circles for high support
    if (value >= 50) return 0.5; // Medium circles for medium support
    return 0.3; // Small circles for low support
  };

  useEffect(() => {
    if (!globeRef.current) return;

    // Initialize globe
    globeInstance.current = new Globe(globeRef.current)
      .width(dimensions.width)
      .height(dimensions.height)
      .backgroundColor("#000020")
      .globeImageUrl(
        "//unpkg.com/three-globe/example/img/earth-blue-marble.jpg",
      )
      .atmosphereColor("#87CEEB")
      .atmosphereAltitude(0.15)
      .showAtmosphere(true)
      .showGraticules(false)
      .pointOfView({ altitude: 2.5 })
      .labelsData(getCurrentData())
      .labelText((d: any) => d.text)
      .labelColor((d: any) => getSupportColor(d.supportLevel))
      .labelSize(
        (d: any) =>
          getSupportSize(d.value) * (window.innerWidth <= 768 ? 1.2 : 1),
      ) // Slightly larger on mobile
      .labelResolution(window.innerWidth <= 768 ? 1 : 2) // Lower resolution on mobile for performance
      .labelAltitude(0.02)
      .labelIncludeDot(true)
      .labelDotRadius(
        (d: any) =>
          getSupportSize(d.value) * 0.3 * (window.innerWidth <= 768 ? 1.3 : 1),
      )
      .labelDotOrientation("bottom")
      .onLabelHover((label: any, prevLabel: any) => {
        if (label) {
          const isMobile = window.innerWidth <= 768;
          const tooltip = isMobile
            ? `${label.text}\n${label.value}%\n${(label.aidDistributed / 1000).toFixed(1)}k aid\n${(label.familiesHelped / 100).toFixed(1)}x100 families`
            : `${label.text}\nSupport: ${label.value}%\nAid: ${label.aidDistributed.toLocaleString()}\nFamilies: ${label.familiesHelped.toLocaleString()}${showVolunteerData ? "\n⭐ Your Impact Zone" : ""}`;

          globeInstance.current.labelText((d: any) =>
            d === label ? tooltip : d.text,
          );
        } else if (prevLabel) {
          // Reset tooltip when hover ends
          globeInstance.current.labelText((d: any) => d.text);
        }
      })
      .onLabelClick((label: any, event: any) => {
        if (label) {
          const newAltitude = label.country === "India" ? 0.8 : 1.5;
          setCurrentZoom(newAltitude);

          // Zoom to the clicked location
          globeInstance.current.pointOfView(
            {
              lat: label.lat,
              lng: label.lng,
              altitude: newAltitude,
            },
            1000,
          );

          // Update data after zoom animation
          setTimeout(() => {
            globeInstance.current.labelsData(getCurrentData());
          }, 1100);
        }
      })
      // Track zoom changes
      .onGlobeClick((coords: any, event: any) => {
        const pov = globeInstance.current.pointOfView();
        setCurrentZoom(pov.altitude);
      });

    // Auto-rotate globe slowly
    const autoRotate = () => {
      if (globeInstance.current) {
        const pov = globeInstance.current.pointOfView();
        globeInstance.current.pointOfView({
          ...pov,
          lng: pov.lng + 0.1,
        });
      }
    };

    const rotationInterval = setInterval(autoRotate, 100);

    setIsLoading(false);

    return () => {
      clearInterval(rotationInterval);
      if (globeInstance.current) {
        if (globeInstance.current._destructor) {
          globeInstance.current._destructor();
        }
      }
    };
  }, [dimensions.width, dimensions.height, mockSupportData]);

  // Update globe size when dimensions change
  useEffect(() => {
    if (globeInstance.current) {
      globeInstance.current.width(dimensions.width).height(dimensions.height);
    }
  }, [dimensions]);

  const handleResetView = () => {
    if (globeInstance.current) {
      setCurrentZoom(2.5);
      globeInstance.current.pointOfView({ altitude: 2.5 }, 1000);
      setTimeout(() => {
        globeInstance.current.labelsData(getCurrentData());
      }, 1100);
    }
  };

  const handleZoomToIndia = () => {
    if (globeInstance.current) {
      setCurrentZoom(1.2);
      globeInstance.current.pointOfView(
        {
          lat: 20.5937,
          lng: 78.9629,
          altitude: 1.2,
        },
        1000,
      );
      setTimeout(() => {
        globeInstance.current.labelsData(getCurrentData());
      }, 1100);
    }
  };

  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 rounded-lg z-10">
          <div className="text-center text-white">
            <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-white mx-auto mb-2 sm:mb-4"></div>
            <p className="text-sm sm:text-base">
              Loading global support visualization...
            </p>
          </div>
        </div>
      )}

      <div
        ref={globeRef}
        className="rounded-lg overflow-hidden border border-gray-300 mobile-globe"
        style={{ width: dimensions.width, height: dimensions.height }}
      />

      {/* Mobile-friendly Controls */}
      <div className="absolute top-2 right-2 sm:top-4 sm:right-4 flex flex-col space-y-1 sm:space-y-2">
        <button
          onClick={handleResetView}
          className="px-2 py-1 sm:px-3 sm:py-2 bg-blue-600 text-white rounded text-xs sm:text-sm hover:bg-blue-700 transition-colors shadow-md"
        >
          🌍 World
        </button>
        <button
          onClick={handleZoomToIndia}
          className="px-2 py-1 sm:px-3 sm:py-2 bg-green-600 text-white rounded text-xs sm:text-sm hover:bg-green-700 transition-colors shadow-md"
        >
          🇮🇳 India
        </button>
        {showVolunteerData && (
          <div className="px-2 py-1 bg-purple-600 text-white rounded text-xs shadow-md">
            ⭐ Your Impact
          </div>
        )}
      </div>

      {/* Mobile-optimized Legend */}
      <div className="absolute bottom-2 left-2 sm:bottom-4 sm:left-4 bg-white bg-opacity-95 rounded-lg p-2 sm:p-4 shadow-md max-w-[calc(100vw-120px)] sm:max-w-none">
        <h4 className="font-semibold text-gray-800 mb-1 sm:mb-2 text-sm sm:text-base">
          Support Levels
        </h4>
        <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm">
          <div className="flex items-center space-x-1 sm:space-x-2">
            <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-green-500 flex-shrink-0"></div>
            <span className="text-gray-700">High (80%+)</span>
          </div>
          <div className="flex items-center space-x-1 sm:space-x-2">
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-amber-500 flex-shrink-0"></div>
            <span className="text-gray-700">Medium (50-79%)</span>
          </div>
          <div className="flex items-center space-x-1 sm:space-x-2">
            <div className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0"></div>
            <span className="text-gray-700">Low (&lt;50%)</span>
          </div>
        </div>
        <p className="text-xs text-gray-600 mt-1 sm:mt-2 hidden sm:block">
          Click locations to zoom in. Hover for details.
        </p>
        <p className="text-xs text-gray-600 mt-1 sm:hidden">Tap to zoom in</p>
        {showVolunteerData && (
          <p className="text-xs text-purple-600 mt-1 font-medium">
            ⭐ Enhanced data showing your volunteer impact areas
          </p>
        )}
      </div>
    </div>
  );
}
