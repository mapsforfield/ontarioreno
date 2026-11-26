// Compact window mode — an admin's portal laid out for stacked windows.
//
// Built for one real setup: a portrait second monitor with the portal open
// in two or three stacked windows, each about 1,100px wide and 600px tall.
// At that size the full desktop layout spends most of the height on headers
// and the 17.5rem sidebar spends a quarter of the width on labels.
//
// Compact mode:
//   - turns the sidebar into a narrow icon rail (expandable on demand),
//   - replaces the "Private access / Broker Portal" header with a slim bar,
//   - tightens gutters and the densest page headers (Deals, Consultations).
//
// It is a per-device preference, kept in localStorage — nothing goes to the
// server, nothing changes for anyone else. A `storage` event keeps every
// portal window on the machine in step, so flipping it in one stacked window
// flips the others. The toggle is admin-only; the setting itself is just a
// layout and is safe to honour while viewing as a rep.

import { useCallback, useSyncExternalStore } from 'react';

const COMPACT_KEY = 'portal.compactMode';
const RAIL_KEY = 'portal.compactRailExpanded';
const LOCAL_EVENT = 'portal-compact-change';

function read(key: string): boolean {
  try {
    return window.localStorage.getItem(key) === '1';
  } catch {
    return false;
  }
}

function write(key: string, value: boolean) {
  try {
    if (value) window.localStorage.setItem(key, '1');
    else window.localStorage.removeItem(key);
  } catch {
    /* private mode / blocked storage: the toggle just won't persist */
  }
  window.dispatchEvent(new Event(LOCAL_EVENT));
}

function subscribe(onChange: () => void) {
  window.addEventListener('storage', onChange);
  window.addEventListener(LOCAL_EVENT, onChange);
  return () => {
    window.removeEventListener('storage', onChange);
    window.removeEventListener(LOCAL_EVENT, onChange);
  };
}

function useFlag(key: string): [boolean, (next: boolean) => void] {
  const value = useSyncExternalStore(
    subscribe,
    () => read(key),
    () => false
  );
  const set = useCallback((next: boolean) => write(key, next), [key]);
  return [value, set];
}

/** True when this device has compact window mode on. */
export function usePortalCompact(): boolean {
  return useFlag(COMPACT_KEY)[0];
}

export function useCompactModeSetting() {
  return useFlag(COMPACT_KEY);
}

/** In compact mode the sidebar is a rail unless the user expands it. */
export function useCompactRailExpanded() {
  return useFlag(RAIL_KEY);
}
