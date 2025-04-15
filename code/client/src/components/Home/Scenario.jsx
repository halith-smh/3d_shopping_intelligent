import { CameraControls, Environment } from "@react-three/drei";
import { useEffect, useRef } from "react";
import { Model } from "./Model";

const Scenario = ({ messageQueue = [] }) => {
  const cameraControls = useRef();
  const modelRef = useRef();
  const processingRef = useRef(false);
  const queueRef = useRef([]);
  
  // Set camera position
  useEffect(() => {
    cameraControls.current.setLookAt(0, 2.2, 5, 0, 1.0, 0, true);
  }, []);
  
  // Process new messages
  useEffect(() => {
    if (messageQueue.length > 0) {
      // Add new messages to the queue
      queueRef.current = [...queueRef.current, ...messageQueue];
      
      // Start processing if not already processing
      if (!processingRef.current) {
        processNextMessage();
      }
    }
  }, [messageQueue]);
  
  // Process messages one at a time
  const processNextMessage = () => {
    if (queueRef.current.length === 0) {
      processingRef.current = false;
      return;
    }
    
    processingRef.current = true;
    const message = queueRef.current.shift();
    
    // Process the message with the model
    if (modelRef.current) {
      modelRef.current.processMessage(message);
      
      // Wait for audio duration before processing next message
      const duration = message.lipsync?.metadata?.duration || 3;
      setTimeout(() => {
        processNextMessage();
      }, duration * 1000 + 500); // Add 500ms buffer between messages
    } else {
      // If model ref isn't available, try again shortly
      setTimeout(processNextMessage, 500);
    }
  };

  return (
    <>
      <CameraControls ref={cameraControls} />
      <Environment preset="sunset" />
      <Model modelRef={modelRef} />
    </>
  );
};

export default Scenario;