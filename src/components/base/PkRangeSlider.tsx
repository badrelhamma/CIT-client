import { useEffect, useRef, useState } from "react";
import { formatPk } from "@/services/location";

interface PkRangeSliderProps {
  minKm: number;
  maxKm: number;
  fromKm: number;
  toKm: number;
  onChange: (fromKm: number, toKm: number) => void;
}

export function PkRangeSlider({
  minKm,
  maxKm,
  fromKm,
  toKm,
  onChange,
}: PkRangeSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<"from" | "to" | null>(null);
  const propsRef = useRef({ fromKm, toKm, minKm, maxKm, onChange });
  propsRef.current = { fromKm, toKm, minKm, maxKm, onChange };

  function clientXToValue(clientX: number): number {
    if (!trackRef.current) return minKm;
    const rect = trackRef.current.getBoundingClientRect();
    const pct = Math.max(
      0,
      Math.min(1, (clientX - rect.left) / rect.width),
    );
    const raw = minKm + pct * (maxKm - minKm);
    return Math.round(raw);
  }

  function valueToPct(v: number): number {
    return ((v - minKm) / (maxKm - minKm)) * 100;
  }

  useEffect(() => {
    if (!dragging) return;

    function onMove(e: PointerEvent) {
      const { fromKm, toKm, minKm, maxKm, onChange } = propsRef.current;
      const val = clientXToValue(e.clientX);
      if (dragging === "from") {
        onChange(Math.max(minKm, Math.min(val, toKm - 5)), toKm);
      } else {
        onChange(fromKm, Math.min(maxKm, Math.max(val, fromKm + 5)));
      }
    }

    function onUp() {
      setDragging(null);
    }

    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
    return () => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
    };
  }, [dragging]);

  function handleTrackPointerDown(e: React.PointerEvent) {
    const val = clientXToValue(e.clientX);
    const distFrom = Math.abs(val - fromKm);
    const distTo = Math.abs(val - toKm);
    setDragging(distFrom <= distTo ? "from" : "to");
  }

  return (
    <div className="select-none">
      <div className="mb-3 flex items-center justify-between font-mono text-sm font-semibold text-ink">
        <span>PK {formatPk(fromKm * 1000)}</span>
        <span className="text-ink-faint font-normal">→</span>
        <span>PK {formatPk(toKm * 1000)}</span>
      </div>

      <div
        ref={trackRef}
        className="relative flex h-6 cursor-pointer items-center touch-none"
        onPointerDown={handleTrackPointerDown}
      >
        <div className="absolute inset-x-0 h-1.5 rounded-full bg-line" />

        <div
          className="absolute h-1.5 rounded-full bg-adm-600"
          style={{
            left: `${valueToPct(fromKm)}%`,
            width: `${valueToPct(toKm) - valueToPct(fromKm)}%`,
          }}
        />

        <button
          type="button"
          aria-label={`PK début: ${formatPk(fromKm * 1000)}`}
          onPointerDown={(e) => {
            e.stopPropagation();
            setDragging("from");
          }}
          className="absolute top-1/2 z-10 size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-adm-600 shadow-md transition-shadow hover:shadow-lg active:shadow-xl touch-none"
          style={{ left: `${valueToPct(fromKm)}%` }}
        />

        <button
          type="button"
          aria-label={`PK fin: ${formatPk(toKm * 1000)}`}
          onPointerDown={(e) => {
            e.stopPropagation();
            setDragging("to");
          }}
          className="absolute top-1/2 z-10 size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-adm-600 shadow-md transition-shadow hover:shadow-lg active:shadow-xl touch-none"
          style={{ left: `${valueToPct(toKm)}%` }}
        />
      </div>

      <div className="mt-1 flex justify-between text-xs text-ink-faint">
        <span>{minKm} km</span>
        <span>{maxKm} km</span>
      </div>
    </div>
  );
}
