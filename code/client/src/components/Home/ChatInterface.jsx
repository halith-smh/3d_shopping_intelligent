import React, { useState, useRef, useEffect } from 'react';
import axiosInstance from '../../utils/axiosInstance';
import toast from 'react-hot-toast';
import { FaMicrophone, FaMicrophoneSlash } from 'react-icons/fa';
import { IoSend } from 'react-icons/io5';

const ChatInterface = ({ onResponse }) => {
    const [loading, setLoading] = useState(false);
    const inputRef = useRef(null);
    const [recording, setRecording] = useState(false);
    const recognitionRef = useRef(null);
    const [micPermission, setMicPermission] = useState(null);

    // Check for microphone permission on component mount
    useEffect(() => {
        checkMicrophonePermission();
    }, []);

    const checkMicrophonePermission = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            // If we get here, permission was granted
            setMicPermission(true);
            
            // Clean up the stream
            stream.getTracks().forEach(track => track.stop());
        } catch (err) {
            console.error("Microphone permission error:", err);
            setMicPermission(false);
        }
    };

    // Initialize speech recognition
    const initSpeechRecognition = () => {
        // Check browser compatibility
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            toast.error('Speech recognition is not supported in your browser');
            return false;
        }

        // Check for microphone permission first
        if (micPermission === false) {
            toast.error('Microphone access is required for speech recognition');
            return false;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();

        // Configure recognition
        recognition.continuous = false;
        recognition.interimResults = true; // Get interim results for better feedback
        recognition.lang = 'en-US';
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
            setRecording(true);
            toast('Listening...', { 
                icon: '🎤',
                duration: 3000 
            });
        };

        recognition.onresult = (event) => {
            const transcript = Array.from(event.results)
                .map(result => result[0].transcript)
                .join('');
                
            // Update input field in real-time with transcription
            if (inputRef.current) {
                inputRef.current.value = transcript;
            }
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            
            // Handle different error types
            switch(event.error) {
                case 'network':
                    toast.error('Network error: Please check your internet connection');
                    break;
                case 'not-allowed':
                case 'permission-denied':
                    toast.error('Microphone access denied. Please allow microphone access.');
                    setMicPermission(false);
                    break;
                case 'no-speech':
                    toast('No speech detected. Please try again.', { icon: '🔇' });
                    break;
                case 'aborted':
                    // User or system aborted - no need for error message
                    break;
                default:
                    toast.error(`Recognition error: ${event.error}`);
            }
            
            setRecording(false);
        };

        recognition.onend = () => {
            setRecording(false);
            // Only auto-send if there's actual text and it was successful
            if (inputRef.current?.value.trim() && micPermission !== false) {
                sendMessage();
            }
        };

        recognitionRef.current = recognition;
        return true;
    };

    const toggleRecording = async () => {
        if (recording) {
            // Stop recording
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
            setRecording(false);
            return;
        }
        
        // If mic permission is unknown, check it first
        if (micPermission === null) {
            await checkMicrophonePermission();
        }
        
        // Initialize recognition if needed
        if (!recognitionRef.current && !initSpeechRecognition()) {
            return;
        }
        
        try {
            // Start recognition
            recognitionRef.current.start();
        } catch (error) {
            console.error('Error starting speech recognition:', error);
            toast.error('Could not start speech recognition. Please try again.');
            setRecording(false);
        }
    };

    const sendMessage = async () => {
        const message = inputRef.current.value.trim();
        if (!message || loading) return;

        try {
            setLoading(true);
            
            // Clear input
            inputRef.current.value = '';
            
            // Send to backend
            const token = localStorage.getItem('token');
            const { data } = await axiosInstance.post('/api/v1/llm/get-response/test', 
                { query: message },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    }
                }
            );

            // Process response
            if (data.statusCode === 200) {
                // Format messages to ensure they have the required properties
                const formattedMessages = (data.data.messages || []).filter(msg => msg).map(msg => {
                    // Ensure each message has at least a text property
                    return {
                        ...msg,
                        text: msg.text || msg.content || message,
                        // Add a default lipsync duration if not provided
                        lipsync: msg.lipsync || { metadata: { duration: 5 } }
                    };
                });
                
                // Format products data if available
                const formattedProducts = (data.data.products || []).filter(p => p).map(product => {
                    return {
                        ...product,
                        // Ensure price is a number
                        price: typeof product.price === 'number' ? product.price : 
                               typeof product.price === 'string' ? parseInt(product.price, 10) || 10000 : 10000
                    };
                });
                
                // Pass responses to parent component to control the 3D model and products
                if (onResponse) {
                    onResponse(formattedMessages, formattedProducts);
                }
            }
        } catch (error) {
            console.error('Error sending message:', error);
            toast.error('Failed to send message');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-black/30 backdrop-blur-lg p-4">
            <div className="flex items-center gap-2 max-w-3xl mx-auto">
                <button
                    onClick={toggleRecording}
                    className={`${
                        recording 
                            ? 'bg-red-500 hover:bg-red-600' 
                            : micPermission === false
                                ? 'bg-gray-400'
                                : 'bg-gray-700 hover:bg-gray-800'
                    } text-white p-3 rounded-full transition-all flex-shrink-0 shadow-md`}
                    disabled={micPermission === false}
                    title={micPermission === false ? "Microphone access required" : recording ? "Stop recording" : "Start recording"}
                    aria-label={recording ? "Stop recording" : "Start recording"}
                >
                    {recording ? <FaMicrophoneSlash className="w-6 h-6" /> : <FaMicrophone className="w-6 h-6" />}
                </button>

                <input
                    className="w-full py-3 px-4 rounded-full bg-white/90 backdrop-blur-md placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-md"
                    placeholder="Type a message..."
                    ref={inputRef}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            sendMessage();
                        }
                    }}
                />
                
                <button
                    disabled={loading}
                    onClick={sendMessage}
                    className={`${
                        loading 
                            ? 'bg-gray-400' 
                            : 'bg-blue-600 hover:bg-blue-700'
                    } text-white p-3 rounded-full transition-all flex-shrink-0 shadow-md`}
                    aria-label="Send message"
                >
                    <IoSend className="w-6 h-6" />
                </button>
            </div>
        </div>
    );
};

export default ChatInterface;