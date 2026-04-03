import { useEffect, useMemo, useState } from "react";
import { fetchFlags, updateFlag } from "../api.js";
import {
  getFlag,
  setFlag as persistFlag,
  setFlagsBatch,
} from "../featureFlags.js";

export default function useFlag(name, options = {}) {
  const { dashboardPassword } = options;
  const [value, setValue] = useState(() => getFlag(name));

  useEffect(() => {
    setValue(getFlag(name));
  }, [name]);

  useEffect(() => {
    let cancelled = false;

    async function syncFromServer() {
      const remoteFlags = await fetchFlags();
      if (!remoteFlags || cancelled) {
        return;
      }

      setFlagsBatch(remoteFlags);
      setValue(getFlag(name));
    }

    syncFromServer();

    return () => {
      cancelled = true;
    };
  }, [name]);

  useEffect(() => {
    const handleStorage = (event) => {
      if (!event.key || event.key === `ff_${name}`) {
        setValue(getFlag(name));
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener("storage", handleStorage);
    };
  }, [name]);

  const setFlagValue = useMemo(
    () => async (nextValue) => {
      const resolvedValue =
        typeof nextValue === "function" ? nextValue(getFlag(name)) : nextValue;

      // Optimistic local update keeps UI reactive even if network is slow.
      persistFlag(name, resolvedValue);
      setValue(resolvedValue);

      if (!dashboardPassword) {
        return;
      }

      try {
        const updatedFlags = await updateFlag(
          dashboardPassword,
          name,
          resolvedValue,
        );
        if (updatedFlags) {
          setFlagsBatch(updatedFlags);
          setValue(getFlag(name));
        }
      } catch {
        // Keep optimistic value if remote save fails.
      }
    },
    [dashboardPassword, name],
  );

  return [value, setFlagValue];
}
