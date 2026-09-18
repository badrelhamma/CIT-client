import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type {
  EventColorId,
  Highway,
  RequestTypeDef,
  StatusDef,
} from "@/types";

export interface EventContextPayload {
  highway: Highway | null;
  pk: number | null;
  direction: string | null;
  color: EventColorId | null;
  type: RequestTypeDef | null;
  sourceIds: string[];
  status: StatusDef | null;
  message: string | null;
  refCode: string | null;
  setHighway: (h: Highway | null) => void;
  setPk: (pk: number | null) => void;
  setDirection: (d: string | null) => void;
  setColor: (c: EventColorId | null) => void;
  setType: (t: RequestTypeDef | null) => void;
  setSourceIds: (ids: string[]) => void;
  setStatus: (s: StatusDef | null) => void;
  setMessage: (m: string | null) => void;
  setRefCode: (ref: string | null) => void;
  fillFromSearch: (payload: {
    highway: Highway | null;
    pk: number | null;
    direction: string | null;
    color: EventColorId | null;
    type: RequestTypeDef | null;
    sourceIds: string[];
    status: StatusDef | null;
    message: string | null;
    refCode: string | null;
  }) => void;
  reset: () => void;
}

const EventContext = createContext<EventContextPayload | null>(null);

export function EventProvider({ children }: { children: ReactNode }) {
  const [highway, setHighway] = useState<Highway | null>(null);
  const [pk, setPk] = useState<number | null>(null);
  const [direction, setDirection] = useState<string | null>(null);
  const [color, setColor] = useState<EventColorId | null>(null);
  const [type, setType] = useState<RequestTypeDef | null>(null);
  const [sourceIds, setSourceIds] = useState<string[]>([]);
  const [status, setStatus] = useState<StatusDef | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [refCode, setRefCode] = useState<string | null>(null);

  const fillFromSearch = useCallback(
    (payload: {
      highway: Highway | null;
      pk: number | null;
      direction: string | null;
      color: EventColorId | null;
      type: RequestTypeDef | null;
      sourceIds: string[];
      status: StatusDef | null;
      message: string | null;
      refCode: string | null;
    }) => {
      setHighway(payload.highway);
      setPk(payload.pk);
      setDirection(payload.direction);
      setColor(payload.color);
      setType(payload.type);
      setSourceIds(payload.sourceIds);
      setStatus(payload.status);
      setMessage(payload.message);
      setRefCode(payload.refCode);
    },
    [],
  );

  const reset = useCallback(() => {
    setHighway(null);
    setPk(null);
    setDirection(null);
    setColor(null);
    setType(null);
    setSourceIds([]);
    setStatus(null);
    setMessage(null);
    setRefCode(null);
  }, []);

  const value = useMemo<EventContextPayload>(
    () => ({
      highway,
      pk,
      direction,
      color,
      type,
      sourceIds,
      status,
      message,
      refCode,
      setHighway,
      setPk,
      setDirection,
      setColor,
      setType,
      setSourceIds,
      setStatus,
      setMessage,
      setRefCode,
      fillFromSearch,
      reset,
    }),
    [
      highway,
      pk,
      direction,
      color,
      type,
      sourceIds,
      status,
      message,
      refCode,
      fillFromSearch,
      reset,
    ],
  );

  return <EventContext.Provider value={value}>{children}</EventContext.Provider>;
}

export function useEvent(): EventContextPayload {
  const ctx = useContext(EventContext);
  if (!ctx) throw new Error("useEvent doit être utilisé dans un EventProvider");
  return ctx;
}