import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Send, Loader2, MessageSquare, Bot, User } from 'lucide-react';

// Base URL for the backend API
const API_URL = 'http://localhost:5000/api/chat';

// Component to represent a single message in the chat
const Message = ({ message }) => {
    const isUser = message.sender === 'user';
    const bubbleClass = isUser
        ? 'bg-cimba-primary text-white rounded-br-none self-end'
        : 'bg-white text-gray-800 rounded-tl-none self-start border border-gray-200 shadow-sm';
    
    const icon = isUser 
        ? <User className="w-4 h-4 text-white" /> 
        : <Bot className="w-4 h-4 text-cimba-primary" />;

    return (
        <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4 animate-fadeIn`}>
            <div className={`max-w-xs md:max-w-md lg:max-w-xl p-3 rounded-xl shadow-md flex items-start space-x-3 ${bubbleClass}`}>
                {!isUser && (
                    <div className="flex-shrink-0 p-2 bg-indigo-100 rounded-full">
                        {icon}
                    </div>
                )}
                <p className={`whitespace-pre-wrap ${isUser ? '' : 'flex-grow'}`}>
                    {message.text}
                </p>
                {isUser && (
                    <div className="flex-shrink-0 p-2 bg-indigo-700 rounded-full">
                        {icon}
                    </div>
                )}
            </div>
        </div>
    );
};

// Main App Component (Step 9)
const App = () => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    // Auto-scrolls to the bottom of the chat history (Step 11 requirement)
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Initial message on load
    useEffect(() => {
        setMessages([{
            sender: 'bot',
            text: "Hello! I'm the CIMBA Support Chatbot. Ask me a question about our policies, hours, or the internship project requirements, and I'll check our internal FAQs."
        }]);
    }, []);

    // Handles sending the message to the backend (Step 10)
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage = input.trim();
        const newMessage = { sender: 'user', text: userMessage };

        // 1. Add user message and clear input
        setMessages(prev => [...prev, newMessage]);
        setInput('');
        setIsLoading(true);

        // 2. Call the backend API
        try {
            const response = await axios.post(API_URL, { userQuery: userMessage });
            const botResponse = { sender: 'bot', text: response.data.text };
            
            // 3. Add bot response (Step 11)
            setMessages(prev => [...prev, botResponse]);

        } catch (error) {
            console.error('API Error:', error);
            const errorMessage = `Sorry, I couldn't connect to the support server. Please ensure the backend (http://localhost:5000) is running and check your console for details.`;
            setMessages(prev => [...prev, { sender: 'bot', text: errorMessage }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-cimba-bg flex items-center justify-center p-4">
            <div className="w-full max-w-4xl h-[90vh] bg-gray-50 flex flex-col rounded-3xl shadow-2xl overflow-hidden">
                
                {/* Header */}
                <header className="p-5 bg-white border-b border-gray-200 flex items-center justify-between shadow-lg">
                    <div className="flex items-center space-x-3">
                        <MessageSquare className="w-6 h-6 text-cimba-primary" />
                        <h1 className="text-xl font-bold text-gray-900">
                            CIMBA RAG Support Bot
                        </h1>
                    </div>
                    <div className="text-sm text-gray-500 hidden sm:block">
                        Status: <span className="font-medium text-green-600">Online</span>
                    </div>
                </header>

                {/* Message Area */}
                <main className="flex-grow p-6 overflow-y-auto space-y-4 custom-scrollbar">
                    {messages.map((msg, index) => (
                        <Message key={index} message={msg} />
                    ))}

                    {/* Loading Indicator */}
                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="bg-white p-3 rounded-xl rounded-tl-none shadow-sm flex items-center space-x-2 border border-gray-200">
                                <Loader2 className="w-4 h-4 animate-spin text-cimba-primary" />
                                <span className="text-sm text-gray-500">Thinking...</span>
                            </div>
                        </div>
                    )}

                    {/* Scroll anchor */}
                    <div ref={messagesEndRef} />
                </main>

                {/* Input Form */}
                <footer className="p-4 bg-white border-t border-gray-200">
                    <form onSubmit={handleSubmit} className="flex space-x-3">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask a question..."
                            disabled={isLoading}
                            className="flex-grow p-3 border border-gray-300 rounded-xl focus:ring-cimba-primary focus:border-cimba-primary transition duration-150 disabled:bg-gray-100"
                        />
                        <button
                            type="submit"
                            disabled={isLoading || !input.trim()}
                            className="p-3 bg-cimba-primary text-white rounded-xl shadow-lg hover:bg-indigo-700 transition duration-150 disabled:bg-indigo-300 flex items-center justify-center"
                        >
                            {isLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <Send className="w-5 h-5" />
                            )}
                        </button>
                    </form>
                </footer>
            </div>
        </div>
    );
};

// Simple CSS for the custom scrollbar (for aesthetics)
const CustomScrollbarCSS = () => (
    <style jsx="true">{`
        .custom-scrollbar::-webkit-scrollbar {
            width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
            background-color: #d1d5db; /* gray-300 */
            border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
            background-color: #f3f4f6; /* gray-100 */
        }
        .animate-fadeIn {
            animation: fadeIn 0.3s ease-in-out;
        }
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(5px); }
            to { opacity: 1; transform: translateY(0); }
        }
    `}</style>
);


// Export App and include the style component
export default function FullApp() {
    return (
        <>
            <CustomScrollbarCSS />
            <App />
        </>
    );
}