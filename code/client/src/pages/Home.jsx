import { useEffect, useState, useRef } from 'react';
import { Loader } from '@react-three/drei'
import { Canvas } from '@react-three/fiber';
import { Leva } from 'leva';
import { useNavigate } from 'react-router-dom';
import { TbLogout } from 'react-icons/tb';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

import { MdClosedCaption, MdClosedCaptionDisabled } from 'react-icons/md';
import { BgImage, ChatInterface, ProductCarousel, Scenario } from '../components';

import axiosInstance from '../utils/axiosInstance';
import { useLanguage } from '../utils/languageContext';
import { HOME_URI } from '../utils/constants';

const Home = () => {
    const nav = useNavigate();
    const [messageQueue, setMessageQueue] = useState([]);
    const [captionsEnabled, setCaptionsEnabled] = useState(true);
    const [currentCaption, setCurrentCaption] = useState('');
    const [showCaption, setShowCaption] = useState(false);
    const [products, setProducts] = useState([]);
    const [showProducts, setShowProducts] = useState(false);
    const captionTimerRef = useRef(null);
    const processingQueueRef = useRef(false);
    const captionQueueRef = useRef([]);

    const verifyHomePage = async () => {
        const token = localStorage.getItem('token');
        if (!token) return nav('/login');

        try {
            const { data } = await axiosInstance.get(HOME_URI, {
                headers: { Authorization: `Bearer ${token}` },
            });
            console.log(data);
        } catch (error) {
            if (error.response?.status === 401) {
                // Invalid token
                localStorage.removeItem('token');
                toast.error('Session expired. Please login again.');
                nav('/login');
            } else {
                // Server is down or no connection
                toast.error('Server unreachable. Please try again later.');
                console.error('Server error:', error.message);
                localStorage.removeItem('token');
                return nav('/login');
            }
        }
    };

    const logOut = () => {
        localStorage.removeItem('token');
        nav('/login');
        toast.success('Logout Successful');
    }

    useEffect(() => {
        verifyHomePage();
        // Cleanup function for timers
        return () => {
            if (captionTimerRef.current) {
                clearTimeout(captionTimerRef.current);
            }
        };
    }, []);

    const toggleCaptions = () => {
        setCaptionsEnabled(!captionsEnabled);
        toast.success(captionsEnabled ? 'Captions disabled' : 'Captions enabled');
    }

    // Process captions one at a time
    const processNextCaption = () => {
        if (captionQueueRef.current.length === 0) {
            processingQueueRef.current = false;
            setShowCaption(false);
            return;
        }

        processingQueueRef.current = true;
        const message = captionQueueRef.current.shift();

        // Display this caption
        setCurrentCaption(message.text);
        setShowCaption(true);

        // Clear any existing timer
        if (captionTimerRef.current) {
            clearTimeout(captionTimerRef.current);
        }

        // Auto-hide caption after message duration + buffer
        const duration = message.lipsync?.metadata?.duration || 5;
        captionTimerRef.current = setTimeout(() => {
            processNextCaption(); // Process next caption when this one is done
        }, duration * 1000 + 1000); // Add 1 second buffer after message ends
    };

    // Handle responses from the chat interface
    const handleChatResponse = (messages, productsData) => {
        // Add messages to the 3D model queue
        setMessageQueue(messages);

        // Add messages to caption queue if available
        if (messages && messages.length > 0) {
            // Filter messages that have text property
            const validMessages = messages.filter(msg => msg && msg.text);

            if (validMessages.length > 0) {
                // Add new messages to the caption queue
                captionQueueRef.current = [...captionQueueRef.current, ...validMessages];

                // Start processing if not already processing
                if (!processingQueueRef.current) {
                    processNextCaption();
                }
            }
        }

        // Set products if available
        if (productsData && productsData.length > 0) {
            setProducts(productsData);
            setShowProducts(true);
        }
    };

    const handleCloseProducts = () => {
        setShowProducts(false);
    };

    const { language, handleLanguageChange } = useLanguage();

    return (
        <BgImage>
            <div className='p-0 m-0 h-screen w-screen overflow-hidden relative'>
                <Loader />
                <Leva collapsed />

                {/* Header Controls */}
                <div className='absolute top-0 left-0 right-0 z-20 flex justify-between items-center p-4'>
                    <div className='bg-black/60 backdrop-blur-md rounded-md text-lg py-2 px-4 text-white cursor-pointer flex items-center gap-2'>
                        🤖 <span className='hidden sm:inline'>3D Shopping Intelligent</span>
                    </div>

                    <div className='flex gap-2'>
                        <button
                            onClick={toggleCaptions}
                            title={captionsEnabled ? 'Disable Captions' : 'Enable Captions'}
                            className={`rounded-md text-xl p-2 text-white cursor-pointer transition-all ${captionsEnabled ? 'bg-blue-600 shadow-lg' : 'bg-black/60 backdrop-blur-md'}`}
                        >
                            {captionsEnabled ? <MdClosedCaption /> : <MdClosedCaptionDisabled />}
                        </button>
                        <select
                            value={language}
                            onChange={(e) => handleLanguageChange(e.target.value)}
                            className='bg-black/60 backdrop-blur-md rounded-md text-md p-1 text-white cursor-pointer hover:bg-opacity-80 transition-all'
                        >
                            <option value="en">English</option>
                            <option value="ta">தமிழ்</option>
                        </select>
                        <button
                            onClick={logOut}
                            title='Logout'
                            className='bg-black/60 backdrop-blur-md rounded-md text-xl p-2 text-white cursor-pointer hover:bg-opacity-80 transition-all'
                        >
                            <TbLogout />
                        </button>
                    </div>
                </div>

                {/* 3D Canvas */}
                <Canvas shadows camera={{ position: [0, 0, 0], fov: 10 }}>
                    <Scenario messageQueue={messageQueue} />
                </Canvas>

                {/* Bottom Interface Container */}
                <div className="fixed bottom-0 left-0 right-0 z-40">
                    {/* Product Carousel */}
                    <AnimatePresence>
                        {showProducts && products.length > 0 && (
                            <ProductCarousel
                                products={products}
                                onClose={handleCloseProducts}
                            />
                        )}
                    </AnimatePresence>

                    {/* Caption Display */}
                    <AnimatePresence>
                        {captionsEnabled && showCaption && currentCaption && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 10 }}
                                transition={{ duration: 0.2 }}
                                className="mb-2 flex justify-center items-center px-4"
                            >
                                <div className="bg-black/70 backdrop-blur-sm text-white py-2 px-4 rounded-lg max-w-xl mx-auto text-center text-sm shadow-lg">
                                    {currentCaption}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Chat Interface */}
                    <ChatInterface onResponse={handleChatResponse} />
                </div>
            </div>
        </BgImage>
    );
};

export default Home;