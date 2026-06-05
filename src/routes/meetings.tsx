import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CalendarDays,
  Plus,
  Building2,
  Users,
  MapPin,
  Link as LinkIcon,
  Loader2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Sparkles,
  Clock,
  User,
  Tag,
  Check,
} from "lucide-react";
import {
  useCreateMeeting,
  useDeleteMeeting,
  useMeetings,
  useOffices,
  useUpdateMeeting,
  useUsers,
  usePropertyManagers,
  useTasks,
} from "@/lib/queries";
import type { Meeting, MeetingStatus, MeetingType } from "@/lib/api-types";
import { ApiError } from "@/lib/api";


export const Route = createFileRoute("/meetings")({
  component: MeetingsPage,
  head: () => ({
    meta: [
      { title: "Meetings — The Appliance Guys" },
      { name: "description", content: "Upcoming and past meetings across your portfolio." },
    ],
  }),
});

type CalendarView = "month" | "week" | "day" | "agenda";

// Constants for display
const meetingTypeColors: Record<MeetingType, { bg: string; border: string }> = {
  "Cold Visit": { bg: "bg-orange-50/80 text-orange-700 border-orange-100", border: "border-l-[#e05638]" },
  "Property Manager Meeting": { bg: "bg-orange-50/80 text-orange-700 border-orange-100", border: "border-l-[#e05638]" },
  "Follow-up": { bg: "bg-amber-50/80 text-amber-700 border-amber-100", border: "border-l-amber-500" },
  "Training": { bg: "bg-purple-50/80 text-purple-700 border-purple-100", border: "border-l-purple-500" },
  "Other": { bg: "bg-slate-50/80 text-slate-700 border-slate-100", border: "border-l-slate-400" },
};

const statusDisplayNames: Record<MeetingStatus, string> = {
  scheduled: "Scheduled",
  completed: "Completed",
  cancelled: "Cancelled",
  no_show: "No Show",
};

const statusColors: Record<MeetingStatus, string> = {
  scheduled: "bg-cyan-50 text-cyan-700 border-cyan-100",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-100",
  cancelled: "bg-rose-50 text-rose-700 border-rose-100",
  no_show: "bg-slate-100 text-slate-600 border-slate-200",
};

// Generate time slots from 12:00 AM to 11:00 PM (all 24 hours)
const HOURS = Array.from({ length: 24 }, (_, i) => i); // 0 to 23

// Time display helper
function formatHour(h: number) {
  const ampm = h >= 12 ? "PM" : "AM";
  let displayHour = h % 12;
  if (displayHour === 0) displayHour = 12;
  
  if (ampm === "PM" && displayHour !== 12) {
    return `${displayHour.toString().padStart(2, "0")}:00 ${ampm}`;
  }
  return `${displayHour}:00 ${ampm}`;
}

// Generate dropdown time picker slots (every 30 mins)
const TIME_PICKER_SLOTS = (() => {
  const slots = [];
  for (let h = 5; h <= 21; h++) {
    const ampm = h >= 12 ? "PM" : "AM";
    const displayHour = h > 12 ? h - 12 : h === 0 ? 12 : h;
    slots.push(`${displayHour.toString().padStart(2, "0")}:00 ${ampm}`);
    if (h < 21) {
      slots.push(`${displayHour.toString().padStart(2, "0")}:30 ${ampm}`);
    }
  }
  return slots;
})();

function MeetingsPage() {
  const [view, setView] = useState<CalendarView>("week");
  const [currentDate, setCurrentDate] = useState<Date>(new Date(2026, 5, 3, 17, 25, 8)); // June 3, 2026
  
  // Filter states
  const [selectedManager, setSelectedManager] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  
  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);

  // Selected slot state (initial state matches mockup: June 2, 2026 at 1:00 AM)
  const [selectedSlot, setSelectedSlot] = useState<{ date: Date; hour: number } | null>({
    date: new Date(2026, 5, 2),
    hour: 1,
  });

  // Highlighted column state (toggled by clicking the day column header)
  const [highlightedColumn, setHighlightedColumn] = useState<string | null>(null);

  // Queries
  const meetingsQuery = useMeetings({ limit: 200 });
  const officesQuery = useOffices({ limit: 200 });
  const usersQuery = useUsers({ limit: 200 });
  const propertyManagersQuery = usePropertyManagers({ limit: 200 });
  const tasksQuery = useTasks({ limit: 200 });
  const updateMeeting = useUpdateMeeting();
  const deleteMeeting = useDeleteMeeting();

  // All tasks retrieved
  const allTasks = tasksQuery.data?.items ?? [];

  // All meetings retrieved
  const allMeetings = meetingsQuery.data?.items ?? [];

  // Filtered meetings
  const filteredMeetings = useMemo(() => {
    return allMeetings.filter((m) => {
      // Account Manager (Attendee) Filter
      if (selectedManager !== "all") {
        const attendeeIds = (m.attendees ?? []).map((a) => (typeof a === "string" ? a : a.id));
        if (!attendeeIds.includes(selectedManager)) return false;
      }
      // Meeting Type Filter
      if (selectedType !== "all" && m.meetingType !== selectedType) return false;
      // Status Filter
      if (selectedStatus !== "all" && m.status !== selectedStatus) return false;
      
      return true;
    });
  }, [allMeetings, selectedManager, selectedType, selectedStatus]);

  // Date Navigation Helpers
  function handleToday() {
    setCurrentDate(new Date(2026, 5, 3, 17, 25, 8));
  }

  function handleBack() {
    setCurrentDate((prev) => {
      const next = new Date(prev);
      if (view === "month") next.setMonth(next.getMonth() - 1);
      else if (view === "week") next.setDate(next.getDate() - 7);
      else next.setDate(next.getDate() - 1);
      return next;
    });
  }

  function handleNext() {
    setCurrentDate((prev) => {
      const next = new Date(prev);
      if (view === "month") next.setMonth(next.getMonth() + 1);
      else if (view === "week") next.setDate(next.getDate() + 7);
      else next.setDate(next.getDate() + 1);
      return next;
    });
  }

  // Active range display text
  const dateRangeText = useMemo(() => {
    if (view === "month" || view === "week" || view === "day") {
      return currentDate.toLocaleString("default", { month: "long", year: "numeric" });
    }
    
    // For agenda view: DD/MM/YYYY – DD/MM/YYYY
    const nextDay = new Date(currentDate);
    nextDay.setDate(nextDay.getDate() + 1);
    
    const formatDDMMYYYY = (d: Date) => {
      const day = d.getDate().toString().padStart(2, "0");
      const month = (d.getMonth() + 1).toString().padStart(2, "0");
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    };
    
    return `${formatDDMMYYYY(currentDate)} – ${formatDDMMYYYY(nextDay)}`;
  }, [currentDate, view]);

  // Agenda meetings for the 2-day range starting at currentDate
  const agendaMeetings = useMemo(() => {
    const startRange = new Date(currentDate);
    startRange.setHours(0, 0, 0, 0);
    
    const endRange = new Date(currentDate);
    endRange.setDate(endRange.getDate() + 1);
    endRange.setHours(23, 59, 59, 999);
    
    return filteredMeetings.filter((m) => {
      const meetingDate = new Date(m.startAt);
      return meetingDate >= startRange && meetingDate <= endRange;
    });
  }, [filteredMeetings, currentDate]);

  // Sunday to Saturday dates for active week
  const weekDates = useMemo(() => {
    const sun = new Date(currentDate);
    sun.setDate(sun.getDate() - sun.getDay());
    sun.setHours(0, 0, 0, 0);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(sun);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [currentDate]);

  // Center currentDate in 7-column day view grid
  const dayViewDates = useMemo(() => {
    const center = new Date(currentDate);
    center.setHours(0, 0, 0, 0);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(center);
      d.setDate(d.getDate() - 3 + i);
      return d;
    });
  }, [currentDate]);

  // Current time marker position inside active week
  const isThisWeek = useMemo(() => {
    const now = new Date(2026, 5, 3, 17, 25, 8);
    return weekDates.some((d) => d.toDateString() === now.toDateString());
  }, [weekDates]);

  return (
    <div className="min-h-screen bg-[#f8fafc] p-6 lg:p-8 font-sans selection:bg-[#e05638]/20">
      {/* Upper header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-bold tracking-tight text-slate-800">
            Meetings Calendar
          </h1>
          <p className="mt-1.5 text-sm text-slate-500 font-medium">
            Schedule and manage office visits and property manager meetings.
          </p>
        </div>
        <button
          onClick={() => {
            setSelectedSlot({ date: new Date(2026, 5, 2), hour: 9 });
            setEditingMeeting(null);
            setDialogOpen(true);
          }}
          className="inline-flex items-center gap-2 rounded-xl bg-[#e05638] px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-[#e05638]/15 hover:shadow-lg transition-all hover:bg-[#e05638]/95 cursor-pointer"
        >
          <Plus className="h-4 w-4 shrink-0" />
          New Meeting
        </button>
      </div>

      {/* Filter controls row */}
      <div className="mt-6 flex flex-wrap items-center gap-4 py-4 px-4 bg-white rounded-2xl border border-slate-200/60 shadow-2xs">
        {/* Account Managers Selector */}
        <Select value={selectedManager} onValueChange={setSelectedManager}>
          <SelectTrigger className={`w-60 h-11 text-sm rounded-xl bg-white border border-slate-200 focus:ring-1 focus:ring-[#e05638]/20 focus:border-[#e05638] transition-all text-slate-800 font-semibold px-3 flex items-center justify-between gap-2 [&_svg]:opacity-100 [&_svg]:text-slate-700 shadow-2xs ${selectedManager !== "all" ? "border-[#e05638]/60 bg-[#e05638]/5 text-[#e05638]" : ""}`}>
            <SelectValue placeholder="All Account Managers" />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-slate-200">
            <SelectItem value="all" className="text-xs">All Account Managers</SelectItem>
            {usersQuery.data?.items.map((u) => (
              <SelectItem key={u.id} value={u.id} className="text-xs">
                {u.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Meeting Type Selector */}
        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger className={`w-44 h-11 text-sm rounded-xl bg-white border border-slate-200 focus:ring-1 focus:ring-[#e05638]/20 focus:border-[#e05638] transition-all text-slate-800 font-semibold px-3 flex items-center justify-between gap-2 [&_svg]:opacity-100 [&_svg]:text-slate-700 shadow-2xs ${selectedType !== "all" ? "border-[#e05638]/60 bg-[#e05638]/5 text-[#e05638]" : ""}`}>
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-slate-200">
            <SelectItem value="all" className="text-xs">All Types</SelectItem>
            <SelectItem value="Property Manager Meeting" className="text-xs">Property Manager Meeting</SelectItem>
            <SelectItem value="Cold Visit" className="text-xs">Cold Visit</SelectItem>
            <SelectItem value="Follow-up" className="text-xs">Follow-up</SelectItem>
            <SelectItem value="Training" className="text-xs">Training</SelectItem>
            <SelectItem value="Other" className="text-xs">Other</SelectItem>
          </SelectContent>
        </Select>

        {/* Status Selector */}
        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className={`w-44 h-11 text-sm rounded-xl bg-white border border-slate-200 focus:ring-1 focus:ring-[#e05638]/20 focus:border-[#e05638] transition-all text-slate-800 font-semibold px-3 flex items-center justify-between gap-2 [&_svg]:opacity-100 [&_svg]:text-slate-700 shadow-2xs ${selectedStatus !== "all" ? "border-[#e05638]/60 bg-[#e05638]/5 text-[#e05638]" : ""}`}>
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-slate-200">
            <SelectItem value="all" className="text-xs">All Statuses</SelectItem>
            <SelectItem value="scheduled" className="text-xs">Scheduled</SelectItem>
            <SelectItem value="completed" className="text-xs">Completed</SelectItem>
            <SelectItem value="cancelled" className="text-xs">Cancelled</SelectItem>
            <SelectItem value="no_show" className="text-xs">No Show</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Main Calendar Card Grid wrapper */}
      <div className="mt-6 rounded-2xl border border-slate-200/60 bg-white shadow-2xs overflow-hidden flex flex-col">
        {/* Calendar Nav toolbar header */}
        <div className="flex flex-wrap items-center justify-between border-b border-slate-100 p-4 gap-4 bg-slate-50/25">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={handleToday}
              className="h-9 rounded-xl border-slate-200 text-xs text-slate-700 font-semibold hover:bg-slate-50 transition-all px-3.5 flex items-center gap-1.5 bg-white shadow-2xs cursor-pointer"
            >
              Today
              <ChevronDown className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            </Button>
            
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={handleBack}
                className="p-1.5 hover:bg-slate-100 text-slate-500 rounded-lg cursor-pointer transition-all"
              >
                <ChevronLeft className="h-4.5 w-4.5" />
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="p-1.5 hover:bg-slate-100 text-slate-500 rounded-lg cursor-pointer transition-all"
              >
                <ChevronRight className="h-4.5 w-4.5" />
              </button>
            </div>

            <h2 className="text-sm font-bold text-slate-800 tracking-tight select-none">
              {dateRangeText}
            </h2>
          </div>

          <div className="flex items-center rounded-lg bg-[#f6f6f6] p-1 gap-2 shrink-0 select-none">
            {(["month", "week", "day", "agenda"] as CalendarView[]).map((v) => {
              const active = view === v;
              const displayLabel = v.charAt(0).toUpperCase() + v.slice(1);
              return (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`px-4 py-1.5 text-xs font-semibold rounded-[6px] transition-all cursor-pointer ${
                    active
                      ? "bg-white text-slate-800 shadow-sm font-bold"
                      : "text-slate-500 hover:text-slate-800 hover:bg-[#eaeaea]/40"
                  }`}
                >
                  {displayLabel}
                </button>
              );
            })}
          </div>
        </div>

        {/* Loading Overlay */}
        {meetingsQuery.isLoading && (
          <div className="flex items-center justify-center py-24 bg-white">
            <Loader2 className="h-6 w-6 animate-spin text-[#e05638]" />
          </div>
        )}

        {/* Calendar Body Rendering based on active view state */}
        {!meetingsQuery.isLoading && (
          <div className="flex-1 overflow-x-auto min-w-0">
            {/* WEEK VIEW */}
            {view === "week" && (
              <div className="min-w-[850px] flex flex-col select-none relative">
                {/* Column Headers */}
                <div className="grid grid-cols-[80px_repeat(7,_1fr)] border-b border-slate-100 bg-white">
                  {/* Corner spacing */}
                  <div className="bg-white"></div>
                  {weekDates.map((date, idx) => {
                    const isToday = date.toDateString() === new Date(2026, 5, 3).toDateString();
                    const isSelectedCol = selectedSlot && selectedSlot.date.toDateString() === date.toDateString();
                    const isHighlighted = highlightedColumn === date.toDateString();
                    
                    // Filter tasks for this day
                    const dayTasks = allTasks.filter((t) => {
                      if (!t.dueAt) return false;
                      const due = new Date(t.dueAt);
                      return due.toDateString() === date.toDateString();
                    });
                    
                    let borderClasses = "";
                    if (isSelectedCol) {
                      borderClasses = "border-l border-r border-t border-dashed border-sky-400 z-10";
                    }
                    
                    return (
                      <div
                        key={idx}
                        onClick={() => {
                          setHighlightedColumn(prev => prev === date.toDateString() ? null : date.toDateString());
                        }}
                        className={`pl-4 pr-3 py-3.5 flex items-center justify-between relative cursor-pointer select-none ${isHighlighted ? "bg-[#e05638]/[0.03]" : "bg-white"} ${borderClasses}`}
                      >
                        <span className="text-xs font-semibold text-slate-700">
                          {date.getDate().toString().padStart(2, "0")} {date.toLocaleString("default", { weekday: "short" })}
                        </span>
                        
                        {dayTasks.length > 0 && (
                          <span className="inline-flex items-center justify-center rounded-full bg-cyan-50 border border-cyan-100 text-cyan-600 px-2 py-0.5 text-[10px] font-bold">
                            {dayTasks.length} {dayTasks.length === 1 ? "Task" : "Tasks"}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Week Slots Grid (Row-by-Row Layout) */}
                <div className="relative flex flex-col bg-white">
                  {HOURS.map((h) => (
                    <div key={h} className="grid grid-cols-[80px_repeat(7,_1fr)] h-16 group/row relative bg-white">
                      {/* Hour label */}
                      <div className="text-xs font-semibold text-slate-500 text-right pr-4 border-r border-slate-100 select-none flex items-center justify-end h-full">
                        {formatHour(h)}
                      </div>
                      
                      {/* 7 Day Cells */}
                      {weekDates.map((date, dayIdx) => {
                        const dayMeetings = filteredMeetings.filter((m) => {
                          const start = new Date(m.startAt);
                          return start.toDateString() === date.toDateString() && start.getHours() === h;
                        });
                        
                        const isToday = date.toDateString() === new Date(2026, 5, 3).toDateString();
                        const isSelectedCol = selectedSlot && selectedSlot.date.toDateString() === date.toDateString();
                        const isSelectedCell = selectedSlot && selectedSlot.date.toDateString() === date.toDateString() && selectedSlot.hour === h;
                        const isHighlighted = highlightedColumn === date.toDateString();
                        
                        let borderClasses = "border-r border-b border-slate-100";
                        if (isSelectedCol) {
                          borderClasses = "border-l border-r border-b border-dashed border-sky-400 z-10";
                        }
                        
                        return (
                          <div
                            key={dayIdx}
                            onClick={() => {
                              const selectedDate = new Date(date);
                              selectedDate.setHours(h, 0, 0, 0);
                              setSelectedSlot({ date, hour: h });
                              setEditingMeeting(null);
                              setDialogOpen(true);
                            }}
                            className={`hover:bg-slate-50/40 relative p-1.5 transition-all cursor-pointer flex flex-col gap-1 justify-center min-w-0 ${isHighlighted ? "bg-[#e05638]/[0.03]" : ""} ${borderClasses}`}
                          >
                            {/* Schedule plus guide */}
                            <span className="absolute top-1 right-1 opacity-0 group-hover/row:opacity-100 transition-opacity bg-slate-200/50 hover:bg-slate-200 text-slate-500 p-0.5 rounded-md text-[8px] flex items-center justify-center shrink-0 pointer-events-none">
                              <Plus className="h-2.5 w-2.5" />
                            </span>

                            {/* Render selected slot box */}
                            {isSelectedCell && (
                              <div
                                style={{
                                  backgroundImage: "repeating-linear-gradient(45deg, #f0f9ff, #f0f9ff 8px, #e0f2fe 8px, #e0f2fe 16px)",
                                }}
                                className="w-full h-full rounded-lg border border-sky-400 flex items-center justify-center p-1"
                              >
                                <div className="w-[85%] h-7 bg-white border border-sky-300 rounded-md shadow-2xs"></div>
                              </div>
                            )}

                            {/* Render meetings for this hour cell */}
                            {!isSelectedCell && dayMeetings.map((m) => {
                              const isCancelled = m.status === "cancelled" || m.status === "no_show";
                              
                              return (
                                <div
                                  key={m.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedSlot(null);
                                    setEditingMeeting(m);
                                    setDialogOpen(true);
                                  }}
                                  className={`px-3 py-2.5 rounded-lg flex items-center justify-start shadow-xs hover:shadow-md transition-all cursor-pointer bg-[#e05638] text-white border-l-[3px] border-white pl-2 min-w-0 overflow-hidden w-full h-full text-xs font-semibold`}
                                >
                                  <span className={`truncate ${isCancelled ? "line-through opacity-70" : ""}`}>
                                    {m.title}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  ))}

                </div>
              </div>
            )}

            {/* MONTH VIEW */}
            {view === "month" && (
              <div className="min-w-[850px] grid grid-cols-7 border-b border-slate-100 select-none">
                {/* Headers */}
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                  <div key={d} className="border-r border-slate-100 bg-slate-50/40 py-2.5 text-center text-[10px] font-bold text-slate-400 uppercase">
                    {d}
                  </div>
                ))}

                {/* Day blocks cells */}
                {(() => {
                  const year = currentDate.getFullYear();
                  const month = currentDate.getMonth();
                  const firstDay = new Date(year, month, 1);
                  const lastDay = new Date(year, month + 1, 0);
                  const firstDayOfWeek = firstDay.getDay();
                  const totalDays = lastDay.getDate();

                  // Calculate total cells needed (35 or 42)
                  const totalCells = (firstDayOfWeek + totalDays > 35) ? 42 : 35;
                  
                  // Start date of the calendar grid (might be in the previous month)
                  const gridStartDate = new Date(year, month, 1);
                  gridStartDate.setDate(gridStartDate.getDate() - firstDayOfWeek);

                  const cells = [];
                  for (let i = 0; i < totalCells; i++) {
                    const date = new Date(gridStartDate);
                    date.setDate(date.getDate() + i);
                    
                    const isCurrentMonth = date.getMonth() === month;
                    const isToday = date.toDateString() === new Date(2026, 5, 3).toDateString();
                    const dayNumber = date.getDate().toString().padStart(2, "0");

                    const dayMeetings = filteredMeetings.filter(
                      (m) => new Date(m.startAt).toDateString() === date.toDateString()
                    );

                    cells.push(
                      <div
                        key={i}
                        onClick={() => {
                          const selectedDate = new Date(date);
                          selectedDate.setHours(9, 0, 0, 0);
                          setEditingMeeting(null);
                          setDialogOpen(true);
                        }}
                        className={`h-[156px] p-4 border-r border-b border-slate-100 flex flex-col bg-white hover:bg-slate-50/30 cursor-pointer relative transition-colors`}
                      >
                        <span className={`text-xs font-semibold select-none ${
                          isToday 
                            ? "bg-[#e05638] text-white h-6 w-6 rounded-full flex items-center justify-center -ml-1 -mt-0.5 shadow-xs" 
                            : isCurrentMonth 
                              ? "text-slate-700" 
                              : "text-slate-300"
                        }`}>
                          {dayNumber}
                        </span>

                        <div className="flex-1 flex flex-col mt-3 min-h-0">
                          <div className="space-y-2 overflow-y-auto pr-0.5">
                            {dayMeetings.slice(0, 2).map((m) => {
                              const typeStyles = meetingTypeColors[m.meetingType] ?? meetingTypeColors["Cold Visit"];
                              const isCancelled = m.status === "cancelled" || m.status === "no_show";

                              // Get attendees and PM users for displaying avatars
                              const attendeeList = (m.attendees ?? []).map((a) => {
                                if (typeof a === "object" && a !== null) return a;
                                return usersQuery.data?.items.find((u) => u.id === a);
                              }).filter(Boolean);

                              const pmUser = (() => {
                                if (!m.propertyManager) return null;
                                if (typeof m.propertyManager === "object") return m.propertyManager;
                                return propertyManagersQuery.data?.items.find((pm) => pm.id === m.propertyManager);
                              })();

                              return (
                                <div
                                  key={m.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingMeeting(m);
                                    setDialogOpen(true);
                                  }}
                                  className={`px-2.5 py-1 rounded-r-lg border-l-[3px] flex flex-col justify-center transition-all cursor-pointer ${typeStyles.bg} ${typeStyles.border} min-w-0 overflow-hidden shadow-none`}
                                >
                                  <div className="flex items-center justify-between w-full min-w-0 gap-1.5">
                                    <span className={`text-[10px] font-semibold truncate flex-1 ${
                                      isCancelled ? "line-through text-slate-400" : "text-slate-800"
                                    }`}>
                                      {m.title}
                                    </span>
                                    
                                    {/* Avatars Stack & Status Dot */}
                                    <div className="flex items-center gap-1 shrink-0">
                                      <div className="flex -space-x-1.5 flex-row-reverse">
                                        {pmUser && (
                                          <img
                                            src={pmUser.avatar || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=100&h=100&q=80"}
                                            alt={`${pmUser.firstName} ${pmUser.lastName}`}
                                            className="h-4 w-4 rounded-full border border-white object-cover shadow-2xs shrink-0"
                                          />
                                        )}
                                        {attendeeList.slice(0, 1).map((user: any, uIdx: number) => (
                                          <img
                                            key={uIdx}
                                            src={user.avatar || "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100"}
                                            alt={user.name}
                                            className="h-4 w-4 rounded-full border border-white object-cover shadow-2xs shrink-0"
                                          />
                                        ))}
                                      </div>
                                      <span className={`w-1 h-1 rounded-full shrink-0 ${
                                        m.status === "completed" ? "bg-emerald-500" :
                                        m.status === "cancelled" ? "bg-rose-500" :
                                        m.status === "no_show" ? "bg-slate-400" : "bg-amber-500"
                                      }`} />
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          
                          {dayMeetings.length > 2 && (
                            <div 
                              onClick={(e) => {
                                e.stopPropagation();
                                setView("day");
                                setCurrentDate(date);
                              }}
                              className="text-[10px] font-bold text-[#e05638] hover:underline mt-auto pt-2 pl-0.5"
                            >
                              View more
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }
                  return cells;
                })()}
              </div>
            )}

            {/* DAY VIEW */}
            {view === "day" && (
              <div className="min-w-[850px] flex flex-col select-none relative">
                {/* Column Headers */}
                <div className="grid grid-cols-[80px_repeat(7,_1fr)] border-b border-slate-100 bg-white">
                  {/* Corner spacing */}
                  <div className="bg-white"></div>
                  {dayViewDates.map((date, idx) => {
                    const isSelectedDay = idx === 3; // Selected day is in the center column
                    
                    // Filter tasks for this day
                    const dayTasks = allTasks.filter((t) => {
                      if (!t.dueAt) return false;
                      const due = new Date(t.dueAt);
                      return due.toDateString() === date.toDateString();
                    });
                    
                    return (
                      <div
                        key={idx}
                        className={`pl-4 pr-3 py-3.5 flex items-center justify-between relative bg-white`}
                      >
                        {isSelectedDay ? (
                          <>
                            <span className="text-xs font-semibold text-slate-700">
                              {date.getDate().toString().padStart(2, "0")} {date.toLocaleString("default", { weekday: "short" })}
                            </span>
                            
                            {dayTasks.length > 0 && (
                              <span className="inline-flex items-center justify-center rounded-full bg-cyan-50 border border-cyan-100 text-cyan-600 px-2 py-0.5 text-[10px] font-bold">
                                {dayTasks.length} {dayTasks.length === 1 ? "Task" : "Tasks"}
                              </span>
                            )}
                          </>
                        ) : (
                          <div className="h-5"></div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Day Slots Grid */}
                <div className="relative flex flex-col bg-white">
                  {HOURS.map((h) => (
                    <div key={h} className="grid grid-cols-[80px_repeat(7,_1fr)] h-16 group/row relative bg-white">
                      {/* Hour label */}
                      <div className="text-xs font-semibold text-slate-500 text-right pr-4 border-r border-slate-100 select-none flex items-center justify-end h-full">
                        {formatHour(h)}
                      </div>
                      
                      {/* 7 Day Cells */}
                      {dayViewDates.map((date, dayIdx) => {
                        const isSelectedDay = dayIdx === 3;
                        
                        // We only show meetings for the selected day in the center column
                        const dayMeetings = isSelectedDay ? filteredMeetings.filter((m) => {
                          const start = new Date(m.startAt);
                          return start.toDateString() === date.toDateString() && start.getHours() === h;
                        }) : [];
                        
                        return (
                          <div
                            key={dayIdx}
                            onClick={() => {
                              if (isSelectedDay) {
                                const selectedDate = new Date(date);
                                selectedDate.setHours(h, 0, 0, 0);
                                setEditingMeeting(null);
                                setDialogOpen(true);
                              }
                            }}
                            className={`relative p-1.5 flex flex-col gap-1 justify-center min-w-0 border-r border-b border-slate-100 ${isSelectedDay ? "hover:bg-slate-50/40 cursor-pointer" : ""}`}
                          >
                            {isSelectedDay && (
                              <span className="absolute top-1 right-1 opacity-0 group-hover/row:opacity-100 transition-opacity bg-slate-200/50 hover:bg-slate-200 text-slate-500 p-0.5 rounded-md text-[8px] flex items-center justify-center shrink-0 pointer-events-none">
                                <Plus className="h-2.5 w-2.5" />
                              </span>
                            )}

                            {/* Render meetings for this hour cell */}
                            {dayMeetings.map((m) => {
                              const isCancelled = m.status === "cancelled" || m.status === "no_show";
                              
                              return (
                                <div
                                  key={m.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingMeeting(m);
                                    setDialogOpen(true);
                                  }}
                                  className={`px-3 py-2.5 rounded-lg flex items-center justify-start shadow-xs hover:shadow-md transition-all cursor-pointer bg-[#e05638] text-white border-l-[3px] border-white pl-2 min-w-0 overflow-hidden w-full h-full text-xs font-semibold`}
                                >
                                  <span className={`truncate ${isCancelled ? "line-through opacity-70" : ""}`}>
                                    {m.title}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AGENDA VIEW */}
            {view === "agenda" && (
              <div className="w-full bg-white min-h-[400px] flex flex-col">
                {agendaMeetings.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center">
                    <span className="text-slate-500 text-sm font-medium">
                      There are no events in this range.
                    </span>
                  </div>
                ) : (
                  <div className="p-6 max-w-xl mx-auto space-y-4 w-full">
                    {agendaMeetings
                      .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
                      .map((m) => {
                        const start = new Date(m.startAt);
                        const end = new Date(m.endAt);
                        const typeStyles = meetingTypeColors[m.meetingType] ?? meetingTypeColors["Cold Visit"];
                        const isCancelled = m.status === "cancelled" || m.status === "no_show";

                        return (
                          <div
                            key={m.id}
                            onClick={() => {
                              setEditingMeeting(m);
                              setDialogOpen(true);
                            }}
                            className={`flex items-start gap-4 p-4 rounded-xl border bg-white hover:shadow-md transition-all cursor-pointer border-l-[4px] ${typeStyles.border}`}
                          >
                            <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-slate-50 border border-slate-100 text-slate-500">
                              <span className="text-[9px] font-bold uppercase tracking-wider">
                                {start.toLocaleString("default", { month: "short" })}
                              </span>
                              <span className="text-base font-bold text-slate-700 mt-0.5">
                                {start.getDate()}
                              </span>
                            </div>
                            
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className={`text-sm font-bold text-slate-800 truncate ${isCancelled ? "line-through text-slate-400" : ""}`}>
                                  {m.title}
                                </h3>
                                <span className={`rounded-full px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider ${statusColors[m.status]}`}>
                                  {statusDisplayNames[m.status]}
                                </span>
                              </div>
                              
                              <p className="text-[11px] text-slate-400 font-semibold mt-1 flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5 shrink-0 text-slate-300" />
                                {start.toLocaleDateString("default", { weekday: "short", month: "short", day: "numeric" })} @ {start.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} – {end.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                              </p>
                              
                              {m.notes && (
                                <p className="mt-2 text-xs text-slate-600 bg-slate-50 rounded-lg p-2.5 italic">
                                  {m.notes}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* dialog template popup */}
      <NewMeetingDialog
        open={dialogOpen}
        onOpenChange={(v) => {
          setDialogOpen(v);
          if (!v) setSelectedSlot(null);
        }}
        meeting={editingMeeting}
        offices={officesQuery.data?.items ?? []}
        users={usersQuery.data?.items ?? []}
        propertyManagers={propertyManagersQuery.data?.items ?? []}
        onDelete={(id) => {
          if (confirm(`Delete meeting?`)) {
            deleteMeeting.mutate(id);
            setDialogOpen(false);
          }
        }}
      />
    </div>
  );
}

const CaretDownIconCustom = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" className="custom-icon text-slate-500 h-3.5 w-3.5 shrink-0 opacity-70">
    <path d="M9.75 4.5L6 8.25L2.25 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ClockIconCustom = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="custom-icon text-slate-400 h-4.5 w-4.5 shrink-0">
    <path d="M12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 7V12H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const CalendarIconCustom = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="custom-icon text-slate-400 h-4.5 w-4.5 shrink-0">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// Dialouge Component
function NewMeetingDialog({
  open,

  onOpenChange,
  meeting,
  offices,
  users,
  propertyManagers,
  onDelete,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  meeting: Meeting | null;
  offices: any[];
  users: any[];
  propertyManagers: any[];
  onDelete: (id: string) => void;
}) {
  const create = useCreateMeeting();
  const update = useUpdateMeeting();

  // Form parameters states
  const [title, setTitle] = useState("");
  const [meetingType, setMeetingType] = useState<MeetingType>("Cold Visit");
  const [status, setStatus] = useState<MeetingStatus>("scheduled");
  const [office, setOffice] = useState("none");
  const [propertyManager, setPropertyManager] = useState("none");
  const [accountManager, setAccountManager] = useState("none");
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [startTime, setStartTime] = useState("09:00 AM");
  const [endTime, setEndTime] = useState("10:00 AM");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Sync edit mode details on open
  useEffect(() => {
    if (meeting) {
      setTitle(meeting.title || "");
      setMeetingType(meeting.meetingType || "Cold Visit");
      setStatus(meeting.status || "scheduled");
      setOffice(typeof meeting.office === "string" ? meeting.office : meeting.office?.id || "none");
      setPropertyManager(typeof meeting.propertyManager === "string" ? meeting.propertyManager : meeting.propertyManager?.id || "none");
      
      const attendeeId = meeting.attendees?.[0];
      setAccountManager(typeof attendeeId === "string" ? attendeeId : attendeeId?.id || "none");
      
      const startDate = new Date(meeting.startAt);
      const endDate = new Date(meeting.endAt);
      setDate(startDate);

      // Format to picker format "09:30 AM"
      const formatPickerTime = (d: Date) => {
        let hrs = d.getHours();
        const mins = d.getMinutes().toString().padStart(2, "0");
        const suffix = hrs >= 12 ? "PM" : "AM";
        hrs = hrs % 12 || 12;
        return `${hrs.toString().padStart(2, "0")}:${mins} ${suffix}`;
      };

      setStartTime(formatPickerTime(startDate));
      setEndTime(formatPickerTime(endDate));
      setNotes(meeting.notes || "");
      setError(null);
    } else {
      // Default creation defaults
      setTitle("");
      setMeetingType("Cold Visit");
      setStatus("scheduled");
      setOffice("none");
      setPropertyManager("none");
      setAccountManager("none");
      setDate(new Date(2026, 5, 3, 9, 0, 0)); // default date
      setStartTime("09:00 AM");
      setEndTime("10:00 AM");
      setNotes("");
      setError(null);
    }
  }, [meeting, open]);

  // Update PM list when selected office updates
  useEffect(() => {
    // If we changed office, reset PM if not related
    if (office !== "none") {
      const officePms = propertyManagers.filter((pm) => pm.office === office || pm.office?.id === office);
      const pmStillValid = officePms.some((pm) => pm.id === propertyManager);
      if (!pmStillValid && propertyManager !== "none") {
        setPropertyManager("none");
      }
    }
  }, [office, propertyManagers]);

  // Dynamically filter PMs based on selected office
  const filteredPms = useMemo(() => {
    if (office === "none") return propertyManagers;
    return propertyManagers.filter((pm) => pm.office === office || pm.office?.id === office);
  }, [office, propertyManagers]);

  function reset() {
    setTitle("");
    setMeetingType("Cold Visit");
    setStatus("scheduled");
    setOffice("none");
    setPropertyManager("none");
    setAccountManager("none");
    setDate(undefined);
    setStartTime("09:00 AM");
    setEndTime("10:00 AM");
    setNotes("");
    setError(null);
  }

  async function onSave() {
    setError(null);
    if (!title.trim()) return setError("Title is required");
    if (!date) return setError("Please select a date");

    const parsedStart = parseDisplayTime(startTime);
    const parsedEnd = parseDisplayTime(endTime);

    const startAt = new Date(date);
    startAt.setHours(parsedStart.hours, parsedStart.minutes, 0, 0);

    const endAt = new Date(date);
    endAt.setHours(parsedEnd.hours, parsedEnd.minutes, 0, 0);

    if (endAt <= startAt) return setError("End time must be after start time");

    try {
      const payload = {
        title: title.trim(),
        meetingType,
        status,
        office: office === "none" ? undefined : office,
        propertyManager: propertyManager === "none" ? undefined : propertyManager,
        attendees: accountManager === "none" ? undefined : [accountManager],
        startAt: startAt.toISOString(),
        endAt: endAt.toISOString(),
        notes: notes.trim() || undefined,
      };

      if (meeting) {
        await update.mutateAsync({
          id: meeting.id,
          patch: payload,
        });
      } else {
        await create.mutateAsync(payload);
      }
      reset();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save meeting");
    }
  }

  function parseDisplayTime(timeStr: string): { hours: number; minutes: number } {
    const match = timeStr.match(/^(\d{2}):(\d{2})\s*(AM|PM)$/i);
    if (!match) return { hours: 9, minutes: 0 };
    let hours = parseInt(match[1]);
    const minutes = parseInt(match[2]);
    const ampm = match[3].toUpperCase();
    
    if (ampm === "PM" && hours < 12) hours += 12;
    if (ampm === "AM" && hours === 12) hours = 0;
    
    return { hours, minutes };
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogContent className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 max-w-xl rounded-[20px] border border-slate-100 p-0 max-h-[95vh] overflow-hidden flex flex-col bg-white shadow-2xl">
        <DialogHeader className="px-8 pt-8 pb-0 flex flex-row items-center justify-between bg-white border-0">
          <DialogTitle className="text-[22px] font-bold text-slate-800 tracking-tight">
            {meeting ? "Edit Meeting" : "New Meeting"}
          </DialogTitle>
          {meeting && (
            <button
              type="button"
              onClick={() => onDelete(meeting.id)}
              className="text-slate-400 hover:text-red-500 cursor-pointer p-1.5 hover:bg-slate-100 rounded-lg transition-all mr-6"
              aria-label="Delete meeting"
            >
              <Trash2 className="h-4.5 w-4.5" />
            </button>
          )}
        </DialogHeader>

        <div className="p-8 pt-6 space-y-6 text-sm flex-1 overflow-y-auto">
          {/* Title */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-slate-800">Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Visit - Office Name"
              className="rounded-xl border-slate-200 text-sm h-12 px-4 focus:border-[#e05638] focus:ring-2 focus:ring-[#e05638]/10 transition-all font-medium text-slate-800 placeholder:text-slate-400 bg-white"
              autoFocus
            />
          </div>

          {/* Meeting Type & Status */}
          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-800">Meeting Type</Label>
              <Select value={meetingType} onValueChange={(v) => setMeetingType(v as MeetingType)}>
                <SelectTrigger className="rounded-xl border-slate-200 text-sm h-12 px-4 focus:ring-2 focus:ring-[#e05638]/10 focus:border-[#e05638] transition-all font-medium text-slate-700 bg-white [&_svg:not(.custom-icon)]:hidden flex items-center justify-between w-full">
                  <SelectValue />
                  <CaretDownIconCustom />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="Property Manager Meeting" className="text-xs">Property Manager Meeting</SelectItem>
                  <SelectItem value="Cold Visit" className="text-xs">Cold Visit</SelectItem>
                  <SelectItem value="Follow-up" className="text-xs">Follow-up</SelectItem>
                  <SelectItem value="Training" className="text-xs">Training</SelectItem>
                  <SelectItem value="Other" className="text-xs">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-800">Status</Label>
              <Select value={status} onValueChange={(v) => setStatus(v as MeetingStatus)}>
                <SelectTrigger className="rounded-xl border-slate-200 text-sm h-12 px-4 focus:ring-2 focus:ring-[#e05638]/10 focus:border-[#e05638] transition-all font-medium text-slate-700 bg-white [&_svg:not(.custom-icon)]:hidden flex items-center justify-between w-full">
                  <SelectValue />
                  <CaretDownIconCustom />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="scheduled" className="text-xs">Scheduled</SelectItem>
                  <SelectItem value="completed" className="text-xs">Completed</SelectItem>
                  <SelectItem value="cancelled" className="text-xs">Cancelled</SelectItem>
                  <SelectItem value="no_show" className="text-xs">No Show</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Agency Office & Property Manager */}
          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-800">Agency Office</Label>
              <Select value={office} onValueChange={setOffice}>
                <SelectTrigger className="rounded-xl border-slate-200 text-sm h-12 px-4 focus:ring-2 focus:ring-[#e05638]/10 focus:border-[#e05638] transition-all font-medium text-slate-700 bg-white [&_svg:not(.custom-icon)]:hidden flex items-center justify-between w-full">
                  <SelectValue placeholder="Select an office..." />
                  <CaretDownIconCustom />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="none" className="text-xs">Select an office...</SelectItem>
                  {offices.map((o) => (
                    <SelectItem key={o.id} value={o.id} className="text-xs">
                      {o.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-800">Property Manager</Label>
              <Select value={propertyManager} onValueChange={setPropertyManager}>
                <SelectTrigger className="rounded-xl border-slate-200 text-sm h-12 px-4 focus:ring-2 focus:ring-[#e05638]/10 focus:border-[#e05638] transition-all font-medium text-slate-700 bg-white [&_svg:not(.custom-icon)]:hidden flex items-center justify-between w-full">
                  <SelectValue placeholder="General / Cold Visit" />
                  <CaretDownIconCustom />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="none" className="text-xs">General / Cold Visit</SelectItem>
                  {filteredPms.map((pm) => (
                    <SelectItem key={pm.id} value={pm.id} className="text-xs">
                      {pm.firstName} {pm.lastName} ({pm.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Account Manager (labeled Property Manager in mockup) */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-slate-800">Property Manager</Label>
            <Select value={accountManager} onValueChange={setAccountManager}>
              <SelectTrigger className="rounded-xl border-slate-200 text-sm h-12 px-4 focus:ring-2 focus:ring-[#e05638]/10 focus:border-[#e05638] transition-all font-medium text-slate-700 bg-white [&_svg:not(.custom-icon)]:hidden flex items-center justify-between w-full">
                <SelectValue placeholder="General / Cold Visit" />
                <CaretDownIconCustom />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="none" className="text-xs">General / Cold Visit</SelectItem>
                {users.map((u) => (
                  <SelectItem key={u.id} value={u.id} className="text-xs">
                    {u.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date & Start/End Time */}
          <div className="grid grid-cols-3 gap-5">
            {/* Date */}
            <div className="space-y-2 col-span-1">
              <Label className="text-sm font-semibold text-slate-800">Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between flex items-center rounded-xl border-slate-200 text-sm h-12 text-slate-700 font-medium hover:bg-slate-50 transition-all cursor-pointer px-4 bg-white">
                    {date ? `${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getDate().toString().padStart(2, "0")}/${date.getFullYear()}` : <span className="text-slate-400">06/01/2026</span>}
                    <CalendarIconCustom />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 rounded-xl" align="start">
                  <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
                </PopoverContent>
              </Popover>
            </div>

            {/* Start Time */}
            <div className="space-y-2 col-span-1">
              <Label className="text-sm font-semibold text-slate-800">Start Time</Label>
              <Select value={startTime} onValueChange={setStartTime}>
                <SelectTrigger className="rounded-xl border-slate-200 text-sm h-12 px-4 focus:ring-2 focus:ring-[#e05638]/10 focus:border-[#e05638] transition-all font-medium text-slate-700 bg-white [&_svg:not(.custom-icon)]:hidden flex items-center justify-between w-full">
                  <SelectValue />
                  <ClockIconCustom />
                </SelectTrigger>
                <SelectContent className="max-h-[220px] rounded-xl">
                  {TIME_PICKER_SLOTS.map((slot) => (
                    <SelectItem key={slot} value={slot} className="text-xs">
                      {slot}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* End Time */}
            <div className="space-y-2 col-span-1">
              <Label className="text-sm font-semibold text-slate-800">End Time</Label>
              <Select value={endTime} onValueChange={setEndTime}>
                <SelectTrigger className="rounded-xl border-slate-200 text-sm h-12 px-4 focus:ring-2 focus:ring-[#e05638]/10 focus:border-[#e05638] transition-all font-medium text-slate-700 bg-white [&_svg:not(.custom-icon)]:hidden flex items-center justify-between w-full">
                  <SelectValue />
                  <ClockIconCustom />
                </SelectTrigger>
                <SelectContent className="max-h-[220px] rounded-xl">
                  {TIME_PICKER_SLOTS.map((slot) => (
                    <SelectItem key={slot} value={slot} className="text-xs">
                      {slot}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-2.5 text-xs font-semibold text-red-600">
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-4 flex justify-between gap-5">
            <Button
              variant="outline"
              type="button"
              onClick={() => onOpenChange(false)}
              className="flex-1 rounded-xl cursor-pointer text-sm h-12 font-bold text-slate-700 border-slate-200 bg-white hover:bg-slate-50 transition-all"
            >
              Cancel
            </Button>
            <Button
              onClick={onSave}
              disabled={create.isPending || update.isPending}
              className="flex-1 rounded-xl bg-[#e05638] text-white hover:bg-[#e05638]/90 cursor-pointer shadow-md hover:shadow-lg transition-all text-sm h-12 font-bold"
            >
              {(create.isPending || update.isPending) && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin shrink-0" />}
              {meeting ? "Save Changes" : "Schedule Meeting"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
