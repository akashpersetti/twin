'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User } from 'lucide-react';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

export default function Twin() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [sessionId, setSessionId] = useState<string>('');
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const sendMessage = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input,
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: userMessage.content,
                    session_id: sessionId || undefined,
                }),
            });

            if (!response.ok) throw new Error('Failed to send message');

            const data = await response.json();

            if (!sessionId) {
                setSessionId(data.session_id);
            }

            const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: data.response,
                timestamp: new Date(),
            };

            setMessages(prev => [...prev, assistantMessage]);
        } catch (error) {
            console.error('Error:', error);
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: 'Sorry, I encountered an error. Please try again.',
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
            // Refocus the input after message is sent
            setTimeout(() => {
                inputRef.current?.focus();
            }, 100);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    // Avatar: show image; fall back to Bot icon if it fails to load. Cache-bust so CloudFront doesn't serve old 404.
    const [avatarError, setAvatarError] = useState(false);
    const avatarSrc = `/avatar.png${typeof process.env.NEXT_PUBLIC_AVATAR_VERSION === 'string' ? `?v=${process.env.NEXT_PUBLIC_AVATAR_VERSION}` : ''}`;

    return (
        <div className="flex flex-col h-full bg-rose-50 rounded-lg shadow-lg">
            {/* Header */}
            <div className="bg-gradient-to-r from-rose-600 to-rose-800 text-white p-4 rounded-t-lg">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                    <Bot className="w-6 h-6" />
                    Akash
                </h2>
                <p className="text-sm text-white mt-1">A virtual version of me - shaped by my resume, LinkedIn, projects, and real-world experience.</p>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 && (
                    <div className="text-center text-rose-700 mt-8">
                        {!avatarError ? (
                            <img 
                                src={avatarSrc} 
                                alt="Digital Twin Avatar" 
                                className="w-20 h-20 rounded-full mx-auto mb-3 border-2 border-rose-200"
                                onError={() => setAvatarError(true)}
                            />
                        ) : (
                            <Bot className="w-12 h-12 mx-auto mb-3 text-rose-400" />
                        )}
                        <p>Hello!</p>
                        <p className="text-sm mt-2">Ask me anything</p>
                    </div>
                )}

                {messages.map((message) => (
                    <div
                        key={message.id}
                        className={`flex gap-3 ${
                            message.role === 'user' ? 'justify-end' : 'justify-start'
                        }`}
                    >
                        {message.role === 'assistant' && (
                            <div className="flex-shrink-0">
                                {!avatarError ? (
                                    <img 
                                        src={avatarSrc} 
                                        alt="Digital Twin Avatar" 
                                        className="w-8 h-8 rounded-full border border-rose-200"
                                        onError={() => setAvatarError(true)}
                                    />
                                ) : (
                                    <div className="w-8 h-8 bg-rose-600 rounded-full flex items-center justify-center">
                                        <Bot className="w-5 h-5 text-white" />
                                    </div>
                                )}
                            </div>
                        )}

                        <div
                            className={`max-w-[70%] rounded-lg p-3 ${
                                message.role === 'user'
                                    ? 'bg-rose-600 text-white'
                                    : 'bg-white border border-rose-200 text-gray-800'
                            }`}
                        >
                            <p className="whitespace-pre-wrap">{message.content}</p>
                            <p
                                className={`text-xs mt-1 ${
                                    message.role === 'user' ? 'text-rose-200' : 'text-gray-500'
                                }`}
                            >
                                {message.timestamp.toLocaleTimeString()}
                            </p>
                        </div>

                        {message.role === 'user' && (
                            <div className="flex-shrink-0">
                                <div className="w-8 h-8 bg-rose-600 rounded-full flex items-center justify-center">
                                    <User className="w-5 h-5 text-white" />
                                </div>
                            </div>
                        )}
                    </div>
                ))}

                {isLoading && (
                    <div className="flex gap-3 justify-start">
                        <div className="flex-shrink-0">
                            {!avatarError ? (
                                <img 
                                    src={avatarSrc} 
                                    alt="Digital Twin Avatar" 
                                    className="w-8 h-8 rounded-full border border-rose-200"
                                    onError={() => setAvatarError(true)}
                                />
                            ) : (
                                <div className="w-8 h-8 bg-rose-600 rounded-full flex items-center justify-center">
                                    <Bot className="w-5 h-5 text-white" />
                                </div>
                            )}
                        </div>
                        <div className="bg-white border border-rose-200 rounded-lg p-3">
                            <div className="flex space-x-2">
                                <div className="w-2 h-2 bg-rose-400 rounded-full animate-bounce" />
                                <div className="w-2 h-2 bg-rose-400 rounded-full animate-bounce delay-100" />
                                <div className="w-2 h-2 bg-rose-400 rounded-full animate-bounce delay-200" />
                            </div>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-rose-200 p-4 bg-white rounded-b-lg">
                <div className="flex gap-2">
                    <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyPress}
                        placeholder="What would you like to know about me?"
                        className="flex-1 px-4 py-2 border border-rose-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-600 focus:border-transparent text-gray-800"
                        disabled={isLoading}
                        autoFocus
                    />
                    <button
                        onClick={sendMessage}
                        disabled={!input.trim() || isLoading}
                        className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-rose-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
}