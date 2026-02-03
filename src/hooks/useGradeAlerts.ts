// hooks/useGradeAlerts.ts
import { useEffect, useRef } from 'react';
import type { GradeItem } from '../types/grade';

export const useGradeAlerts = (args: {
  enabled: boolean;
  gradeData: GradeItem[];
  currentTimeStr: string;
  onPlay: () => void;
}) => {
  const { enabled, gradeData, currentTimeStr, onPlay } = args;

  const notifiedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    // reset quando o relógio muda (evita spam)
    notifiedRef.current.clear();
  }, [currentTimeStr]);

  useEffect(() => {
    if (!enabled) return;

    let shouldSound = false;

    gradeData.forEach(item => {
      const activeTime = item.horarioManual || item.horario;
      if (activeTime === currentTimeStr && !notifiedRef.current.has(item.tournamentKey)) {
        shouldSound = true;
        notifiedRef.current.add(item.tournamentKey);
      }
    });

    if (shouldSound) onPlay();
  }, [enabled, gradeData, currentTimeStr, onPlay]);

  return { notifiedRef };
};
