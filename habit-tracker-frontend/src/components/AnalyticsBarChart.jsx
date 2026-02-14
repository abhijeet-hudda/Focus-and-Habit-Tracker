import React, { useMemo, useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";

function getLast7Days() {
  const days = [];
  const today = new Date();

  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);

    days.push({
      raw: date.toLocaleDateString("en-CA"),
      label: date.toLocaleDateString("en-US", { weekday: "short" }),
      fullDate: date,
    });
  }

  return days;
}

export default function AnalyticsBarChart({ chartData = [] }) {
  const chartContainerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);

  const last7Days = useMemo(() => getLast7Days(), []);

  // Get all unique categories from the data
  const allCategories = useMemo(() => {
    const categories = new Set();
    chartData.forEach((day) => {
      if (day.categories) {
        Object.keys(day.categories).forEach((cat) => categories.add(cat));
      }
    });
    return Array.from(categories);
  }, [chartData]);

//   console.log(chartData, allCategories);

  const CATEGORY_COLORS = {
    Work: "#14b8a6",
    Study: "#3b82f6",
    Exercise: "#f97316",
    Break: "#ec4899",
    Other: "#6b7280",
  };

  function getCategoryColor(category) {
    return CATEGORY_COLORS[category] || "#6366f1";
  }

  // Create a map for quick lookup by dayLabel
  const chartDataMap = useMemo(() => {
    const map = new Map();
    chartData.forEach((item) => {
      map.set(item.dayLabel, item);
    });
    return map;
  }, [chartData]);

  // Calculate max value for scaling across all categories and days
  const maxValue = useMemo(() => {
    let max = 0;
    chartData.forEach((day) => {
      if (day.categories) {
        Object.values(day.categories).forEach((value) => {
          if (value > max) max = value;
        });
      }
    });
    return max || 100; // Default to 100 if no data
  }, [chartData]);

  // Update container dimensions on resize
  useEffect(() => {
    const updateDimensions = () => {
      if (chartContainerRef.current) {
        const { width, height } =
          chartContainerRef.current.getBoundingClientRect();
        setContainerWidth(width);
        setContainerHeight(height);
      }
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);

    const resizeObserver = new ResizeObserver(updateDimensions);
    if (chartContainerRef.current) {
      resizeObserver.observe(chartContainerRef.current);
    }

    return () => {
      window.removeEventListener("resize", updateDimensions);
      resizeObserver.disconnect();
    };
  }, []);

  // Calculate bar dimensions based on container width
  const chartAreaHeight = Math.max(containerHeight - 60, 200); // Leave space for labels and legend
  const chartAreaWidth = containerWidth - 40; // Leave some padding

  // Dynamic day spacing based on container width
  const dayGroupWidth = chartAreaWidth / last7Days.length;

  // Bars per day - no space between categories

  // If no data, show empty state
  if (!chartData || chartData.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="mb-10 bg-card border border-border rounded-2xl p-6 shadow-md"
      >
        <h2 className="text-lg font-bold mb-4">Weekly Category Breakdown</h2>
        <div
          ref={chartContainerRef}
          className="w-full h-[320px] flex items-center justify-center text-gray-500"
        >
          No data available for the selected period
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7 }}
      className="mb-10 bg-card border border-border rounded-2xl p-6 shadow-md"
    >
      <h2 className="text-lg font-bold mb-4">Weekly Category Breakdown</h2>

      {/* Legend on top */}
      <div className="flex flex-wrap gap-4 mb-6 justify-center">
        {allCategories.map((category) => (
          <div key={category} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-sm"
              style={{ backgroundColor: getCategoryColor(category) }}
            />
            <span className="text-xs text-gray-400">{category}</span>
          </div>
        ))}
      </div>

      {/* Chart container */}
      <div
        ref={chartContainerRef}
        className="w-full h-[320px] relative  rounded-lg"
      >
        {containerWidth > 0 && containerHeight > 0 && (
          <>
            {/* Y-axis labels */}
            <div
              className="absolute left-0 border-r-2 border-gray-600 w-10 text-xs text-gray-500"
              style={{ height: `${chartAreaHeight}px` }}
            >
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => (
                <span
                  key={index}
                  className="absolute right-1 -translate-y-4.5"
                  style={{
                    top: `${ratio * chartAreaHeight}px`,
                  }}
                >
                  {Math.round(maxValue * (1 - ratio))}
                </span>
              ))}
            </div>

            {/* Chart area */}
            <div className="relative " style={{ height: chartAreaHeight }}>
              {/* Grid lines */}
              <svg className="absolute w-full h-full pointer-events-none">
                {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => (
                  <line
                    key={index}
                    x1="0"
                    y1={ratio * chartAreaHeight}
                    x2="100%"
                    y2={ratio * chartAreaHeight}
                    stroke="#e5e7eb"
                    strokeWidth="1"
                    strokeDasharray="5,5"
                  />
                ))}
              </svg>

              {/* Bars container */}
              <div className="relative w-full h-full flex justify-around">
                {last7Days.map((day, dayIndex) => {
                  const matchedDay = chartDataMap.get(day.label);

                  return (
                    <div key={day.raw} className=" h-full w-[14%] relative">
                      {/* Category bars - no space between them */}
                      <div className="relative w-full h-full flex items-end justify-center px-2">
                        {allCategories.map((category, catIndex) => {
                        //   console.log(matchedDay);

                          const isCategoryPresent =
                            matchedDay?.categories?.[category];
                          if (!isCategoryPresent) return;

                          const value = matchedDay?.categories?.[category] || 0;

                          // Height based on max value and container height
                          const barHeight =
                            maxValue > 0
                              ? (value / maxValue) * chartAreaHeight
                              : 0;
                          const barColor = getCategoryColor(category);
                          // console.log(day , category)
                          return (
                            <motion.div
                              key={`${day.raw}-${category}`}
                              className="w-1/5 rounded-t-md cursor-pointer group mx-0.5"
                              style={{
                                backgroundColor: barColor,
                                height: 0, // Start at 0 for animation
                              }}
                              animate={{
                                height: barHeight,
                              }}
                              transition={{
                                duration: 0.5,
                                delay: dayIndex * 0.05 + catIndex * 0.02,
                                ease: "easeOut",
                              }}
                              whileHover={{
                                opacity: 0.8,
                                scale: 1.02,
                                transition: { duration: 0.2 },
                              }}
                            >
                              {/* Tooltip on hover */}
                              {value > 0 && (
                                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                                  {category}: {value} min
                                </div>
                              )}
                            </motion.div>
                          );
                        })}
                      </div>

                      {/* Day label - centered under the day group */}
                      <div
                        className=" absolute top-[102%] left-1/2 -translate-x-1/2 w-auto text-xs text-gray-500 font-medium whitespace-nowrap"
                        style={
                          {
                            //   top: chartAreaHeight + 5,
                            //   left: "50%",
                            //   transform: "translateX(-50%)",
                          }
                        }
                      >
                        {day.label}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* X-axis line */}
            <div
              className="absolute left-10 right-0 bg-gray-500"
              style={{
                top: chartAreaHeight,
                height: "1px",
              }}
            />
          </>
        )}
      </div>
    </motion.div>
  );
}
