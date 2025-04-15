import React, { createContext, useContext } from 'react';
import { useSpeech } from '../../hooks/useSpeech';


const SpeechContext = createContext(null);

export const SpeechProvider = ({ children }) => {
  const speechService = useSpeech();
  
  return (
    <SpeechContext.Provider value={speechService}>
      {children}
    </SpeechContext.Provider>
  );
};

export const useSpeechContext = () => {
  const context = useContext(SpeechContext);
  if (!context) {
    throw new Error('useSpeechContext must be used within a SpeechProvider');
  }
  return context;
};