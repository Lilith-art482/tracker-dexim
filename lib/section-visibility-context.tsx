"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

interface SubVisibility {
  [key: string]: boolean;
}

interface SectionVisibilityState {
  planner: { visible: boolean };
  ideas: { visible: boolean };
  finance: { visible: boolean; sub: SubVisibility };
  work: { visible: boolean; sub: SubVisibility };
  habits: { visible: boolean };
  family: { visible: boolean; sub: SubVisibility };
  sport: { visible: boolean };
  sleep: { visible: boolean; sub: SubVisibility };
  focusing: { visible: boolean; sub: SubVisibility };
}

const DEFAULT_STATE: SectionVisibilityState = {
  planner: { visible: true },
  ideas: { visible: true },
  finance: {
    visible: true,
    sub: { dashboard: true, accounts: true, planning: true, goals: true, loans: true, emergency: true, shopping: true, recurring: true, settings: true },
  },
  work: { visible: true, sub: {} },
  habits: { visible: true },
  family: {
    visible: true,
    sub: { calendar: true, cycle: true, men: true, stats: true },
  },
  sport: { visible: true },
  sleep: {
    visible: true,
    sub: { planning: true, diary: true, stats: true },
  },
  focusing: {
    visible: true,
    sub: { pomodoro: true, ultradian: true, timeboxing: true, "1-3-5": true, farm: true, forest: true },
  },
};

const STORAGE_KEY = "inmotion_section_visibility";

interface SectionVisibilityContextValue {
  visibility: SectionVisibilityState;
  isSectionVisible: (section: string) => boolean;
  isSubVisible: (section: string, subId: string) => boolean;
  toggleSection: (section: string) => void;
  toggleSub: (section: string, subId: string) => void;
}

const SectionVisibilityContext = createContext<SectionVisibilityContextValue>({
  visibility: DEFAULT_STATE,
  isSectionVisible: () => true,
  isSubVisible: () => true,
  toggleSection: () => {},
  toggleSub: () => {},
});

export function SectionVisibilityProvider({ children }: { children: ReactNode }) {
  const [visibility, setVisibility] = useState<SectionVisibilityState>(DEFAULT_STATE);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setVisibility((prev) => {
          const merged = { ...prev } as Record<string, unknown>;
          for (const key of Object.keys(parsed)) {
            if (merged[key]) {
              const prevSection = merged[key] as Record<string, unknown>;
              const parsedSection = parsed[key] as Record<string, unknown>;
              if (prevSection.sub && parsedSection.sub) {
                merged[key] = {
                  ...prevSection,
                  ...parsedSection,
                  sub: { ...(prevSection.sub as Record<string, boolean>), ...(parsedSection.sub as Record<string, boolean>) },
                };
              } else {
                merged[key] = { ...prevSection, ...parsedSection };
              }
            }
          }
          return merged as unknown as SectionVisibilityState;
        });
      }
    } catch {}
  }, []);

  const save = useCallback((state: SectionVisibilityState) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {}
  }, []);

  const toggleSection = useCallback(
    (section: string) => {
      setVisibility((prev) => {
        const key = section as keyof SectionVisibilityState;
        if (!prev[key]) return prev;
        const next = {
          ...prev,
          [key]: { ...prev[key], visible: !prev[key].visible },
        };
        save(next);
        return next;
      });
    },
    [save],
  );

  const toggleSub = useCallback(
    (section: string, subId: string) => {
      setVisibility((prev) => {
        const key = section as keyof SectionVisibilityState;
        if (!prev[key] || !("sub" in prev[key])) return prev;
        const sectionData = prev[key] as { visible: boolean; sub: SubVisibility };
        const next = {
          ...prev,
          [key]: {
            ...sectionData,
            sub: { ...sectionData.sub, [subId]: !sectionData.sub[subId] },
          },
        };
        save(next);
        return next;
      });
    },
    [save],
  );

  const isSectionVisible = useCallback(
    (section: string) => {
      const key = section as keyof SectionVisibilityState;
      return visibility[key]?.visible ?? true;
    },
    [visibility],
  );

  const isSubVisible = useCallback(
    (section: string, subId: string) => {
      const key = section as keyof SectionVisibilityState;
      const sectionData = visibility[key];
      if (!sectionData || !("sub" in sectionData)) return true;
      return (sectionData as { sub: SubVisibility }).sub[subId] ?? true;
    },
    [visibility],
  );

  return (
    <SectionVisibilityContext.Provider
      value={{ visibility, isSectionVisible, isSubVisible, toggleSection, toggleSub }}
    >
      {children}
    </SectionVisibilityContext.Provider>
  );
}

export function useSectionVisibility() {
  return useContext(SectionVisibilityContext);
}
