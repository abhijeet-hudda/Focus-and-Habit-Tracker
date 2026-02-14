

import React, { useMemo } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";
import { motion } from "framer-motion";

Chart.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

function getLast7Days() {
  const days = [];
  const today = new Date();

  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(today.getDate() - i);

    days.push({
      raw: date.toLocaleDateString("en-CA"),
      label: date.toLocaleDateString("en-US", { weekday: "short" }),
    });
  }

  return days;
}

export default function AnalyticsBarChart({ chartData = [] }) {
  const last7Days = useMemo(() => getLast7Days(), []);

  // Get all unique categories from the data
  const allCategories = useMemo(() => {
    const categories = new Set();
    chartData.forEach(day => {
      if (day.categories) {
        Object.keys(day.categories).forEach(cat => categories.add(cat));
      }
    });
    return Array.from(categories);
  }, [chartData]);

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
    chartData.forEach(item => {
      map.set(item.dayLabel, item);
    });
    return map;
  }, [chartData]);

  const data = useMemo(() => {
    // Prepare datasets for each category
    const datasets = allCategories.map((cat) => ({
      label: cat,
      data: last7Days.map((day) => {
        const matchedDay = chartDataMap.get(day.label);
        // Return the value if it exists, otherwise return 0
        return matchedDay?.categories?.[cat] || 0;
      }),
      backgroundColor: getCategoryColor(cat),
      borderRadius: 6,
      // Adjust bar sizes for grouped display
      barPercentage: 0.8,
      categoryPercentage: 0.7,
    }));

    return {
      labels: last7Days.map((d) => d.label),
      datasets: datasets,
    };
  }, [last7Days, allCategories, chartDataMap]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { 
        display: true,
        position: 'top',
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.dataset.label || '';
            const value = context.raw;
            return value > 0 ? `${label}: ${value} minutes` : `${label}: No time logged`;
          }
        }
      }
    },
    scales: {
      x: {
        stacked: false, // Important: set to false for grouped bars
        grid: { display: false },
        title: {
          display: true,
          text: 'Days of the Week'
        }
      },
      y: {
        stacked: false, // Important: set to false for grouped bars
        beginAtZero: true,
        title: {
          display: true,
          text: 'Minutes'
        }
      },
    },
  };

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
        <div className="w-full h-[320px] flex items-center justify-center text-gray-500">
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

      <div className="w-full h-[320px]">
        <Bar data={data} options={options} />
      </div>
    </motion.div>
  );
}