import React, { useState, useRef, useEffect } from 'react';
import axiosInstance from '../../utils/axiosInstance';
import toast from 'react-hot-toast';
import { FaMicrophone, FaMicrophoneSlash } from 'react-icons/fa';
import { IoClose, IoSend } from 'react-icons/io5';
import { motion } from 'framer-motion';
import { useLanguage } from '../../utils/languageContext';


const ChatInterface = ({ onResponse }) => {
    const [loading, setLoading] = useState(false);
    const inputRef = useRef(null);
    const [recording, setRecording] = useState(false);
    const recognitionRef = useRef(null);
    const [micPermission, setMicPermission] = useState(null);
    const [chatHistory, setChatHistory] = useState([]);
    const [showHistory, setShowHistory] = useState(false);

    const { language } = useLanguage();

    // Fetch chat history on mount
    useEffect(() => {
        fetchChatHistory();
    }, []);

    // Check for microphone permission on component mount
    useEffect(() => {
        checkMicrophonePermission();
    }, []);

    useEffect(() => {
        // Reinitialize speech recognition when language changes
        if (recognitionRef.current) {
            recognitionRef.current = null;
        }
        if (recording) {
            // Stop any ongoing recording
            setRecording(false);
        }
    }, [language]);

    const fetchChatHistory = async () => {
        try {
            const token = localStorage.getItem('token');
            const { data } = await axiosInstance.get('/api/v1/llm/chat-history', {
                headers: {
                    Authorization: `Bearer ${token}`,
                }
            });

            if (data.statusCode === 200) {
                setChatHistory(data.data.messages || []);
            }
        } catch (error) {
            console.error('Error fetching chat history:', error);
        }
    };

    const clearChatHistory = async () => {
        try {
            const token = localStorage.getItem('token');
            const { data } = await axiosInstance.post('/api/v1/llm/clear-history', {}, {
                headers: {
                    Authorization: `Bearer ${token}`,
                }
            });

            if (data.statusCode === 200) {
                setChatHistory([]);
                toast.success('Chat history cleared');
            }
        } catch (error) {
            console.error('Error clearing chat history:', error);
            toast.error('Failed to clear chat history');
        }
    };

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

    // Initialize speech recognition (keeping your existing code)
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
        recognition.lang = language === 'en' ? 'en-US' : 'ta-IN';
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
            switch (event.error) {
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

            // Update chat history UI immediately for better UX
            const updatedHistory = [...chatHistory, { role: 'user', content: message }];
            setChatHistory(updatedHistory);

            // Send to backend
            const token = localStorage.getItem('token');
            const { data } = await axiosInstance.post('/api/v1/llm/get-response/',
                {
                    query: message,
                    language: language === 'en' ? 'English' : language === 'ta' ? 'Tamil' : ''
                },
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

                // Update chat history with assistant's response
                if (formattedMessages.length > 0) {
                    const assistantMessage = formattedMessages.map(msg => msg.text).join(' ');
                    const newHistory = [...updatedHistory, { role: 'assistant', content: assistantMessage }];
                    setChatHistory(newHistory);
                }

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
        <div>
            {/* History Drawer */}
            <motion.div
                className={`fixed left-0 top-0 h-full bg-black/30 backdrop-blur-lg w-80 p-4 z-50 shadow-xl`}
                initial={{ x: '-100%' }}
                style={{ zIndex: 999 }}
                animate={{ x: showHistory ? 0 : '-100%' }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-white text-lg font-semibold">Chat History</h3>
                    <button
                        onClick={() => setShowHistory(false)}
                        className="text-white hover:text-gray-300"
                    >
                        <IoClose size={24} />
                    </button>
                </div>

                <div className="h-[calc(100vh-120px)] overflow-y-auto pr-2">
                    {chatHistory.map((msg, idx) => (
                        <div
                            key={idx}
                            className={`p-3 mb-2 rounded-lg ${msg.role === 'user'
                                ? 'bg-blue-500/20'
                                : 'bg-green-500/20'
                                }`}
                        >
                            <p className="text-white text-sm">{msg.content}</p>
                            <span className="text-xs text-gray-400 mt-1 block">
                                {msg.role === 'user' ? 'You' : 'Emily'}
                            </span>
                        </div>
                    ))}
                </div>

                <button
                    onClick={clearChatHistory}
                    className="w-full py-2 mt-4 bg-red-500/30 hover:bg-red-500/40 text-white rounded-lg transition-all"
                >
                    Clear History
                </button>
            </motion.div>

            {/* Chat History Display */}
            {/* {showHistory && chatHistory.length > 0 && (
                <div className="mb-4 max-h-60 overflow-y-auto bg-black/40 rounded-lg p-3">
                    {chatHistory.map((msg, idx) => (
                        <div key={idx} className={`mb-2 ${msg.role === 'user' ? 'text-blue-300' : 'text-green-300'}`}>
                            <span className="font-bold">{msg.role === 'user' ? 'You: ' : 'Assistant: '}</span>
                            <span>{msg.content}</span>
                        </div>
                    ))}
                </div>
            )} */}

            {/* Input Area */}
            <div className="bg-black/30 backdrop-blur-lg p-4">
                <div className="flex items-center gap-2 max-w-3xl mx-auto">
                    <button
                        onClick={() => setShowHistory(!showHistory)}
                        className="p-2 text-white hover:bg-white/10 rounded-full"
                        title="Chat History"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-5 10h5m-5 4h5M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>

                    </button>
                    <button
                        onClick={toggleRecording}
                        className={`${recording
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
                        className={`${loading
                            ? 'bg-gray-400'
                            : 'bg-blue-600 hover:bg-blue-700'
                            } text-white p-3 rounded-full transition-all flex-shrink-0 shadow-md`}
                        aria-label="Send message"
                    >
                        <IoSend className="w-6 h-6" />
                    </button>
                </div>
            </div>
        </div>

    );
};

export default ChatInterface;