"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Sparkles, Loader2, MessageSquarePlus, Copy, Check } from "lucide-react";
import dynamic from "next/dynamic";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import remarkGfm from "remark-gfm";
import rehypeKatex from "rehype-katex";

const AnoAI = dynamic(
  () => import("@/components/ui/animated-shader-background"),
  { ssr: false }
);

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

interface Chat {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

export default function Home() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const activeChat = chats.find((chat) => chat.id === activeChatId) || null;
  const messages = activeChat?.messages ?? [];

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem("nova_chats_v1");
      if (!raw) return;
      const parsed = JSON.parse(raw) as Chat[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        setChats(parsed);
        setActiveChatId(parsed[0].id);
      }
    } catch (err) {
      console.error("Failed to load chats from storage", err);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem("nova_chats_v1", JSON.stringify(chats));
    } catch (err) {
      console.error("Failed to save chats to storage", err);
    }
  }, [chats]);

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const createChatTitle = (firstMessage: string) => {
    const trimmed = firstMessage.trim();
    if (!trimmed) return "New chat";
    return trimmed.length > 60 ? `${trimmed.slice(0, 57)}...` : trimmed;
  };

  const handleNewChat = () => {
    setActiveChatId(null);
    setInput("");
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.focus();
    }
  };

  const copyToClipboard = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("Failed to copy text", err);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages.length]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: Date.now(),
    };

    let targetChatId = activeChatId;
    let baseMessages: Message[] = activeChat?.messages ?? [];

    if (!targetChatId) {
      const now = Date.now();
      const newChatId = now.toString();
      targetChatId = newChatId;
      const newChat: Chat = {
        id: newChatId,
        title: createChatTitle(userMessage.content),
        messages: [userMessage],
        createdAt: now,
        updatedAt: now,
      };
      setChats((prev) => [newChat, ...prev]);
      setActiveChatId(newChatId);
      baseMessages = [];
    } else {
      setChats((prev) =>
        prev.map((chat) =>
          chat.id === targetChatId
            ? {
                ...chat,
                messages: [...chat.messages, userMessage],
                updatedAt: Date.now(),
              }
            : chat,
        ),
      );
    }

    const apiMessages = [...baseMessages, userMessage];

    setInput("");
    setIsLoading(true);

    // Auto-resize textarea back
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
    }

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: apiMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      const data = await res.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.reply || "I couldn't generate a response.",
        timestamp: Date.now(),
      };

      if (targetChatId) {
        setChats((prev) =>
          prev.map((chat) =>
            chat.id === targetChatId
              ? {
                  ...chat,
                  messages: [...chat.messages, assistantMessage],
                  updatedAt: Date.now(),
                }
              : chat,
          ),
        );
      }
    } catch {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Something went wrong. Please try again.",
        timestamp: Date.now(),
      };
      if (targetChatId) {
        setChats((prev) =>
          prev.map((chat) =>
            chat.id === targetChatId
              ? {
                  ...chat,
                  messages: [...chat.messages, errorMessage],
                  updatedAt: Date.now(),
                }
              : chat,
          ),
        );
      }
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 10);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    // Auto-resize
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 150) + "px";
  };

  return (
    <main className="relative w-full h-screen overflow-hidden bg-black">
      {/* Animated Shader Background */}
      <AnoAI />

      {/* Dark overlay for readability */}
      <div className="fixed inset-0 z-[1] bg-black/40" />

      {/* Chat Container */}
      <div className="relative z-10 flex flex-col items-center justify-center w-full h-full px-4">
        <div className="flex flex-col w-full max-w-3xl h-[90vh] rounded-2xl overflow-hidden border border-white/[0.08] bg-black/30 backdrop-blur-2xl shadow-[0_0_80px_rgba(100,150,255,0.06)]">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] bg-white/[0.02]">
            <div className="flex items-center gap-3">
              <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 border border-white/[0.08]">
                <Sparkles className="w-5 h-5 text-cyan-400" />
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-black/60" />
              </div>
              <div>
                <h1 className="text-[15px] font-semibold text-white/90 tracking-tight">
                  Nova AI
                </h1>
                <p className="text-[11px] text-white/40 tracking-wide uppercase">
                  Powered by Mistral · Free & Open
                </p>
              </div>
            </div>
            {messages.length > 0 && (
              <button
                onClick={handleNewChat}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-white/60 hover:text-white/90 hover:bg-white/[0.08] hover:border-white/[0.12] transition-all text-xs font-medium"
              >
                <MessageSquarePlus className="w-3.5 h-3.5" />
                New Chat
              </button>
            )}
          </div>

          {/* Chat History */}
          {chats.length > 0 && (
            <div className="flex items-center gap-3 px-4 py-2 border-b border-white/[0.05] bg-black/20 overflow-x-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
              <span className="text-[10px] uppercase tracking-[0.16em] text-white/35 flex-shrink-0">
                Recent Chats
              </span>
              <div className="flex gap-2">
                {chats.map((chat) => (
                  <button
                    key={chat.id}
                    onClick={() => {
                      setActiveChatId(chat.id);
                      if (inputRef.current) {
                        inputRef.current.focus();
                      }
                    }}
                    className={`px-3 py-1.5 rounded-full text-[11px] border transition-all whitespace-nowrap ${
                      chat.id === activeChatId
                        ? "bg-white/[0.14] border-white/60 text-white shadow-[0_0_20px_rgba(255,255,255,0.12)]"
                        : "bg-white/[0.03] border-white/[0.08] text-white/60 hover:bg-white/[0.08] hover:text-white hover:border-white/[0.16]"
                    }`}
                  >
                    {chat.title}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-6 animate-fade-in">
                <div className="flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-purple-500/10 border border-white/[0.06] animate-float">
                  <Bot className="w-10 h-10 text-cyan-400/60" />
                </div>
                <div className="space-y-2 max-w-md">
                  <h2 className="text-xl font-semibold text-white/80 tracking-tight">
                    Welcome to Nova AI
                  </h2>
                  <p className="text-sm text-white/30 leading-relaxed">
                    Ask me anything — I&apos;m powered by an open-source AI
                    model. Start a conversation below.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {[
                    "Explain quantum computing",
                    "Write a haiku about space",
                    "Tips for productivity",
                    "How does AI work?",
                  ].map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => {
                        setInput(suggestion);
                        inputRef.current?.focus();
                      }}
                      className="px-3 py-2 text-xs text-white/40 rounded-lg border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.06] hover:text-white/60 hover:border-white/[0.12] transition-all duration-200 text-left"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex items-start gap-3 animate-slide-up ${message.role === "user" ? "flex-row-reverse" : ""
                  }`}
              >
                {/* Avatar */}
                <div
                  className={`flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-lg border ${message.role === "user"
                    ? "bg-indigo-500/15 border-indigo-400/20"
                    : "bg-cyan-500/10 border-cyan-400/15"
                    }`}
                >
                  {message.role === "user" ? (
                    <User className="w-4 h-4 text-indigo-300/80" />
                  ) : (
                    <Bot className="w-4 h-4 text-cyan-300/80" />
                  )}
                </div>

                {/* Bubble */}
                <div
                  className={`max-w-[75%] px-4 py-3 rounded-2xl text-[14px] leading-relaxed ${message.role === "user"
                    ? "bg-indigo-500/15 text-white/90 border border-indigo-400/10 rounded-tr-md"
                    : "bg-white/[0.04] text-white/80 border border-white/[0.06] rounded-tl-md"
                    }`}
                >
                  <div className="prose prose-invert prose-p:leading-relaxed prose-pre:bg-white/5 prose-pre:border prose-pre:border-white/10 max-w-none break-words">
                    <ReactMarkdown
                      remarkPlugins={[remarkMath, remarkGfm]}
                      rehypePlugins={[rehypeKatex]}
                    >
                      {message.content
                        .replace(/\\\(/g, "$")
                        .replace(/\\\)/g, "$")
                        .replace(/\\\[/g, "$$")
                        .replace(/\\\]/g, "$$")}
                    </ReactMarkdown>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[10px] text-white/20">
                      {formatTimestamp(message.timestamp)}
                    </span>
                    {message.role === "assistant" && (
                      <button
                        onClick={() => copyToClipboard(message.id, message.content)}
                        className="p-1 rounded text-white/30 hover:text-white/70 hover:bg-white/5 transition-all"
                        title="Copy message"
                      >
                        {copiedId === message.id ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex items-start gap-3 animate-slide-up">
                <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-400/15">
                  <Bot className="w-4 h-4 text-cyan-300/80" />
                </div>
                <div className="px-4 py-3 rounded-2xl rounded-tl-md bg-white/[0.04] border border-white/[0.06]">
                  <div className="flex items-center gap-2 text-white/40">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Thinking...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="px-4 pb-4 pt-2 border-t border-white/[0.06] bg-white/[0.01]">
            <form
              onSubmit={handleSubmit}
              className="flex items-end gap-2 p-2 rounded-xl border border-white/[0.08] bg-white/[0.03] focus-within:border-cyan-500/20 focus-within:bg-white/[0.05] transition-all duration-200"
            >
              <textarea
                ref={inputRef}
                value={input}
                onChange={handleTextareaInput}
                onKeyDown={handleKeyDown}
                placeholder="Type a message..."
                rows={1}
                autoFocus
                className="flex-1 bg-transparent text-white/90 placeholder-white/20 text-sm resize-none outline-none px-2 py-2 max-h-[150px]"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="flex items-center justify-center w-9 h-9 rounded-lg bg-cyan-500/15 text-cyan-400 border border-cyan-400/15 hover:bg-cyan-500/25 hover:border-cyan-400/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 flex-shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
            <p className="text-center text-[10px] text-white/15 mt-2">
              Nova AI uses open-source models · Responses may be inaccurate
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
