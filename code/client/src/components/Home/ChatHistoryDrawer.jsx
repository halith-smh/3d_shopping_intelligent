import { IoClose, IoChatboxEllipsesOutline } from 'react-icons/io5';
import { motion } from 'framer-motion';
import { useEffect, useRef } from 'react';

const ChatHistoryDrawer = ({ showHistory, setShowHistory, chatHistory, clearChatHistory }) => {
    const drawerRef = useRef();

    // Auto-close drawer when clicked outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (drawerRef.current && !drawerRef.current.contains(event.target)) {
                setShowHistory(false);
            }
        };

        if (showHistory) {
            document.addEventListener('mousedown', handleClickOutside);
        } else {
            document.removeEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showHistory, setShowHistory]);

    return (
        <motion.div
            ref={drawerRef}
            className={`fixed top-0 left-0 h-full w-80 bg-gradient-to-b from-black/80 to-black/60 p-4 z-50 shadow-2xl border-r border-gray-700`}
            initial={{ x: '-100%' }}
            animate={{ x: showHistory ? 0 : '-100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                    <IoChatboxEllipsesOutline size={22} className="text-white" />
                    <h3 className="text-white text-xl font-semibold">Chat History</h3>
                </div>
                <button
                    onClick={() => setShowHistory(false)}
                    className="text-white hover:text-gray-300 transition"
                >
                    <IoClose size={26} />
                </button>
            </div>

            {/* History Items */}
            <div className="h-[calc(100vh-160px)] overflow-y-auto pr-2 custom-scrollbar">
                {chatHistory.length === 0 ? (
                    <p className="text-gray-400 text-center">No conversations yet.</p>
                ) : (
                    chatHistory.map((msg, idx) => (
                        <div
                            key={idx}
                            className={`p-3 mb-3 rounded-lg text-sm break-words
                                ${msg.role === 'user' ? 'bg-blue-600/20' : 'bg-green-600/20'}
                                text-white hover:bg-white/10 transition`}
                        >
                            <p>{msg.content}</p>
                            <span className="block text-xs mt-1 text-gray-400">
                                {msg.role === 'user' ? 'You' : 'Emily'}
                            </span>
                        </div>
                    ))
                )}
            </div>

            {/* Clear Button */}
            <button
                onClick={clearChatHistory}
                className="w-full py-2 mt-6 bg-red-600/40 hover:bg-red-600/60 text-white rounded-lg transition-all"
            >
                Clear All
            </button>
        </motion.div>
    );
};

export default ChatHistoryDrawer;
