import React, { useState } from "react";
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
  parseISO 
} from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Trash2, AlertCircle } from "lucide-react";
import api from "../api/axiosInstance";

export default function History() {
  const queryClient = useQueryClient();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  // 1. Fetch ALL activities to populate calendar dots and list
  // (For a micro-product, fetching all history is fine and makes the UI snappy)
  const { data: allActivities, isLoading } = useQuery({
    queryKey: ['activities-history'],
    queryFn: async () => {
      const res = await api.get('/activities');
      return res.data.data;
    }
  });

  // 2. Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/activities/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries(['activities-history']);
    },
  });

  // --- Calendar Logic ---
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  // Filter activities for the SELECTED date
  const selectedDateLogs = allActivities?.filter(activity => 
    isSameDay(parseISO(activity.createdAt), selectedDate)
  ) || [];

  // Helper to check if a day has ANY activity (for the dot indicator)
  const hasActivity = (day) => {
    return allActivities?.some(activity => isSameDay(parseISO(activity.createdAt), day));
  };

  return (
    <div className="h-full flex flex-col lg:flex-row gap-6">
      {/* --- LEFT: CALENDAR VIEW --- */}
      <div className="flex-1 flex flex-col bg-card border border-border rounded-2xl p-6 shadow-sm h-fit">
        
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-foreground capitalize">
            {format(currentMonth, "MMMM yyyy")}
          </h2>
          <div className="flex gap-2">
            <button onClick={prevMonth} className="p-2 hover:bg-secondary rounded-lg transition-colors">
              <ChevronLeft className="w-5 h-5 text-muted-foreground" />
            </button>
            <button onClick={nextMonth} className="p-2 hover:bg-secondary rounded-lg transition-colors">
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Days Header (Sun, Mon...) */}
        <div className="grid grid-cols-7 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-2">
          {calendarDays.map((day, idx) => {
            const isSelected = isSameDay(day, selectedDate);
            const isCurrentMonth = isSameMonth(day, monthStart);
            const hasLogs = hasActivity(day);

            return (
              <motion.button
                key={day.toString()}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedDate(day)}
                className={`
                  relative h-10 w-full rounded-lg flex items-center justify-center text-sm font-medium transition-all
                  ${!isCurrentMonth ? "text-muted-foreground/30" : "text-foreground"}
                  ${isSelected ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25" : "hover:bg-secondary"}
                `}
              >
                {format(day, "d")}
                
                {/* Activity Dot Indicator */}
                {hasLogs && !isSelected && (
                  <div className="absolute bottom-1.5 w-1 h-1 rounded-full bg-primary" />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* --- RIGHT: ACTIVITY LIST --- */}
      <div className="lg:w-96 flex flex-col bg-card border border-border rounded-2xl p-6 shadow-sm h-150 lg:h-auto">
        <div className="mb-4 pb-4 border-b border-border">
          <h3 className="text-lg font-semibold flex items-center gap-2 text-foreground">
            <CalendarIcon className="w-4 h-4 text-primary" />
            {format(selectedDate, "eeee, MMMM d")}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {selectedDateLogs.length} activities logged
          </p>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
          <AnimatePresence mode="popLayout">
            {isLoading ? (
              <p className="text-center text-muted-foreground py-8">Loading history...</p>
            ) : selectedDateLogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                <AlertCircle className="w-8 h-8 mb-2 opacity-20" />
                <p className="text-sm">No activities on this day.</p>
              </div>
            ) : (
              selectedDateLogs.map((activity) => (
                <motion.div
                  key={activity._id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="group bg-secondary/30 border border-border/50 p-3 rounded-xl flex justify-between items-center hover:bg-secondary/50 transition-colors"
                >
                  <div>
                    <h4 className="font-medium text-foreground text-sm">{activity.activityName}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs px-2 py-0.5 rounded-md bg-background text-muted-foreground border border-border">
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
                    title="Delete entry"
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