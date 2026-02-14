import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  parseISO,
} from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  Trash2,
  AlertCircle,
  Filter,
} from "lucide-react";
import api from "../api/axiosInstance";

// Define categories matching your backend enum
const CATEGORIES = ["All", "Work", "Study", "Exercise", "Break", "Other"];

// Helper for category colors
const getCategoryColor = (cat) => {
  switch (cat) {
    case "Work":
      return "bg-teal-500/20 text-teal-400 border-teal-500/50";
    case "Study":
      return "bg-blue-500/20 text-blue-400 border-blue-500/50";
    case "Exercise":
      return "bg-orange-500/20 text-orange-400 border-orange-500/50";
    case "Break":
      return "bg-pink-500/20 text-pink-400 border-pink-500/50";
    default:
      return "bg-gray-500/20 text-gray-400 border-gray-500/50";
  }
};

export default function History() {
  const queryClient = useQueryClient();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedCategory, setSelectedCategory] = useState("All"); // New State

  // 1. Fetch ALL activities
  const { data: allActivities, isLoading } = useQuery({
    queryKey: ["activities-history"],
    queryFn: async () => {
      // We fetch all and filter client-side for instant UI updates
      const res = await api.get("/activities");
      return res.data.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/activities/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(["activities-history"]);
    },
  });

  // --- Filtering Logic ---
  // Memoize the filtered list so we don't recalculate unnecessarily
  const filteredActivities = useMemo(() => {
    if (!allActivities) return [];
    if (selectedCategory === "All") return allActivities;
    return allActivities.filter((item) => item.category === selectedCategory);
  }, [allActivities, selectedCategory]);

  // Calendar Helpers
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  // Get logs specific to the Selected Date AND Selected Category
  const currentDayLogs = filteredActivities.filter((activity) => {
    // Always compare in local system time
    const created = parseISO(activity.createdAt);
    const localCreated = new Date(created.getFullYear(), created.getMonth(), created.getDate());
    const localSelected = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
    return isSameDay(localCreated, localSelected);
  });

  // Check if a day has activity (respecting the current category filter)
  const hasActivity = (day) => {
    return filteredActivities.some((activity) => {
      const created = parseISO(activity.createdAt);
      const localCreated = new Date(created.getFullYear(), created.getMonth(), created.getDate());
      const localDay = new Date(day.getFullYear(), day.getMonth(), day.getDate());
      return isSameDay(localCreated, localDay);
    });
  };

  console.log(allActivities, selectedDate);

  return (
    <div className="h-full flex flex-col lg:flex-row gap-6 p-1">
      {/* --- LEFT: CALENDAR & FILTERS --- */}
      <div className="flex-1 flex flex-col h-fit gap-6">
        {/* 1. Calendar Card */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-foreground capitalize flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-primary" />
              {format(currentMonth, "MMMM yyyy")}
            </h2>
            <div className="flex gap-2">
              <button
                onClick={prevMonth}
                className="p-2 hover:bg-secondary rounded-lg transition-colors text-muted-foreground hover:text-foreground"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={nextMonth}
                className="p-2 hover:bg-secondary rounded-lg transition-colors text-muted-foreground hover:text-foreground"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 mb-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div
                key={day}
                className="text-center text-xs font-medium text-muted-foreground py-2"
              >
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {calendarDays.map((day) => {
              const isSelected = isSameDay(day, selectedDate);
              const isCurrentMonth = isSameMonth(day, monthStart);
              const showDot = hasActivity(day);

              return (
                <button
                  key={day.toString()}
                  onClick={() => setSelectedDate(day)}
                  className={`
                    relative h-10 w-full rounded-lg flex items-center justify-center text-sm font-medium transition-all
                    ${!isCurrentMonth ? "text-muted-foreground/30" : "text-foreground"}
                    ${isSelected ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25 scale-105" : "hover:bg-secondary"}
                  `}
                >
                  {format(day, "d")}
                  {showDot && !isSelected && (
                    <div className="absolute bottom-1.5 w-1 h-1 rounded-full bg-primary animate-pulse" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Category Filter (Added Below Calendar) */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3 text-muted-foreground">
            <Filter className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">
              Filter by Category
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`
                      px-3 py-1.5 rounded-full text-xs font-medium border transition-all
                      ${
                        isActive
                          ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20"
                          : "bg-secondary/50 text-muted-foreground border-transparent hover:border-primary/30 hover:text-foreground"
                      }
                    `}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* --- RIGHT: ACTIVITY LIST --- */}
      <div className="lg:w-120 flex flex-col bg-card border border-border rounded-2xl p-6 shadow-sm h-150 lg:h-auto">
        <div className="mb-4 pb-4 border-b border-border">
          <h3 className="text-lg font-semibold flex items-center gap-2 text-foreground">
            {format(selectedDate, "eeee, MMM d")}
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            {currentDayLogs.length} entries • {selectedCategory} View
          </p>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
          <AnimatePresence mode="popLayout">
            {isLoading ? (
              <p className="text-center text-muted-foreground py-8">
                Loading history...
              </p>
            ) : currentDayLogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-muted-foreground/50">
                <AlertCircle className="w-10 h-10 mb-2 opacity-20" />
                <p className="text-sm">No "{selectedCategory}" logs.</p>
              </div>
            ) : (
              currentDayLogs.map((activity) => (
                <motion.div
                  key={activity._id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  layout
                  className="group bg-secondary/20 border border-border/50 p-3 rounded-xl flex justify-between items-center hover:bg-secondary/40 transition-colors"
                >
                  <div>
                    <h4 className="font-medium text-foreground text-sm">
                      {activity.activityName}
                    </h4>
                    <div className="flex items-center gap-2 mt-2">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full border ${getCategoryColor(activity.category)}`}
                      >
                        {activity.category}
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {activity.duration}m
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => deleteMutation.mutate(activity._id)}
                    className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
