import React, { useState, useRef } from 'react';
import axiosInstance from '../../utils/axiosInstance';
import toast from 'react-hot-toast';

const ChatInterface = ({ onResponse }) => {
    const [loading, setLoading] = useState(false);
    const [messages, setMessages] = useState([]);
    const inputRef = useRef(null);
    const [recording, setRecording] = useState(false);

    const sendMessage = async () => {
        const message = inputRef.current.value.trim();
        if (!message || loading) return;

        try {
            setLoading(true);
            // Add user message to chat
            setMessages(prev => [...prev, { sender: 'user', text: message }]);
            
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
            if (data.statusCode === 200 && data.data.messages) {
                // Add response messages to chat
                const responseMessages = data.data.messages.map(msg => ({
                    sender: 'bot',
                    ...msg
                }));
                
                setMessages(prev => [...prev, ...responseMessages]);
                
                // Pass responses to parent component to control the 3D model
                if (onResponse) {
                    onResponse(data.data.messages);
                }
            }
        } catch (error) {
            console.error('Error sending message:', error);
            toast.error('Failed to send message');
        } finally {
            setLoading(false);
        }
    };

    const toggleRecording = () => {
        // Voice recording functionality would go here
        setRecording(!recording);
        toast.info(recording ? 'Recording stopped' : 'Recording started');
    };

    return (
        <div className="fixed top-0 left-0 right-0 bottom-0 z-10 flex justify-between p-4 flex-col pointer-events-none">
            {/* Chat messages display */}
            <div className="w-full flex flex-col items-end justify-center gap-4 overflow-auto max-h-[calc(100vh-100px)] pb-4">
                {/* {messages.map((msg, index) => (
                    <div 
                        key={index} 
                        className={`pointer-events-auto p-3 rounded-lg backdrop-blur-md max-w-[80%] ${
                            msg.sender === 'user' 
                                ? 'bg-blue-500 bg-opacity-70 text-white self-end' 
                                : 'bg-white bg-opacity-70 text-gray-800 self-start'
                        }`}
                    >
                        {msg.text}
                    </div>
                ))} */}
            </div>
            
            {/* Input area */}
            <div className="flex items-center gap-2 pointer-events-auto max-w-screen-sm w-full mx-auto">
                <button
                    onClick={toggleRecording}
                    className={`${recording ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-500 hover:bg-gray-600'} text-white p-4 px-4 font-semibold uppercase rounded-md`}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                        className="w-6 h-6"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z"
                        />
                    </svg>
                </button>

                <input
                    className="w-full placeholder:text-gray-800 placeholder:italic p-4 rounded-md bg-opacity-50 bg-white backdrop-blur-md"
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
                    className={`${loading ? 'bg-gray-400' : 'bg-gray-500 hover:bg-gray-600'} text-white p-4 px-10 font-semibold uppercase rounded-md`}
                >
                    {loading ? 'Sending...' : 'Send'}
                </button>
            </div>
        </div>
    );
};

export default ChatInterface;