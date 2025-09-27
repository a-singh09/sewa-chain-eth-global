"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup,
} from "react-simple-maps";

interface SupportData {
  coordinates: [number, number]; // [longitude, latitude]
  name: string;
  supportLevel: "high" | "medium" | "low";
  value: number;
  aidDistributed: number;
  familiesHelped: number;
  country: string;
  state?: string;
}

interface WorldMapVisualizationProps {
  width?: number;
  height?: number;
  className?: string;
  showVolunteerData?: boolean;
}

// World map topology URL
const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

export function WorldMapVisualization({
  width,
  height,
  className = "",
  showVolunteerData = false,
}: WorldMapVisualizationProps) {
  const [dimensions, setDimensions] = useState({
    width: width || 800,
    height: height || 400,
  });
  const [position, setPosition] = useState({ coordinates: [0, 0], zoom: 1 });
  const [isLoading, setIsLoading] = useState(true);

  // Handle responsive dimensions
  useEffect(() => {
    const updateDimensions = () => {
      const isMobile = window.innerWidth <= 768;
      const containerWidth =
        document.querySelector(".map-container")?.clientWidth ||
        window.innerWidth;
      const newWidth = Math.min(
        containerWidth - 32,
        width || (isMobile ? containerWidth - 32 : 800),
      );
      const aspectRatio = isMobile ? 0.6 : 0.5;
      const newHeight = Math.max(newWidth * aspectRatio, isMobile ? 250 : 400);

      setDimensions({
        width: newWidth,
        height: newHeight,
      });
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, [width, height]);

  // Mock support data with coordinates
  const globalSupportData: SupportData[] = useMemo(
    () => [
      // India - High Support
      {
        coordinates: [77.209, 28.6139],
        name: "New Delhi",
        supportLevel: "high",
        value: 95,
        aidDistributed: 15420,
        familiesHelped: 3855,
        country: "India",
      },
      {
        coordinates: [72.8777, 19.076],
        name: "Mumbai",
        supportLevel: "high",
        value: 89,
        aidDistributed: 12350,
        familiesHelped: 3087,
        country: "India",
      },
      {
        coordinates: [77.5946, 12.9716],
        name: "Bangalore",
        supportLevel: "high",
        value: 87,
        aidDistributed: 10890,
        familiesHelped: 2722,
        country: "India",
      },
      {
        coordinates: [88.3639, 22.5726],
        name: "Kolkata",
        supportLevel: "high",
        value: 82,
        aidDistributed: 9670,
        familiesHelped: 2417,
        country: "India",
      },

      // India - Medium Support
      {
        coordinates: [78.4867, 17.385],
        name: "Hyderabad",
        supportLevel: "medium",
        value: 65,
        aidDistributed: 6540,
        familiesHelped: 1635,
        country: "India",
      },
      {
        coordinates: [80.2707, 13.0827],
        name: "Chennai",
        supportLevel: "medium",
        value: 61,
        aidDistributed: 5890,
        familiesHelped: 1472,
        country: "India",
      },
      {
        coordinates: [75.7873, 26.9124],
        name: "Jaipur",
        supportLevel: "medium",
        value: 54,
        aidDistributed: 4230,
        familiesHelped: 1057,
        country: "India",
      },

      // India - Lower Support
      {
        coordinates: [74.124, 15.2993],
        name: "Goa",
        supportLevel: "low",
        value: 32,
        aidDistributed: 1890,
        familiesHelped: 472,
        country: "India",
      },
      {
        coordinates: [82.9739, 25.3176],
        name: "Varanasi",
        supportLevel: "low",
        value: 25,
        aidDistributed: 1120,
        familiesHelped: 280,
        country: "India",
      },

      // USA
      {
        coordinates: [-74.006, 40.7128],
        name: "New York",
        supportLevel: "high",
        value: 91,
        aidDistributed: 14250,
        familiesHelped: 3562,
        country: "USA",
      },
      {
        coordinates: [-118.2437, 34.0522],
        name: "Los Angeles",
        supportLevel: "medium",
        value: 68,
        aidDistributed: 7200,
        familiesHelped: 1800,
        country: "USA",
      },
      {
        coordinates: [-87.6298, 41.8781],
        name: "Chicago",
        supportLevel: "medium",
        value: 63,
        aidDistributed: 6100,
        familiesHelped: 1525,
        country: "USA",
      },

      // Europe
      {
        coordinates: [-0.1278, 51.5074],
        name: "London",
        supportLevel: "high",
        value: 88,
        aidDistributed: 11200,
        familiesHelped: 2800,
        country: "UK",
      },
      {
        coordinates: [2.3522, 48.8566],
        name: "Paris",
        supportLevel: "medium",
        value: 61,
        aidDistributed: 5890,
        familiesHelped: 1472,
        country: "France",
      },
      {
        coordinates: [13.405, 52.52],
        name: "Berlin",
        supportLevel: "medium",
        value: 63,
        aidDistributed: 6300,
        familiesHelped: 1575,
        country: "Germany",
      },
      {
        coordinates: [12.4964, 41.9028],
        name: "Rome",
        supportLevel: "medium",
        value: 56,
        aidDistributed: 4150,
        familiesHelped: 1037,
        country: "Italy",
      },

      // Asia
      {
        coordinates: [139.6503, 35.6762],
        name: "Tokyo",
        supportLevel: "high",
        value: 86,
        aidDistributed: 10500,
        familiesHelped: 2625,
        country: "Japan",
      },
      {
        coordinates: [126.978, 37.5665],
        name: "Seoul",
        supportLevel: "high",
        value: 81,
        aidDistributed: 8750,
        familiesHelped: 2187,
        country: "South Korea",
      },
      {
        coordinates: [116.4074, 39.9042],
        name: "Beijing",
        supportLevel: "high",
        value: 83,
        aidDistributed: 9200,
        familiesHelped: 2300,
        country: "China",
      },
      {
        coordinates: [121.4737, 31.2304],
        name: "Shanghai",
        supportLevel: "medium",
        value: 72,
        aidDistributed: 6800,
        familiesHelped: 1700,
        country: "China",
      },

      // Southeast Asia
      {
        coordinates: [103.8198, 1.3521],
        name: "Singapore",
        supportLevel: "medium",
        value: 59,
        aidDistributed: 5420,
        familiesHelped: 1355,
        country: "Singapore",
      },
      {
        coordinates: [100.5018, 13.7563],
        name: "Bangkok",
        supportLevel: "medium",
        value: 52,
        aidDistributed: 3680,
        familiesHelped: 920,
        country: "Thailand",
      },
      {
        coordinates: [106.8456, -6.2088],
        name: "Jakarta",
        supportLevel: "low",
        value: 41,
        aidDistributed: 2950,
        familiesHelped: 737,
        country: "Indonesia",
      },

      // Africa
      {
        coordinates: [28.0473, -26.2041],
        name: "Johannesburg",
        supportLevel: "medium",
        value: 58,
        aidDistributed: 4200,
        familiesHelped: 1050,
        country: "South Africa",
      },
      {
        coordinates: [3.3792, 6.5244],
        name: "Lagos",
        supportLevel: "low",
        value: 41,
        aidDistributed: 2680,
        familiesHelped: 670,
        country: "Nigeria",
      },
      {
        coordinates: [36.8219, -1.2921],
        name: "Nairobi",
        supportLevel: "medium",
        value: 52,
        aidDistributed: 3580,
        familiesHelped: 895,
        country: "Kenya",
      },
      {
        coordinates: [31.2357, 30.0444],
        name: "Cairo",
        supportLevel: "low",
        value: 35,
        aidDistributed: 2100,
        familiesHelped: 525,
        country: "Egypt",
      },

      // South America
      {
        coordinates: [-46.6333, -23.5505],
        name: "São Paulo",
        supportLevel: "low",
        value: 45,
        aidDistributed: 3200,
        familiesHelped: 800,
        country: "Brazil",
      },
      {
        coordinates: [-43.1729, -22.9068],
        name: "Rio de Janeiro",
        supportLevel: "low",
        value: 39,
        aidDistributed: 2750,
        familiesHelped: 687,
        country: "Brazil",
      },
      {
        coordinates: [-58.3816, -34.6037],
        name: "Buenos Aires",
        supportLevel: "low",
        value: 38,
        aidDistributed: 2450,
        familiesHelped: 612,
        country: "Argentina",
      },

      // Australia & Oceania
      {
        coordinates: [151.2093, -33.8688],
        name: "Sydney",
        supportLevel: "medium",
        value: 67,
        aidDistributed: 7120,
        familiesHelped: 1780,
        country: "Australia",
      },
      {
        coordinates: [144.9631, -37.8136],
        name: "Melbourne",
        supportLevel: "medium",
        value: 62,
        aidDistributed: 5950,
        familiesHelped: 1487,
        country: "Australia",
      },
    ],
    [],
  );

  // Punjab data for zoomed view
  const punjabData: SupportData[] = useMemo(
    () => [
      {
        coordinates: [74.8723, 31.634],
        name: "Amritsar",
        supportLevel: showVolunteerData ? "high" : "medium",
        value: showVolunteerData ? 92 : 68,
        aidDistributed: showVolunteerData ? 8950 : 4200,
        familiesHelped: showVolunteerData ? 2237 : 1050,
        country: "India",
        state: "Punjab",
      },
      {
        coordinates: [75.8573, 30.901],
        name: "Ludhiana",
        supportLevel: showVolunteerData ? "high" : "medium",
        value: showVolunteerData ? 89 : 65,
        aidDistributed: showVolunteerData ? 8200 : 3800,
        familiesHelped: showVolunteerData ? 2050 : 950,
        country: "India",
        state: "Punjab",
      },
      {
        coordinates: [76.7794, 30.7333],
        name: "Chandigarh",
        supportLevel: showVolunteerData ? "high" : "medium",
        value: showVolunteerData ? 87 : 62,
        aidDistributed: showVolunteerData ? 7650 : 3500,
        familiesHelped: showVolunteerData ? 1912 : 875,
        country: "India",
        state: "Punjab",
      },
      {
        coordinates: [75.5762, 31.326],
        name: "Jalandhar",
        supportLevel: showVolunteerData ? "medium" : "low",
        value: showVolunteerData ? 74 : 45,
        aidDistributed: showVolunteerData ? 5200 : 2100,
        familiesHelped: showVolunteerData ? 1300 : 525,
        country: "India",
        state: "Punjab",
      },
      {
        coordinates: [76.3869, 30.3398],
        name: "Patiala",
        supportLevel: showVolunteerData ? "medium" : "low",
        value: showVolunteerData ? 71 : 42,
        aidDistributed: showVolunteerData ? 4850 : 1950,
        familiesHelped: showVolunteerData ? 1212 : 487,
        country: "India",
        state: "Punjab",
      },
    ],
    [showVolunteerData],
  );

  // Get current data based on zoom level
  const getCurrentData = () => {
    const baseData = globalSupportData;
    if (position.zoom > 4) {
      // Zoomed into India region
      return [...baseData, ...punjabData];
    }
    return baseData;
  };

  const getSupportColor = (level: string, isVolunteer = false) => {
    const colors = {
      high: isVolunteer ? "#7C3AED" : "#10B981", // Purple for volunteer, green otherwise
      medium: "#F59E0B",
      low: "#EF4444",
    };
    return colors[level as keyof typeof colors] || "#6B7280";
  };

  const getSupportSize = (value: number, zoom: number) => {
    const baseSize = value >= 80 ? 8 : value >= 50 ? 6 : 4;
    const zoomMultiplier = Math.max(1, zoom / 2);
    return Math.min(baseSize * zoomMultiplier, 16);
  };

  const handleMoveEnd = (position: any) => {
    setPosition(position);
  };

  const resetView = () => {
    setPosition({ coordinates: [0, 0], zoom: 1 });
  };

  const zoomToIndia = () => {
    setPosition({ coordinates: [78, 22], zoom: 5 });
  };

  const zoomToPunjab = () => {
    setPosition({ coordinates: [75.5, 31], zoom: 8 });
  };

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={`${className} map-container space-y-4`}>
      {/* Map Container */}
      <div className="relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg z-10">
            <div className="text-center">
              <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-600 mx-auto mb-2 sm:mb-4"></div>
              <p className="text-sm sm:text-base text-gray-600">
                Loading global aid map...
              </p>
            </div>
          </div>
        )}

        <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg overflow-hidden border shadow-lg">
          <ComposableMap
            width={dimensions.width}
            height={dimensions.height}
            projection="geoMercator"
            projectionConfig={{
              scale: 100,
              center: [0, 20],
            }}
          >
            <ZoomableGroup
              zoom={position.zoom}
              center={position.coordinates}
              onMoveEnd={handleMoveEnd}
              maxZoom={10}
              minZoom={0.5}
            >
              <Geographies geography={geoUrl}>
                {({ geographies }) =>
                  geographies.map((geo) => (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill="#E5E7EB"
                      stroke="#9CA3AF"
                      strokeWidth={0.5}
                      style={{
                        default: { outline: "none" },
                        hover: { fill: "#D1D5DB", outline: "none" },
                        pressed: { fill: "#9CA3AF", outline: "none" },
                      }}
                    />
                  ))
                }
              </Geographies>

              {/* Render support markers */}
              {getCurrentData().map((location, index) => (
                <Marker key={index} coordinates={location.coordinates}>
                  <g>
                    <circle
                      r={getSupportSize(location.value, position.zoom)}
                      fill={getSupportColor(
                        location.supportLevel,
                        showVolunteerData && location.state === "Punjab",
                      )}
                      fillOpacity={0.8}
                      stroke="#fff"
                      strokeWidth={1}
                      style={{
                        cursor: "pointer",
                        filter:
                          showVolunteerData && location.state === "Punjab"
                            ? "drop-shadow(0 0 8px rgba(124, 58, 237, 0.6))"
                            : "drop-shadow(0 2px 4px rgba(0,0,0,0.2))",
                      }}
                    />
                    {showVolunteerData && location.state === "Punjab" && (
                      <text
                        textAnchor="middle"
                        y={-getSupportSize(location.value, position.zoom) - 8}
                        fontSize="10"
                        fill="#7C3AED"
                        fontWeight="bold"
                      >
                        ⭐
                      </text>
                    )}
                    {position.zoom > 3 && (
                      <text
                        textAnchor="middle"
                        y={getSupportSize(location.value, position.zoom) + 15}
                        fontSize="10"
                        fill="#374151"
                        fontWeight="500"
                        style={{ pointerEvents: "none" }}
                      >
                        {location.name}
                      </text>
                    )}
                  </g>
                </Marker>
              ))}
            </ZoomableGroup>
          </ComposableMap>
        </div>
      </div>

      {/* Navigation Controls */}
      {/* <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
        <button
          onClick={resetView}
          className="px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors shadow-md"
        >
          🌍 World View
        </button>
        <button
          onClick={zoomToIndia}
          className="px-3 py-2 bg-orange-600 text-white rounded text-sm hover:bg-orange-700 transition-colors shadow-md"
        >
          🇮🇳 India View
        </button>
        <button
          onClick={zoomToPunjab}
          className="px-3 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors shadow-md"
        >
          📍 Punjab View
        </button>
        {showVolunteerData && (
          <div className="px-3 py-2 bg-purple-600 text-white rounded text-sm shadow-md">
            ⭐ Your Impact Zone
          </div>
        )}
      </div> */}

      {/* Legend */}
      <div className="bg-white rounded-lg p-4 shadow-lg border">
        <h4 className="font-semibold text-gray-800 mb-3 text-base">
          Aid Distribution Impact Legend
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-green-500 flex-shrink-0"></div>
            <span className="text-gray-700">High Impact (80%+ support)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-amber-500 flex-shrink-0"></div>
            <span className="text-gray-700">
              Medium Impact (50-79% support)
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0"></div>
            <span className="text-gray-700">Needs Support (less than 50%)</span>
          </div>
          {showVolunteerData && (
            <div className="flex items-center space-x-2 col-span-full pt-2 border-t border-gray-200">
              <div className="w-3 h-3 rounded-full bg-purple-600 flex-shrink-0"></div>
              <span className="text-purple-700 font-medium">
                ⭐ Your Volunteer Impact Areas
              </span>
            </div>
          )}
        </div>
        <p className="text-xs text-gray-600 mt-3">
          Use the navigation buttons above to explore different regions. Click
          on circles for detailed information.
        </p>
      </div>
    </div>
  );
}
