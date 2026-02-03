// hooks/useGradeSlots.ts
import { useMemo, useState } from 'react';
import type { GradeConfig, GradeSlot } from './../types/grade';

export const DEFAULT_GRADE_CONFIG: GradeConfig = {
  minSampling: 3,
  minRoi: '',
  startTime: '00:00',
  endTime: '23:59',
  minStake: '',
  maxStake: '',
  minField: '',
  maxField: '',
  selRede: [],
  selSpeed: [],
  excludeKeywords: []
};

export const normalizeConfig = (cfg: any): GradeConfig => {
  const base = cfg || {};
  return {
    minSampling: base.minSampling ?? 3,
    minRoi: base.minRoi ?? '',
    startTime: base.startTime ?? '00:00',
    endTime: base.endTime ?? '23:59',
    minStake: base.minStake ?? '',
    maxStake: base.maxStake ?? '',
    minField: base.minField ?? '',
    maxField: base.maxField ?? '',
    selRede: Array.isArray(base.selRede)
      ? base.selRede
      : Array.isArray(base.selNetwork)
        ? base.selNetwork
        : [],
    selSpeed: Array.isArray(base.selSpeed)
      ? base.selSpeed
      : Array.isArray(base.selVelocidade)
        ? base.selVelocidade
        : [],
    excludeKeywords: Array.isArray(base.excludeKeywords) ? base.excludeKeywords : []
  };
};

export const useGradeSlots = () => {
  const [slots, setSlots] = useState<GradeSlot[]>([
    { id: 1, name: 'Grade 1', days: [], config: { ...DEFAULT_GRADE_CONFIG }, manualTimes: {}, manuallyAddedKeys: [], excludedKeys: [], statsCache: {} },
    { id: 2, name: 'Grade 2', days: [], config: { ...DEFAULT_GRADE_CONFIG }, manualTimes: {}, manuallyAddedKeys: [], excludedKeys: [], statsCache: {} },
    { id: 3, name: 'Grade 3', days: [], config: { ...DEFAULT_GRADE_CONFIG }, manualTimes: {}, manuallyAddedKeys: [], excludedKeys: [], statsCache: {} }
  ]);

  const [activeSlotId, setActiveSlotId] = useState<string | number>(1);

  const activeSlot = useMemo(
    () => slots.find(s => s.id === activeSlotId) || slots[0],
    [slots, activeSlotId]
  );

  const updateActiveSlot = (updates: Partial<GradeSlot>) => {
    setSlots(prev => prev.map(s => (s.id === activeSlotId ? { ...s, ...updates } : s)));
  };

  const switchSlot = (id: string | number) => {
    setActiveSlotId(id);
  };

  const addSlot = () => {
    setSlots(prev => {
      if (prev.length >= 8) return prev;
      const newSlot: GradeSlot = {
        id: Date.now(),
        name: `Grade ${prev.length + 1}`,
        days: [],
        config: { ...DEFAULT_GRADE_CONFIG },
        manualTimes: {},
        manuallyAddedKeys: [],
        excludedKeys: [],
        statsCache: {}
      };
      setActiveSlotId(newSlot.id);
      return [...prev, newSlot];
    });
  };

  const removeSlot = (id: string | number) => {
    setSlots(prev => {
      if (prev.length <= 1) return prev;
      const next = prev.filter(s => s.id !== id);
      if (activeSlotId === id) setActiveSlotId(next[0].id);
      return next;
    });
  };

  return {
    slots,
    setSlots,
    activeSlotId,
    activeSlot,
    setActiveSlotId,
    updateActiveSlot,
    switchSlot,
    addSlot,
    removeSlot
  };
};
