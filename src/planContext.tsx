import React, { createContext, useContext, useState, ReactNode } from 'react';

export type PlanId = 'bronze' | 'silver' | 'gold' | null;

interface PlanContextValue {
  currentPlan: PlanId;
  setCurrentPlan: (plan: PlanId) => void;
}

const PlanContext = createContext<PlanContextValue | undefined>(undefined);

export const PlanProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentPlan, setCurrentPlan] = useState<PlanId>(null);

  return (
    <PlanContext.Provider value={{ currentPlan, setCurrentPlan }}>
      {children}
    </PlanContext.Provider>
  );
};

export const usePlan = (): PlanContextValue => {
  const ctx = useContext(PlanContext);
  if (!ctx) {
    throw new Error('usePlan must be used within a PlanProvider');
  }
  return ctx;
};
