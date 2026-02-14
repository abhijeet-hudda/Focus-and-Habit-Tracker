// import React, { useMemo, useState, useRef, useEffect } from "react";
// import { Line } from "react-chartjs-2";
// import {
//   Chart,
//   LineElement,
//   PointElement,
//   CategoryScale,
//   LinearScale,
//   Tooltip,
//   Legend,
//   Filler,
// } from "chart.js";
// import { motion } from "framer-motion";

// Chart.register(
//   LineElement,
//   PointElement,
//   CategoryScale,
//   LinearScale,
//   Tooltip,
//   Legend,
//   Filler
// );

// const CATEGORY_COLORS = {
//   Work: "#14b8a6",
//   Study: "#3b82f6",
//   Exercise: "#f97316",
//   Break: "#ec4899",
//   Other: "#6b7280",
// };

// const TOTAL_COLOR = "#8b5cf6";

// function getCategoryColor(category) {
//   return CATEGORY_COLORS[category] || "#6366f1";
// }

// function getLast7Days() {
//   const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
//   const days = [];
//   const today = new Date();

//   for (let i = 6; i >= 0; i--) {
//     const date = new Date(today);
//     date.setDate(today.getDate() - i);
//     const dayLabel = dayNames[date.getDay()];
//     const dateLabel = `${date
//       .getDate()
//       .toString()
//       .padStart(2, "0")}/${(date.getMonth() + 1)
//       .toString()
//       .padStart(2, "0")}`;

//     days.push({
//       dayLabel,
//       dateLabel,
//       fullDate: date,
//     });
//   }

//   return days;
// }

// export default function AnalyticsLineChart({ chartData = [] }) {
//   const [hoveredCategory, setHoveredCategory] = useState(null);
//   const chartRef = useRef(null);

//   const last7Days = useMemo(() => getLast7Days(), []);

//   // Ensure Work is always included
//   const allCategories = useMemo(() => {
//     const categories = new Set(["Work"]);
//     chartData.forEach((day) => {
//       if (day.categories) {
//         Object.keys(day.categories).forEach((cat) => categories.add(cat));
//       }
//     });
//     return Array.from(categories).sort();
//   }, [chartData]);

//   const chartDataMap = useMemo(() => {
//     const map = new Map();
//     chartData.forEach((item) => {
//       map.set(item.dayLabel, item);
//     });
//     return map;
//   }, [chartData]);

//   const data = useMemo(() => {
//     const labels = last7Days.map(
//       (d) => `${d.dayLabel} (${d.dateLabel})`
//     );

//     const categoryDatasets = allCategories.map((category) => ({
//       label: category,
//       data: last7Days.map((d) => {
//         const dayData = chartDataMap.get(d.dayLabel);
//         return dayData?.categories?.[category] ?? 0;
//       }),
//       borderColor: getCategoryColor(category),
//       backgroundColor: getCategoryColor(category) + "15",
//       borderWidth: 2,
//       pointRadius: 3,
//       pointHoverRadius: 6,
//       tension: 0.4,
//       fill: false,
//       spanGaps: true,
//     }));

//     const totalDataset = {
//       label: "Total Duration",
//       data: last7Days.map((d) => {
//         const dayData = chartDataMap.get(d.dayLabel);
//         return dayData?.totalDayMinutes ?? 0;
//       }),
//       borderColor: TOTAL_COLOR,
//       borderDash: [6, 6],
//       borderWidth: 2.5,
//       pointRadius: 4,
//       pointHoverRadius: 7,
//       tension: 0.4,
//       fill: false,
//     };

//     return {
//       labels,
//       datasets: [...categoryDatasets, totalDataset],
//     };
//   }, [chartData, last7Days, chartDataMap, allCategories]);

//   const options = {
//     responsive: true,
//     maintainAspectRatio: false,
//     interaction: {
//       intersect: true, // Only show hovered point
//       mode: "nearest",
//     },
//     plugins: {
//       legend: {
//         display: true,
//         position: "top",
//         labels: {
//           usePointStyle: true,
//           boxWidth: 8,
//           padding: 12,
//           font: { size: 11 },
//         },
//       },
//       tooltip: {
//         enabled: true,
//         backgroundColor: "rgba(15,23,42,0.95)",
//         padding: 12,
//         titleFont: { size: 12, weight: "bold" },
//         bodyFont: { size: 11 },
//         borderColor: "#fff",
//         borderWidth: 1,
//         displayColors: true,
//         callbacks: {
//           title: function (context) {
//             return context[0].label;
//           },
//           label: function (context) {
//             return `${context.dataset.label}: ${context.parsed.y} min`;
//           },
//           afterBody: function () {
//             return "";
//           },
//         },
//       },
//     },
//     animation: {
//       duration: 800,
//       easing: "easeOutQuart",
//     },
//     scales: {
//       x: {
//         grid: {
//           display: false,
//         },
//         ticks: {
//           font: { size: 10 },
//           color: "#6b7280",
//         },
//       },
//       y: {
//         beginAtZero: true,
//         suggestedMax: Math.max(
//           ...data.datasets.flatMap((d) => d.data)
//         ) + 10,
//         grid: {
//           color: "#e5e7eb",
//         },
//         ticks: {
//           font: { size: 10 },
//           color: "#6b7280",
//           callback: function (value) {
//             return value + "m";
//           },
//         },
//       },
//     },
//     onHover: (event, activeElements) => {
//       if (activeElements.length > 0) {
//         const datasetIndex = activeElements[0].datasetIndex;
//         const datasetLabel =
//           data.datasets[datasetIndex]?.label || null;
//         setHoveredCategory(datasetLabel);
//       } else {
//         setHoveredCategory(null);
//       }
//     },
//   };

//   if (!chartData || chartData.length === 0) {
//     return (
//       <motion.div
//         initial={{ opacity: 0, y: 30 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ duration: 0.6 }}
//         className="mb-8 bg-card border border-border rounded-2xl p-6 shadow-md"
//       >
//         <h2 className="text-lg font-bold mb-4">
//           Weekly Trend Analysis
//         </h2>
//         <div className="w-full h-40 flex items-center justify-center text-gray-500">
//           No data available
//         </div>
//       </motion.div>
//     );
//   }

//   console.log(data)

//   return (
//     <motion.div
//       initial={{ opacity: 0, y: 30 }}
//       animate={{ opacity: 1, y: 0 }}
//       transition={{ duration: 0.6 }}
//       className="mb-8 bg-card border border-border rounded-2xl p-6 shadow-md"
//     >
//       <h2 className="text-lg font-bold mb-2">
//         Weekly Trend Analysis
//       </h2>
//       <p className="text-xs text-muted-foreground mb-3">
//         Daily duration breakdown by category
//       </p>

//       {/* Reduced height */}
//       <div className="w-full h-[400px] relative">
//         <Line ref={chartRef} data={data} options={options} />
//       </div>
//     </motion.div>
//   );
// }

import React, { useMemo, useState, useRef, useEffect } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart,
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { motion } from "framer-motion";

Chart.register(
  LineElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Filler,
);

const CATEGORY_COLORS = {
  Work: "#14b8a6",
  Study: "#3b82f6",
  Exercise: "#f97316",
  Break: "#ec4899",
  Other: "#6b7280",
};

const TOTAL_COLOR = "#8b5cf6";

function getCategoryColor(category) {
  return CATEGORY_COLORS[category] || "#6366f1";
}

function getLast7Days() {
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const days = [];
  const today = new Date();

  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const dayLabel = dayNames[date.getDay()];
    const dateLabel = `${date.getDate().toString().padStart(2, "0")}/${(
      date.getMonth() + 1
    )
      .toString()
      .padStart(2, "0")}`;

    days.push({
      dayLabel,
      dateLabel,
      fullDate: date,
    });
  }

  return days;
}

export default function AnalyticsLineChart({ chartData = [] }) {
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const chartRef = useRef(null);

  const last7Days = useMemo(() => getLast7Days(), []);

  // Ensure Work is always included
  const allCategories = useMemo(() => {
    const categories = new Set(["Work"]);
    chartData.forEach((day) => {
      if (day.categories) {
        Object.keys(day.categories).forEach((cat) => categories.add(cat));
      }
    });
    return Array.from(categories).sort();
  }, [chartData]);

  const chartDataMap = useMemo(() => {
    const map = new Map();
    chartData.forEach((item) => {
      map.set(item.dayLabel, item);
    });
    return map;
  }, [chartData]);

  const data = useMemo(() => {
    const labels = last7Days.map((d) => `${d.dayLabel} (${d.dateLabel})`);

    const categoryDatasets = allCategories.map((category) => ({
      label: category,
      data: last7Days.map((d) => {
        const dayData = chartDataMap.get(d.dayLabel);
        return dayData?.categories?.[category] ?? 0;
      }),
      borderColor: getCategoryColor(category),
      backgroundColor: getCategoryColor(category) + "15",
      borderWidth: 2,
      pointRadius: 3,
      pointHoverRadius: 6,
      tension: 0.4,
      fill: false,
      spanGaps: true,
    }));

    const totalDataset = {
      label: "Total Duration",
      data: last7Days.map((d) => {
        const dayData = chartDataMap.get(d.dayLabel);
        return dayData?.totalDayMinutes ?? 0;
      }),
      borderColor: TOTAL_COLOR,
      borderDash: [6, 6],
      borderWidth: 2.5,
      pointRadius: 4,
      pointHoverRadius: 7,
      tension: 0.4,
      fill: false,
    };

    return {
      labels,
      datasets: [...categoryDatasets, totalDataset],
    };
  }, [chartData, last7Days, chartDataMap, allCategories]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false, // Changed to false to show tooltip when near point
      mode: "index", // Show all data points at the same x-index
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: true,
        backgroundColor: "rgba(15,23,42,0.98)",
        padding: 16,
        titleFont: { size: 13, weight: "bold" },
        bodyFont: { size: 12 },
        footerFont: { size: 11, weight: "bold" },
        borderColor: "rgba(255,255,255,0.1)",
        borderWidth: 1,
        displayColors: true,
        boxWidth: 10,
        boxHeight: 10,
        boxPadding: 4,
        usePointStyle: true,
        callbacks: {
          // Custom title showing the day
          title: function (context) {
            return `📅 ${context[0].label}`;
          },

          // Add a separator before footer
          afterBody: function (context) {
            // Check if this is the total dataset hover
            const isTotalHovered =
              context[0]?.datasetIndex === data.datasets.length - 1;

            if (isTotalHovered) {
              // Get the day from the context
              const dayLabel = context[0].label.split(" ")[0]; // Extract day (e.g., "Mon")
              const dayData = chartDataMap.get(dayLabel);

              if (dayData?.categories) {
                const categories = Object.entries(dayData.categories)
                  .filter(([_, value]) => value > 0)
                  .sort((a, b) => b[1] - a[1]); // Sort by duration descending

                if (categories.length > 0) {
                  return [
                    " ",
                    "━━━ Breakdown ━━━",
                    ...categories.map(([cat, val]) => {
                      const color = getCategoryColor(cat);
                      return `• ${cat}: ${val} min`;
                    }),
                    "━━━━━━━━━━━━━━",
                  ];
                }
                return [" ", "No categories with activity"];
              }
            }
            return [];
          },

          // Footer showing total
          footer: function (context) {
            const isTotalHovered =
              context[0]?.datasetIndex === data.datasets.length - 1;

            if (isTotalHovered) {
              const total = context[0].parsed.y;
              return `✨ Total: ${total} minute${total !== 1 ? "s" : ""}`;
            }
            return "";
          },
        },
      },
    },
    animation: {
      duration: 800,
      easing: "easeOutQuart",
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: { size: 10 },
          color: "#6b7280",
        },
      },
      y: {
        beginAtZero: true,
        suggestedMax: Math.max(...data.datasets.flatMap((d) => d.data)) + 10,
        grid: {
          color: "#e5e7eb",
        },
        ticks: {
          font: { size: 10 },
          color: "#6b7280",
          callback: function (value) {
            return value + "m";
          },
        },
      },
    },
    onHover: (event, activeElements) => {
      if (activeElements.length > 0) {
        const datasetIndex = activeElements[0].datasetIndex;
        const datasetLabel = data.datasets[datasetIndex]?.label || null;
        setHoveredCategory(datasetLabel);
      } else {
        setHoveredCategory(null);
      }
    },
  };

  if (!chartData || chartData.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-8 bg-card border border-border rounded-2xl p-6 shadow-md"
      >
        <h2 className="text-lg font-bold mb-4">Weekly Trend Analysis</h2>
        <div className="w-full h-40 flex items-center justify-center text-gray-500">
          No data available
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="mb-8 bg-card border border-border rounded-2xl p-6 shadow-md"
    >
      <h2 className="text-lg font-bold mb-2">Weekly Trend Analysis</h2>
      <p className="text-xs text-muted-foreground mb-3">
        Daily duration breakdown by category
      </p>

      {/* Custom Legend Display */}
      <LegendDisplay allCategories={allCategories} />

      {/* Reduced height */}
      <div className="w-full h-[400px] relative">
        <Line ref={chartRef} data={data} options={options} />
      </div>
    </motion.div>
  );
}

// Add this component inside your AnalyticsLineChart function, before the return statement

const LegendDisplay = ({ allCategories }) => (
  <div className="flex flex-wrap items-center justify-center gap-4 mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-border">
    {/* Category Legends */}
    {allCategories.map((category) => {
      return (
        <div key={category} className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: getCategoryColor(category) }}
          />
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
            {category}
          </span>
        </div>
      );
    })}

    {/* Separator line */}
    <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-2" />

    {/* Total Duration Legend */}
    <div className="flex items-center gap-2">
      <div
        className="w-3 h-3 rounded-full"
        style={{ backgroundColor: TOTAL_COLOR }}
      />
      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
        Total Duration
      </span>
    </div>
  </div>
);
