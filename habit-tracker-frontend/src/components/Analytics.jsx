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
      className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity ${colorClass}`}
    >
      <Icon className="w-16 h-16" />
    </div>
    <div className="relative z-10">
      <div className="flex items-center gap-2 text-muted-foreground mb-2">
        <Icon className="w-5 h-5" />
        <span className="text-sm font-medium">{title}</span>
      </div>
      <h3 className="text-3xl font-bold text-foreground tracking-tight">
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
  const navigate = useNavigate();
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

    // 1. Prepare Chart Data
    const daysMap = {};
    let totalMinutes = 0;
    let totalSessions = 0;
    const categoryTotals = {};
    let bestDay = { name: "-", minutes: 0 };

    rawData.forEach((item) => {
      // Backend returns _id.day as 1-7 (Sun-Sat)
      const dayIndex = item._id.day - 1;
      const category = item._id.category;
      const duration = item.totalDuration;

      // Aggregates for Chart
      if (!daysMap[dayIndex]) {
        daysMap[dayIndex] = {
          dayLabel: dayNames[dayIndex],
          categories: {},
          totalDayMinutes: 0,
        };
      }
      daysMap[dayIndex].categories[category] = duration;
      daysMap[dayIndex].totalDayMinutes += duration;

      // Aggregates for Totals
      totalMinutes += duration;
      totalSessions += 1; // This is actually groups, exact session count might need raw logs, but this is a good approximation for groups

      // Aggregates for Top Category
      categoryTotals[category] = (categoryTotals[category] || 0) + duration;
    });

    // Calculate Best Day
    Object.values(daysMap).forEach((day) => {
      if (day.totalDayMinutes > bestDay.minutes) {
        bestDay = { name: day.dayLabel, minutes: day.totalDayMinutes };
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

    const chartData = Object.values(daysMap).sort((a, b) => {
      // Simple sort by day index (need to map back if mixed, but usually fine)
      return dayNames.indexOf(a.dayLabel) - dayNames.indexOf(b.dayLabel);
    });

    return {
      chartData,
      totalMinutes,
      totalSessions, // Note: This is count of unique (day, cat) pairs. For exact "log counts", backend update is better.
      categoryTotals,
      topCategory,
      bestDay,
      avgSession:
        totalSessions > 0 ? Math.round(totalMinutes / totalSessions) : 0, // Rough estimate
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

  // Prepare day options with dates, starting from last Saturday to today
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const today = new Date();
  // Build last 7 days ending with today
  const dayOptions = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dayLabel = dayNames[d.getDay()];
    const dateLabel = `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}`;
    dayOptions.push({
      key: `${dayLabel}-${dateLabel}`,
      label: `${dayLabel} (${dateLabel})`,
      rawDay: dayLabel,
      date: d,
    });
  }
  dayOptions.push({ key: "Weekly", label: "Weekly", rawDay: "Weekly" });

  // Filtered data for ThreeSphere
  let filteredData = null;
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
    } else {
      // Find selected day by key
      const selectedDayObj = dayOptions.find((opt) => opt.key === selected);
      if (selectedDayObj) {
        const day = stats.chartData.find(
          (d) => d.dayLabel === selectedDayObj.rawDay,
        );
        filteredData = day
          ? { categories: day.categories, totalDayMinutes: day.totalDayMinutes }
          : null;
      } else {
        filteredData = null;
      }
    }
  }

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
          value={stats?.bestDay.name}
          subtext={`${formatTime(stats?.bestDay.minutes)} recorded`}
          icon={TrendingUp}
          colorClass="text-green-500"
          delay={1}
        />
        <StatCard
          title="Top Category"
          value={stats?.topCategory.name}
          subtext={`${formatTime(stats?.topCategory.minutes)} total`}
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

      {/* --- MAIN CONTENT GRID --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT: 3D CHART (Span 2 cols) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2 bg-card border border-border rounded-3xl p-6 shadow-md flex flex-col"
        >
          {/* Day/Weekly Selector */}
          <div className="flex flex-wrap items-center gap-2 mb-6">
            {dayOptions.map((opt) => (
              <button
                key={opt.key}
                className={`px-3 py-1 rounded-full border text-sm font-medium transition-colors ${selected === opt.key ? "bg-primary text-white border-primary" : "bg-secondary text-foreground border-border hover:bg-primary/10"}`}
                onClick={() => setSelected(opt.key)}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <div className="flex-1 min-h-100 relative bg-secondary/10 rounded-2xl overflow-hidden">
            {filteredData ? (
              <ThreeSphere data={filteredData} />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground opacity-50">
                <BarChart3 className="w-12 h-12 mb-2" />
                <p>No activity data to visualize yet</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* RIGHT: CATEGORY BREAKDOWN */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-card border border-border rounded-3xl p-6 shadow-md flex flex-col h-full"
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

          <div className="space-y-6 flex-1 overflow-y-auto custom-scrollbar pr-2">
            {Object.entries(stats?.categoryTotals || {}).length === 0 && (
              <p className="text-center text-muted-foreground py-10">
                No categories logged.
              </p>
            )}

            {Object.entries(stats?.categoryTotals || {})
              .sort(([, a], [, b]) => b - a)
              .map(([category, minutes], index) => {
                const percentage = Math.round(
                  (minutes / stats.totalMinutes) * 100,
                );

                // Color mapping
                const colors = {
                  Work: "bg-teal-500",
                  Study: "bg-blue-500",
                  Exercise: "bg-orange-500",
                  Break: "bg-pink-500",
                  Other: "bg-gray-500",
                };
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
                    {/* Animated Progress Bar */}
                    <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 1, delay: 0.5 + index * 0.1 }}
                        className={`h-full ${color} shadow-[0_0_10px_rgba(0,0,0,0.3)]`}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 text-right">
                      {percentage}% of total
                    </p>
                  </div>
                );
              })}
          </div>

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

      {/* --- DETAILED TABLE --- */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-card border border-border rounded-3xl p-6 shadow-md"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-400" />
            Daily Breakdown
          </h2>
          <button
            onClick={() => navigate("/history")}
            className="text-xs text-primary hover:underline flex items-center gap-1"
          >
            View All History <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border/50 text-muted-foreground text-sm">
                <th className="py-4 font-medium pl-4">Day</th>
                <th className="py-4 font-medium">Total Focus</th>
                <th className="py-4 font-medium hidden md:table-cell">
                  Top Activity
                </th>
                <th className="py-4 font-medium text-right pr-4">
                  Contribution
                </th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {stats?.chartData?.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="py-8 text-center text-muted-foreground"
                  >
                    No data available
                  </td>
                </tr>
              )}
              {stats?.chartData?.map((day, idx) => {
                const topCatForDay = Object.entries(day.categories).sort(
                  ([, a], [, b]) => b - a,
                )[0];
                const percentage = Math.min(
                  100,
                  Math.round(
                    (day.totalDayMinutes / (stats.totalMinutes || 1)) * 100,
                  ),
                );

                return (
                  <motion.tr
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 + idx * 0.05 }}
                    className="border-b border-border/30 hover:bg-secondary/30 transition-colors group"
                  >
                    <td className="py-4 pl-4 font-medium text-foreground">
                      {day.dayLabel}
                    </td>
                    <td className="py-4 text-foreground">
                      {formatTime(day.totalDayMinutes)}
                    </td>
                    <td className="py-4 hidden md:table-cell text-muted-foreground">
                      {topCatForDay ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-secondary/50 text-xs">
                          {topCatForDay[0]}
                        </span>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="py-4 pr-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-xs text-muted-foreground">
                          {percentage}%
                        </span>
                        <div className="w-16 h-1.5 bg-secondary rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
