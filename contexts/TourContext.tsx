import React, { createContext, useContext, useState, ReactNode } from "react";

export type TourType = 'global' | 'dashboard' | 'monitoring' | 'devices' | 'arduino' | null;

interface TourContextData {
  activeTour: TourType;
  startTour: (tour: TourType) => void;
  stopTour: () => void;
}

const TourContext = createContext<TourContextData>({} as TourContextData);

export const TourProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [activeTour, setActiveTour] = useState<TourType>(null);

  const startTour = (tour: TourType) => setActiveTour(tour);
  const stopTour = () => setActiveTour(null);

  return (
    <TourContext.Provider value={{ activeTour, startTour, stopTour }}>
      {children}
    </TourContext.Provider>
  );
};

export const useTour = () => useContext(TourContext);
