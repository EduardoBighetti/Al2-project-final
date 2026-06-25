import React, { createContext, useContext, useState } from 'react';

interface SerialContextType {
  isConnected: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  writeToSerial: (data: string) => Promise<void>;
  readFromSerial: () => Promise<string>;
  serialOutput: string[];
  liveData: { value: number }[];
  activePins: number[];
  lastForwarded: { id: string; temp: number; hum?: number } | null;
  send: (data: string) => void;
  clearLogs: () => void;
}

const SerialContext = createContext<SerialContextType | undefined>(undefined);

export const SerialProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [serialOutput, setSerialOutput] = useState<string[]>([]);
  const [liveData, setLiveData] = useState<{ value: number }[]>([]);
  const [activePins, setActivePins] = useState<number[]>([]);
  const [lastForwarded, setLastForwarded] = useState<{ id: string; temp: number; hum?: number } | null>(null);

  const connect = async () => { setIsConnected(true); };
  const disconnect = async () => { setIsConnected(false); };
  const writeToSerial = async (data: string) => { console.log('Serial Write:', data); };
  const readFromSerial = async () => { return ''; };
  const send = (data: string) => { console.log('Send:', data); };
  const clearLogs = () => { setSerialOutput([]); };

  return (
    <SerialContext.Provider value={{ 
      isConnected, connect, disconnect, writeToSerial, readFromSerial,
      serialOutput, liveData, activePins, lastForwarded, send, clearLogs
    }}>
      {children}
    </SerialContext.Provider>
  );
};

export const useSerial = () => {
  const context = useContext(SerialContext);
  if (!context) {
    throw new Error('useSerial must be used within a SerialProvider');
  }
  return context;
};
