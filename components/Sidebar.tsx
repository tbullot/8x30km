"use client";

import { useState } from "react";
import editions from "@/data/editions";
import { formatTime } from "@/lib/utils";

type Props = {
  selectedYear: string | null;
  selectedDay: number | null;
  onSelectEdition: (year: string | null) => void;
  onSelectDay: (year: string, day: number) => void;
};

export default function Sidebar({ selectedYear, selectedDay, onSelectEdition, onSelectDay }: Props) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSelectEdition = (year: string | null) => {
    onSelectEdition(year);
  };

  const handleSelectDay = (year: string, day: number) => {
    onSelectDay(year, day);
    setMobileOpen(false); // close sheet on mobile after selecting
  };

  const content = (
    <>
      {/* All editions button */}
      <button
        onClick={() => handleSelectEdition(null)}
        className={`mx-3 mt-3 mb-1 px-3 py-2 rounded-lg text-sm font-semibold transition-colors text-left ${
          selectedYear === null
            ? "bg-white/10 text-white"
            : "text-white/40 hover:text-white hover:bg-white/5"
        }`}
      >
        All editions
      </button>

      {/* Edition list */}
      <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-2">
        {editions.map((edition) => {
          const isOpen = selectedYear === edition.year;
          const totalKm = edition.activities.reduce((s, a) => s + a.distance_km, 0);
          const totalTime = edition.activities.reduce((s, a) => s + a.moving_time_s, 0);

          return (
            <div key={edition.year} className="rounded-xl overflow-hidden border border-white/10">
              <button
                onClick={() => handleSelectEdition(isOpen ? null : edition.year)}
                className="w-full flex items-center justify-between px-3 py-3 hover:bg-white/5 transition-colors text-left"
              >
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: edition.color }} />
                  <div>
                    <div className="text-sm font-bold text-white">{edition.label}</div>
                    <div className="text-xs text-white/40">{edition.year} · {totalKm.toFixed(0)} km</div>
                  </div>
                </div>
                <span className={`text-white/40 text-sm transition-transform duration-200 inline-block ${isOpen ? "rotate-90" : ""}`}>›</span>
              </button>

              {isOpen && (
                <div className="bg-black/20 divide-y divide-white/5">
                  {edition.activities.map((activity) => {
                    const isSelected = selectedDay === activity.day;
                    return (
                      <button
                        key={activity.day}
                        onClick={() => handleSelectDay(edition.year, activity.day)}
                        className={`w-full flex items-center justify-between px-3 py-2.5 text-left transition-colors ${
                          isSelected ? "bg-white/10" : "hover:bg-white/5"
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span
                              className="text-xs font-bold px-1.5 py-0.5 rounded"
                              style={{ background: edition.color + "33", color: edition.color }}
                            >
                              Day {activity.day}
                            </span>
                            <span className="text-xs text-white/60">{activity.date.slice(5)}</span>
                          </div>
                          <div className="text-xs text-white/40 mt-0.5">{formatTime(activity.moving_time_s)}</div>
                        </div>
                        <span className="text-sm font-semibold text-white/70">
                          {activity.distance_km.toFixed(1)} km
                        </span>
                      </button>
                    );
                  })}
                  <div className="px-3 py-2 flex justify-between text-xs text-white/30">
                    <span>Total</span>
                    <span>{formatTime(totalTime)} · {totalKm.toFixed(1)} km</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-white/10 text-xs text-white/20 text-center hidden sm:block">
        Tom & Julien · 2018 · 2021 · 2026
      </div>
    </>
  );

  return (
    <>
      {/* ── DESKTOP: fixed left sidebar ── */}
      <div className="hidden sm:flex absolute top-0 left-0 h-full w-[260px] bg-zinc-900/90 backdrop-blur-sm border-r border-white/10 flex-col overflow-hidden z-10">
        <div className="p-5 border-b border-white/10">
          <div className="text-2xl font-black text-white tracking-tight">8×30km</div>
          <div className="text-xs text-white/40 mt-0.5">8 days · 8 segments · ~30km each</div>
        </div>
        {content}
      </div>

      {/* ── MOBILE: floating header pill + bottom sheet ── */}
      <div className="sm:hidden">
        {/* Top pill */}
        <button
          onClick={() => setMobileOpen(true)}
          className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-zinc-900/95 backdrop-blur-sm border border-white/10 rounded-full px-4 py-2 shadow-lg"
        >
          <span className="text-white font-black text-base tracking-tight">8×30km</span>
          <span className="text-white/40 text-xs">☰</span>
        </button>

        {/* Edition color dots on map (always visible) */}
        <div className="absolute top-4 right-4 z-20 flex flex-col gap-1.5">
          {editions.map((e) => (
            <button
              key={e.year}
              onClick={() => { handleSelectEdition(e.year); }}
              className="flex items-center gap-1.5 bg-zinc-900/80 backdrop-blur-sm rounded-full px-2.5 py-1 border border-white/10"
            >
              <div className="w-2 h-2 rounded-full" style={{ background: e.color }} />
              <span className="text-xs text-white/70 font-medium">{e.year}</span>
            </button>
          ))}
        </div>

        {/* Bottom sheet backdrop */}
        {mobileOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30"
            onClick={() => setMobileOpen(false)}
          />
        )}

        {/* Bottom sheet */}
        <div className={`fixed bottom-0 left-0 right-0 z-40 bg-zinc-900 rounded-t-2xl border-t border-white/10 transition-transform duration-300 ${mobileOpen ? "translate-y-0" : "translate-y-full"}`}
          style={{ maxHeight: "75vh", display: "flex", flexDirection: "column" }}
        >
          {/* Handle + header */}
          <div className="flex flex-col items-center pt-3 pb-2 border-b border-white/10 px-5">
            <div className="w-10 h-1 rounded-full bg-white/20 mb-3" />
            <div className="w-full flex items-center justify-between">
              <div>
                <div className="text-lg font-black text-white tracking-tight">8×30km</div>
                <div className="text-xs text-white/40">8 days · 8 segments · ~30km each</div>
              </div>
              <button onClick={() => setMobileOpen(false)} className="text-white/40 text-2xl px-2">×</button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto flex flex-col">
            {content}
          </div>
        </div>
      </div>
    </>
  );
}
