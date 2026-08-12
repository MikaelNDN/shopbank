import { create } from "zustand";

interface AppEvent {
  id: string;
  type: string;
  payload?: unknown;
  timestamp: number;
}

interface EventsStore {
  events: AppEvent[];
  logEvent: (type: string, payload?: unknown) => void;
  getEventsByType: (type: string) => AppEvent[];
}

export const useEventsStore = create<EventsStore>((set, get) => ({
  events: [],
  logEvent: (type, payload) => {
    const newEvent: AppEvent = {
      id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type,
      payload,
      timestamp: Date.now(),
    };

    set((state) => ({
      events: [newEvent, ...state.events].slice(0, 50),
    }));

    if (import.meta.env.DEV) {
      console.debug("[UI EVENT]", type, payload);
    }
  },
  getEventsByType: (type) => get().events.filter((event) => event.type === type),
}));
