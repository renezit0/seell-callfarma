import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface PeriodOption {
  id: number;
  label: string;
  startDate: Date;
  endDate: Date;
  status: 'current' | 'past' | 'future';
  description?: string;
}

interface PeriodContextType {
  selectedPeriod: PeriodOption | null;
  setSelectedPeriod: (period: PeriodOption | null) => void;
  onPeriodChange?: (period: PeriodOption | null) => void;
}

const PeriodContext = createContext<PeriodContextType | undefined>(undefined);

interface PeriodProviderProps {
  children: ReactNode;
  onPeriodChange?: (period: PeriodOption | null) => void;
}

export function PeriodProvider({ children, onPeriodChange }: PeriodProviderProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodOption | null>(null);

  useEffect(() => {
    if (onPeriodChange && selectedPeriod) {
      onPeriodChange(selectedPeriod);
    }
  }, [selectedPeriod, onPeriodChange]);

  const value: PeriodContextType = {
    selectedPeriod,
    setSelectedPeriod,
    onPeriodChange,
  };

  return (
    <PeriodContext.Provider value={value}>
      {children}
    </PeriodContext.Provider>
  );
}

export function usePeriodContext() {
  const context = useContext(PeriodContext);
  if (context === undefined) {
    throw new Error('usePeriodContext must be used within a PeriodProvider');
  }
  return context;
}

export type { PeriodOption };