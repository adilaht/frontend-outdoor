// src/components/ui/calendar.tsx
"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"
import { cn } from "@/src/utils/cn"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        month_caption: "flex justify-center pt-1 relative items-center mb-4", // Perbaikan dari 'caption' ke 'month_caption'
        caption_label: "text-sm font-medium text-gray-900",
        nav: "space-x-1 flex items-center absolute top-4 w-full justify-between px-4 z-10",
        button_previous: cn(
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 border border-gray-200 rounded-md flex items-center justify-center transition-colors cursor-pointer"
        ),
        button_next: cn(
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 border border-gray-200 rounded-md flex items-center justify-center transition-colors cursor-pointer"
        ),
        month_grid: "w-full border-collapse space-y-1", // Perbaikan dari 'table' ke 'month_grid'
        weekdays: "flex", // Perbaikan dari 'head_row'
        weekday: "text-gray-500 rounded-md w-8 font-normal text-[0.8rem]", // Perbaikan dari 'head_cell'
        week: "flex w-full mt-2", // Perbaikan dari 'row'
        day: cn(
          "h-8 w-8 p-0 text-center text-sm font-normal aria-selected:opacity-100 hover:bg-emerald-100 rounded-md transition-all cursor-pointer flex items-center justify-center"
        ),
        range_start: "day-range-start aria-selected:bg-emerald-600 aria-selected:text-white rounded-l-md", // Menggunakan 'range_start'
        range_end: "day-range-end aria-selected:bg-emerald-600 aria-selected:text-white rounded-r-md", // Menggunakan 'range_end'
        selected: "bg-emerald-600 text-white hover:bg-emerald-600 hover:text-white focus:bg-emerald-600 focus:text-white",
        today: "bg-gray-100 text-gray-950 font-bold",
        outside: "text-gray-400 opacity-50",
        disabled: "text-gray-300 opacity-30 line-through pointer-events-none",
        range_middle: "aria-selected:bg-emerald-50 aria-selected:text-emerald-950 rounded-none",
        hidden: "invisible",
        ...classNames,
      }}
      // Perbaikan cara render Icon untuk react-day-picker versi terbaru
      components={{
        Chevron: (props) => {
          if (props.orientation === "left") {
            return <ChevronLeft className="h-4 w-4" />
          }
          return <ChevronRight className="h-4 w-4" />
        }
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }