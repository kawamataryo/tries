import { CalculatorEvent } from "./type.ts";

const kv = new Map<string, CalculatorEvent[]>();

const key = 'EVENT_KEY'

export const getEvents = () => {
  const eventEntries = kv.get(key);
  return eventEntries ?? [];
};

export const saveEvent = (event: CalculatorEvent) => {
  const eventEntries = getEvents()
  eventEntries.push(event);
  kv.set(key, eventEntries);
};

export const resetEvents = () => {
  kv.set(key, []);
};
