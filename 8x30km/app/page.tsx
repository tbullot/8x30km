"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Sidebar from "@/components/Sidebar";
import ActivityPanel from "@/components/ActivityPanel";
import { Activity, Edition } from "@/data/editions";
import editions from "@/data/editions";

const Map = dynamic(() => import("@/components/Map"), { ssr: false });

export default function Home() {
  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const selectedEdition = selectedYear ? editions.find((e) => e.year === selectedYear) ?? null : null;
  const selectedActivity = selectedEdition && selectedDay
    ? selectedEdition.activities.find((a) => a.day === selectedDay) ?? null
    : null;

  const handleSelectEdition = (year: string | null) => {
    setSelectedYear(year);
    setSelectedDay(null);
  };

  const handleSelectDay = (year: string, day: number) => {
    setSelectedYear(year);
    setSelectedDay(day);
  };

  const handleSelectActivity = (edition: Edition, activity: Activity) => {
    setSelectedYear(edition.year);
    setSelectedDay(activity.day);
  };

  const handleClose = () => setSelectedDay(null);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-zinc-950">
      <div className="absolute inset-0">
        <Map
          selectedEditionYear={selectedYear}
          selectedDay={selectedDay}
          onSelectActivity={handleSelectActivity}
        />
      </div>
      <Sidebar
        selectedYear={selectedYear}
        selectedDay={selectedDay}
        onSelectEdition={handleSelectEdition}
        onSelectDay={handleSelectDay}
      />
      {selectedEdition && selectedActivity && (
        <div className="absolute inset-y-0 right-0 z-20 sm:w-[400px] w-full">
          <ActivityPanel
            edition={selectedEdition}
            activity={selectedActivity}
            onClose={handleClose}
          />
        </div>
      )}
    </div>
  );
}
