"use client";

import { useSyncExternalStore } from "react";

function subscribe() {
  // Nothing to subscribe to — this never changes after the initial client render.
  return () => {};
}

function getClientSnapshot() {
  return true;
}

function getServerSnapshot() {
  return false;
}

/**
 * Returns true once the component has mounted on the client. Used to defer
 * `createPortal` calls (which need `document`) until after SSR/hydration,
 * without the "setState inside an effect" pattern.
 */
export function useIsClient() {
  return useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);
}
