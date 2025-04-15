// \\ frontend/src/hooks/useSpeech.jsx

import { createContext, useContext, useEffect, useState } from "react";
import axiosInstance from "../utils/axiosInstance";

const backendUrl = "http://localhost:3000";

const SpeechContext = createContext();

export const SpeechProvider = ({ children }) => {
  const token = localStorage.getItem("token");
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState();
  const [loading, setLoading] = useState(false);

  let chunks = [];

  const initiateRecording = () => {
    chunks = [];
  };

  const onDataAvailable = (e) => {
    chunks.push(e.data);
  };

  // TTS logic
  const tts = async (message) => {
    setLoading(true);
    const {data} = await axiosInstance.post({query: query}, {
        headers: {
            Authorization: `Bearer ${token}`,
          },
    })
    //  fetch(`${backendUrl}/tts`, {
    //   method: "POST",
    //   headers: {
    //     "Content-Type": "application/json",
    //   },
    //   body: JSON.stringify({ message }),
    // });
    console.log(data);
    const response = data.messages;
    setMessages((messages) => [...messages, ...response]);
    setLoading(false);
  };

  const onMessagePlayed = () => {
    setMessages((messages) => messages.slice(1));
  };

  useEffect(() => {
    if (messages.length > 0) {
      setMessage(messages[0]);
    } else {
      setMessage(null);
    }
  }, [messages]);

  return (
    <SpeechContext.Provider
      value={{
        tts,
        message,
        onMessagePlayed,
        loading,
      }}
    >
      {children}
    </SpeechContext.Provider>
  );
};

export const useSpeech = () => {
  const context = useContext(SpeechContext);
  if (!context) {
    throw new Error("useSpeech must be used within a SpeechProvider");
  }
  return context;
};
