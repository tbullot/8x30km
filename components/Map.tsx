"use client";

import { useEffect, useRef, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import editions, { Activity, Edition } from "@/data/editions";
import { decodePolyline, getBoundsFromCoords, getAllEditionCoords } from "@/lib/utils";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

type Props = {
  selectedEditionYear: string | null;
  selectedDay: number | null;
  onSelectActivity: (edition: Edition, activity: Activity) => void;
};

export default function Map({ selectedEditionYear, selectedDay, onSelectActivity }: Props) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);

  const fitToEdition = useCallback((year: string | null) => {
    if (!map.current) return;
    if (!year) {
      // Fit all editions
      const allCoords = getAllEditionCoords(
        editions.flatMap((e) => e.activities.map((a) => a.map_summary_polyline))
      );
      const bounds = getBoundsFromCoords(allCoords);
      map.current.fitBounds(bounds, { padding: 60, duration: 1200 });
    } else {
      const edition = editions.find((e) => e.year === year);
      if (!edition) return;
      const coords = getAllEditionCoords(edition.activities.map((a) => a.map_summary_polyline));
      const bounds = getBoundsFromCoords(coords);
      map.current.fitBounds(bounds, { padding: 80, duration: 1000 });
    }
  }, []);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: [2.5, 50.5],
      zoom: 5,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    map.current.on("load", () => {
      if (!map.current) return;

      editions.forEach((edition) => {
        edition.activities.forEach((activity) => {
          const coords = decodePolyline(activity.map_summary_polyline);
          const sourceId = `route-${edition.year}-${activity.day}`;
          const layerId = `layer-${edition.year}-${activity.day}`;
          const hoverLayerId = `hover-${edition.year}-${activity.day}`;

          map.current!.addSource(sourceId, {
            type: "geojson",
            data: {
              type: "Feature",
              properties: { year: edition.year, day: activity.day },
              geometry: { type: "LineString", coordinates: coords },
            },
          });

          // Base line
          map.current!.addLayer({
            id: layerId,
            type: "line",
            source: sourceId,
            layout: { "line-join": "round", "line-cap": "round" },
            paint: {
              "line-color": edition.color,
              "line-width": 3,
              "line-opacity": 0.7,
            },
          });

          // Wider invisible hit area
          map.current!.addLayer({
            id: hoverLayerId,
            type: "line",
            source: sourceId,
            layout: { "line-join": "round", "line-cap": "round" },
            paint: { "line-color": "transparent", "line-width": 16 },
          });

          map.current!.on("mouseenter", hoverLayerId, () => {
            if (map.current) map.current.getCanvas().style.cursor = "pointer";
            map.current!.setPaintProperty(layerId, "line-width", 5);
            map.current!.setPaintProperty(layerId, "line-opacity", 1);
          });

          map.current!.on("mouseleave", hoverLayerId, () => {
            if (map.current) map.current.getCanvas().style.cursor = "";
            const isSelected = selectedEditionYear === edition.year && selectedDay === activity.day;
            map.current!.setPaintProperty(layerId, "line-width", isSelected ? 5 : 3);
            map.current!.setPaintProperty(layerId, "line-opacity", isSelected ? 1 : 0.7);
          });

          map.current!.on("click", hoverLayerId, () => {
            onSelectActivity(edition, activity);
          });
        });
      });

      // Fit to all on load
      const allCoords = getAllEditionCoords(
        editions.flatMap((e) => e.activities.map((a) => a.map_summary_polyline))
      );
      const bounds = getBoundsFromCoords(allCoords);
      map.current!.fitBounds(bounds, { padding: 60, duration: 0 });
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Update line styles when selection changes
  useEffect(() => {
    if (!map.current || !map.current.isStyleLoaded()) return;
    editions.forEach((edition) => {
      edition.activities.forEach((activity) => {
        const layerId = `layer-${edition.year}-${activity.day}`;
        if (!map.current!.getLayer(layerId)) return;
        const isSelected = selectedEditionYear === edition.year && selectedDay === activity.day;
        const isEditionSelected = selectedEditionYear === edition.year;
        const isOtherEdition = selectedEditionYear !== null && selectedEditionYear !== edition.year;

        map.current!.setPaintProperty(layerId, "line-width", isSelected ? 6 : isEditionSelected ? 3 : 2.5);
        map.current!.setPaintProperty(layerId, "line-opacity", isSelected ? 1 : isOtherEdition ? 0.2 : 0.65);
      });
    });
  }, [selectedEditionYear, selectedDay]);

  // Fit when edition changes
  useEffect(() => {
    fitToEdition(selectedEditionYear);
  }, [selectedEditionYear, fitToEdition]);

  return <div ref={mapContainer} className="w-full h-full" />;
}
