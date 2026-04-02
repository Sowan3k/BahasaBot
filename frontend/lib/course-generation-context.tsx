"use client";

// Course Generation Context
// Persists the active job_id in localStorage so that the floating progress card
// survives page navigation and browser refresh during course generation.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

const LS_KEY = "bahasabot_active_job_id";

interface CourseGenerationContextValue {
  activeJobId: string | null;
  setActiveJobId: (jobId: string | null) => void;
}

const CourseGenerationContext = createContext<CourseGenerationContextValue>({
  activeJobId: null,
  setActiveJobId: () => {},
});

export function CourseGenerationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [activeJobId, setActiveJobIdState] = useState<string | null>(null);

  // Hydrate from localStorage after mount (avoids SSR mismatch)
  useEffect(() => {
    const stored = localStorage.getItem(LS_KEY);
    if (stored) setActiveJobIdState(stored);
  }, []);

  const setActiveJobId = useCallback((jobId: string | null) => {
    setActiveJobIdState(jobId);
    if (jobId) {
      localStorage.setItem(LS_KEY, jobId);
    } else {
      localStorage.removeItem(LS_KEY);
    }
  }, []);

  return (
    <CourseGenerationContext.Provider value={{ activeJobId, setActiveJobId }}>
      {children}
    </CourseGenerationContext.Provider>
  );
}

export function useCourseGeneration() {
  return useContext(CourseGenerationContext);
}
