import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  TrendingUp,
  Clock,
  Calendar,
  Activity,
  Award,
  Zap,
  BarChart3,
  PieChart,
  ArrowUpRight,
} from "lucide-react";
import api from "../api/axiosInstance";
import ThreeSphere from "./ThreeSphere";
import AnalyticsBarChart from "./AnalyticsBarChart";
import AnalyticsLineChart from "./AnalyticsLineChart";
import { useNavigate } from "react-router-dom";

// Helper to format minutes into "2h 30m"
const formatTime = (minutes) => {
  if (!minutes) return "0m";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

// Reusable Card Component with Hover Effect
const StatCard = ({ title, value, subtext, icon: Icon, colorClass, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: delay * 0.1 }}
    className="relative overflow-hidden bg-card border border-border p-6 rounded-2xl shadow-lg group hover:border-primary/50 transition-colors"
  >
    <div
      className={`absolute top-0 right-0 p-4 opacity-30 group-hover:opacity-50 transition-opacity ${colorClass}`}
    >
      <Icon className="w-16 h-16" />
    </div>
    <div className="relative z-10">
      <div className="flex items-center gap-2 text-muted-foreground mb-2">
        <Icon className="w-5 h-5" />
        <span className="text-sm font-medium">{title}</span>
      </div>
      <h3 className="text-3xl font-semibold text-foreground tracking-tight">
        {value}
      </h3>
      {subtext && (
        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
          {subtext}
        </p>
      )}
    </div>
  </motion.div>
);

export default function Analytics() {
  // State for selected day/week
  const [selected, setSelected] = useState("Weekly");
  const { data: rawData, isLoading } = useQuery({
    queryKey: ["analytics"],
    queryFn: async () => {
      const res = await api.get("/activities/weekly-analytics");
      return res.data.data; // Raw backend data
    },
  });

  // --- CLIENT-SIDE DATA PROCESSING ---
  const stats = useMemo(() => {
    if (!rawData) return null;

    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    let totalMinutes = 0;
    let totalSessions = 0;
    const categoryTotals = {};
    let bestDay = { name: "-", minutes: 0 };

    // Helper: Get local date string (YYYY-MM-DD) from UTC date string, using user's local time
    function getLocalDateString(utcDateStr) {
      const d = new Date(utcDateStr); // parses as UTC, but .getFullYear() etc. are local
      const year = d.getFullYear();
      const month = d.getMonth() + 1;
      const day = d.getDate();
      return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    }

    // Group items by local date
    const grouped = {};
    rawData.forEach((item) => {
      const localDate = getLocalDateString(item.date);
      if (!grouped[localDate]) {
        grouped[localDate] = {
          categories: {},
          totalDayMinutes: 0,
          date: localDate,
        };
      }
      Object.entries(item.categories).forEach(([cat, min]) => {
        grouped[localDate].categories[cat] = (grouped[localDate].categories[cat] || 0) + min;
        categoryTotals[cat] = (categoryTotals[cat] || 0) + min;
        totalSessions += 1;
      });
      grouped[localDate].totalDayMinutes += item.totalDayMinutes;
      totalMinutes += item.totalDayMinutes;
    });

    // Build chartData sorted by date ascending
    const chartData = Object.keys(grouped)
      .sort()
      .map((dateStr) => {
        const d = new Date(dateStr + "T00:00:00");
        const dayLabel = dayNames[d.getDay()];
        const dateLabel = `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}`;
        return {
          dayLabel,
          dateLabel,
          fullDate: dateStr,
          categories: grouped[dateStr].categories,
          totalDayMinutes: grouped[dateStr].totalDayMinutes,
        };
      });

    // Calculate Best Day
    chartData.forEach((day) => {
      if (day.totalDayMinutes > bestDay.minutes) {
        bestDay = { name: `${day.dayLabel} (${day.dateLabel})`, minutes: day.totalDayMinutes };
      }
    });

    // Calculate Top Category
    const sortedCategories = Object.entries(categoryTotals).sort(
      ([, a], [, b]) => b - a,
    );
    const topCategory =
      sortedCategories.length > 0
        ? { name: sortedCategories[0][0], minutes: sortedCategories[0][1] }
        : { name: "-", minutes: 0 };

    return {
      chartData,
      totalMinutes,
      totalSessions,
      categoryTotals,
      topCategory,
      bestDay,
      avgSession:
        totalSessions > 0 ? Math.round(totalMinutes / totalSessions) : 0,
    };
  }, [rawData]);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground animate-pulse">
            Crunching numbers...
          </p>
        </div>
      </div>
    );
  }

  // Build dayOptions: last 7 days ending with today, ordered left-to-right oldest-to-today
  const dayOptions = [];
  if (stats?.chartData && stats.chartData.length >= 1) {
    // Use backend's chartData order (oldest to newest)
    stats.chartData.forEach((day) => {
      dayOptions.push({
        key: day.fullDate,
        label: `${day.dayLabel} (${day.dateLabel})`,
        fullDate: day.fullDate,
        dayLabel: day.dayLabel,
        dateLabel: day.dateLabel,
        hasData: Object.keys(day.categories).length > 0,
      });
    });
  }
  dayOptions.push({ key: "Weekly", label: "Weekly", rawDay: "Weekly" });

  // Filtered data for ThreeSphere and right portion
  let filteredData = null;
  let showThreeSphere = true;
  let selectedDayData = null;
  if (stats?.chartData) {
    if (selected === "Weekly") {
      // Cumulative for all 7 days
      const categories = {};
      let totalDayMinutes = 0;
      stats.chartData.forEach((day) => {
        Object.entries(day.categories).forEach(([cat, min]) => {
          categories[cat] = (categories[cat] || 0) + min;
        });
        totalDayMinutes += day.totalDayMinutes;
      });
      filteredData = { categories, totalDayMinutes };
      showThreeSphere = Object.keys(categories).length > 0;
      selectedDayData = null;
    } else {
      // Find selected day by key (fullDate)
      const day = stats.chartData.find((d) => d.fullDate === selected);
      if (day && Object.keys(day.categories).length > 0) {
        filteredData = { categories: day.categories, totalDayMinutes: day.totalDayMinutes };
        showThreeSphere = true;
        selectedDayData = day;
      } else {
        filteredData = null;
        showThreeSphere = false;
        selectedDayData = null;
      }
    }
  }

  console.log(rawData)

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-10">
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-4xl font-bold text-foreground tracking-tight">
            Analytics
          </h1>
          <p className="text-muted-foreground mt-2 flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            Your weekly productivity heartbeat
          </p>
        </div>
        <div className="bg-secondary/50 px-4 py-2 rounded-full border border-border text-sm text-muted-foreground">
          Last 7 Days
        </div>
      </div>

      {/* --- KPI CARDS --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Focus"
          value={formatTime(stats?.totalMinutes)}
          subtext="Time spent this week"
          icon={Clock}
          colorClass="text-blue-500"
          delay={0}
        />
        <StatCard
          title="Most Productive"
          value={stats?.bestDay?.name}
          subtext={`${formatTime(stats?.bestDay?.minutes)} recorded`}
          icon={TrendingUp}
          colorClass="text-green-500"
          delay={1}
        />
        <StatCard
          title="Top Category"
          value={stats?.topCategory?.name}
          subtext={`${formatTime(stats?.topCategory?.minutes)} total`}
          icon={Award}
          colorClass="text-yellow-500"
          delay={2}
        />
        <StatCard
          title="Focus Score"
          value={stats?.avgSession ? `${stats.avgSession}m` : "0m"}
          subtext="Avg. session length"
          icon={Zap}
          colorClass="text-purple-500"
          delay={3}
        />
      </div>

      {/* --- MAIN GRID --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT SIDE */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2 bg-card border border-border rounded-3xl p-6 shadow-md flex flex-col"
        >
          <div className="flex flex-wrap items-center gap-2 mb-6">
            {dayOptions.map((opt) => (
              <button
                key={opt.key}
                className={`px-3 py-1 cursor-pointer rounded-full border text-sm font-medium transition-colors ${
                  selected === opt.key
                    ? "bg-primary text-white border-primary"
                    : "bg-secondary text-foreground border-border hover:bg-primary/10"
                }`}
                onClick={() => setSelected(opt.key)}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="flex-1 min-h-[400px] relative bg-secondary/10 rounded-2xl overflow-hidden">
            {showThreeSphere ? (
              <ThreeSphere data={filteredData} />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground opacity-50">
                <BarChart3 className="w-12 h-12 mb-2" />
                <p>No activity data to visualize yet</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* RIGHT SIDE */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-card border border-border rounded-3xl p-6 shadow-md flex flex-col"
        >
          <div className="mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <PieChart className="w-5 h-5 text-purple-400" />
              Distribution
            </h2>
            <p className="text-sm text-muted-foreground">
              Where your time goes
            </p>
          </div>

          <CategoryBreakdown
            selected={selected}
            dayOptions={dayOptions}
            stats={stats}
            formatTime={formatTime}
            selectedDayData={selectedDayData}
          />

          <div className="mt-6 pt-6 border-t border-border">
            <div className="bg-primary/10 rounded-xl p-4 flex items-start gap-3">
              <Zap className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-primary">Pro Tip</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Try to keep your "Break" sessions under 20% of your total time
                  to maintain optimal flow state.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* --- BAR CHART --- */}
      <AnalyticsBarChart chartData={stats?.chartData} dayOptions={dayOptions} />

      {/* --- LINE CHART --- */}
      <AnalyticsLineChart chartData={stats?.chartData} />

    </div>
  );
}

function CategoryBreakdown({ selected, dayOptions, stats, formatTime, selectedDayData }) {
  // Compute filtered category totals
  let categories = {};
  let total = 0;

  if (selected === "Weekly") {
    categories = stats?.categoryTotals || {};
    total = stats?.totalMinutes || 0;
  } else if (selectedDayData) {
    categories = selectedDayData.categories || {};
    total = selectedDayData.totalDayMinutes || 0;
  }

  const colors = {
    Work: "bg-teal-500",
    Study: "bg-blue-500",
    Exercise: "bg-orange-500",
    Break: "bg-pink-500",
    Other: "bg-gray-500",
  };

  const entries = Object.entries(categories).sort(([, a], [, b]) => b - a);

  if (entries.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-10">
        No categories logged.
      </p>
    );
  }

  return (
    <div className="space-y-6 flex-1 overflow-y-auto custom-scrollbar pr-2">
      {entries.map(([category, minutes]) => {
        const percentage = total > 0 ? Math.round((minutes / total) * 100) : 0;

        const color = colors[category] || "bg-primary";

        return (
          <div key={category} className="group">
            <div className="flex justify-between items-end mb-2">
              <span className="font-medium text-foreground flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${color}`} />
                {category}
              </span>
              <div className="text-right">
                <span className="text-sm font-bold block">
                  {formatTime(minutes)}
                </span>
              </div>
            </div>

            <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
              <motion.div
                key={category + minutes}
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
                className={`h-full ${color}`}
              />
            </div>

            <p className="text-xs text-muted-foreground mt-1 text-right">
              {percentage}% of total
            </p>
          </div>
        );
      })}
    </div>
  );
}
