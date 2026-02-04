import { useCallback, useEffect, useMemo, useState } from "react";
import { getUserId } from "../services/auth";

export type DatasetTab = { id: number; name: string };

const STORAGE_VERSION = "v1";
const MAX_TABS = 5;

function storageKey(userId: string) {
  return `pdv_dataset_tabs_${STORAGE_VERSION}:${userId}`;
}

function defaultTabs(): { activeId: number; tabs: DatasetTab[] } {
  return {
    activeId: 1,
    tabs: [
      { id: 1, name: "Base 1" },
      { id: 2, name: "Base 2" }
    ]
  };
}

function safeParseJSON<T>(s: string | null): T | null {
  if (!s) return null;
  try {
    return JSON.parse(s) as T;
  } catch {
    return null;
  }
}

/**
 * Abas de "Bases de Dados" (datasets) por usuário.
 * - Começa com 2 abas (Base 1 e Base 2)
 * - Permite criar até +3 (total 5)
 * - Persiste no localStorage por userId
 */
export function useDatasetTabs() {
  const [userId, setUserId] = useState<string | null>(null);
  const [tabs, setTabs] = useState<DatasetTab[]>(defaultTabs().tabs);
  const [activeId, setActiveId] = useState<number>(defaultTabs().activeId);
  const [ready, setReady] = useState(false);

  // Carrega userId e preferências do localStorage
  useEffect(() => {
    let mounted = true;
    (async () => {
      const uid = await getUserId();
      if (!mounted) return;

      setUserId(uid);
      if (!uid) {
        // sem login: mantém default (não salva)
        setTabs(defaultTabs().tabs);
        setActiveId(defaultTabs().activeId);
        setReady(true);
        return;
      }

      const saved = safeParseJSON<{ activeId: number; tabs: DatasetTab[] }>(
        localStorage.getItem(storageKey(uid))
      );

      if (saved?.tabs?.length) {
        // Sanitiza: ids 1..MAX_TABS, nomes não vazios
        const sanitizedTabs = saved.tabs
          .filter((t) => typeof t?.id === "number" && t.id >= 1 && t.id <= MAX_TABS)
          .map((t) => ({ id: t.id, name: (t.name ?? `Base ${t.id}`).toString().trim() || `Base ${t.id}` }))
          .sort((a, b) => a.id - b.id);

        const fallback = defaultTabs();

        const finalTabs = sanitizedTabs.length ? sanitizedTabs : fallback.tabs;
        const savedActive = saved.activeId ?? fallback.activeId;
        const finalActive = finalTabs.some((t) => t.id === savedActive) ? savedActive : finalTabs[0].id;

        setTabs(finalTabs);
        setActiveId(finalActive);
      } else {
        const d = defaultTabs();
        setTabs(d.tabs);
        setActiveId(d.activeId);
        localStorage.setItem(storageKey(uid), JSON.stringify(d));
      }

      setReady(true);
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const persist = useCallback(
    (nextTabs: DatasetTab[], nextActiveId: number) => {
      if (!userId) return;
      localStorage.setItem(storageKey(userId), JSON.stringify({ tabs: nextTabs, activeId: nextActiveId }));
    },
    [userId]
  );

  const setActive = useCallback(
    (id: number) => {
      setActiveId(id);
      persist(tabs, id);
    },
    [persist, tabs]
  );

  const addTab = useCallback(() => {
    if (tabs.length >= MAX_TABS) return;

    const nextId = Math.max(...tabs.map((t) => t.id)) + 1;
    const next: DatasetTab = { id: nextId, name: `Base ${nextId}` };
    const nextTabs = [...tabs, next].sort((a, b) => a.id - b.id);
    setTabs(nextTabs);
    setActiveId(nextId);
    persist(nextTabs, nextId);
  }, [persist, tabs]);

  const renameTab = useCallback(
    (id: number, name: string) => {
      const cleaned = name.trim();
      if (!cleaned) return;

      const nextTabs = tabs.map((t) => (t.id === id ? { ...t, name: cleaned } : t));
      setTabs(nextTabs);
      persist(nextTabs, activeId);
    },
    [activeId, persist, tabs]
  );

  const activeTab = useMemo(() => tabs.find((t) => t.id === activeId) ?? tabs[0], [tabs, activeId]);

  return {
    ready,
    userId,
    tabs,
    activeId,
    activeTab,
    maxTabs: MAX_TABS,
    setActive,
    addTab,
    renameTab
  };
}
