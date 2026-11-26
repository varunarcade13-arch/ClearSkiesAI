"use client";

import React, { useState, useRef, useEffect } from "react";
import { useAQI } from "@/presentation/context/AQIContext";
import { useLocation } from "@/presentation/context/LocationContext";
import { useFamilyProfile } from "@/presentation/context/FamilyProfileContext";
import { ChatMessage, ChatResponse } from "@/infrastructure/ai/IGenAIProvider";
import {
  Sparkles,
  Send,
  User,
  Bot,
  Loader2,
  CheckCircle2,
  Lightbulb,
  ShieldAlert,
  ArrowRight,
  Scale,
} from "lucide-react";

interface StructuredChatTurn {
  role: "user" | "assistant";
  content: string;
  structuredData?: ChatResponse;
}

export function AIAssistantView() {
  const { location } = useLocation();
  const { data: aqiData, weather } = useAQI();
  const { profile } = useFamilyProfile();

  const [messages, setMessages] = useState<StructuredChatTurn[]>([
    {
      role: "assistant",
      content: `Hello! I am your ClearSkies AI Environmental Assistant. I am monitoring real-time air quality in ${location.name} (Current AQI: ${aqiData?.aqi || "Loading..."}). How can I help protect your household from smog and pollution today?`,
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestedQuestions = [
    "Is it safe to take my child to the park today?",
    "Should I cancel my early morning walk?",
    "What precautions should elderly family members take in this smog?",
    "When is the best time to ventilate my home today?",
    "How can I set up an effective DIY air filter?",
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
  }, [messages, isLoading]);

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query || isLoading) return;

    const userTurn: StructuredChatTurn = {
      role: "user",
      content: query,
    };

    setMessages((prev) => [...prev, userTurn]);
    setInputText("");
    setIsLoading(true);

    try {
      const historyPayload: ChatMessage[] = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));
      historyPayload.push({ role: "user", content: query });

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: historyPayload,
          context: {
            locationName: location.name,
            aqiData,
            weatherData: weather,
            familyProfile: profile,
          },
        }),
      });

      if (!res.ok) {
        throw new Error(`Chat request failed: ${res.statusText}`);
      }

      const data: ChatResponse = await res.json();

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.answer,
          structuredData: data,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "I encountered a network issue communicating with the AI service. Please make sure your server is online or check your connection.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* Context Badge */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-brand-50/70 dark:bg-brand-900/50 border border-brand-200 dark:border-brand-800 text-xs">
        <div className="flex items-center gap-2 text-brand-900 dark:text-brand-200">
          <Sparkles className="w-4 h-4 text-brand-600 dark:text-brand-400 shrink-0" />
          <span>
            <strong>GenAI Environmental Context Active:</strong> {location.name} (AQI:{" "}
            {aqiData?.aqi || "N/A"}) • Temp: {weather?.temperature ?? "N/A"}°C
          </span>
        </div>
        <span className="text-[11px] text-slate-600 dark:text-slate-300">
          Powered by Google Gemini
        </span>
      </div>

      {/* Chat Messages Container */}
      <div role="log" aria-label="Conversation with ClearSkies AI" aria-live="polite" aria-relevant="additions" aria-atomic="false" aria-busy={isLoading} className="min-h-[460px] max-h-[620px] overflow-y-auto p-4 sm:p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm space-y-6">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex items-start gap-3 ${
              m.role === "user" ? "flex-row-reverse" : "flex-row"
            }`}
          >
            {/* Avatar */}
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                m.role === "user"
                  ? "bg-brand-600 text-white"
                  : "bg-gradient-to-tr from-cyan-600 to-brand-600 text-white shadow-sm"
              }`}
              aria-hidden="true"
            >
              {m.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            {/* Bubble */}
            <div
              className={`max-w-[85%] sm:max-w-[78%] rounded-2xl p-4 sm:p-5 text-sm space-y-3 leading-relaxed ${
                m.role === "user"
                  ? "bg-brand-600 text-white"
                  : "bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 text-slate-900 dark:text-slate-100"
              }`}
            >
              <div className="whitespace-pre-line font-medium">{m.content}</div>

              {/* Render Structured Elements if Assistant */}
              {m.structuredData && (
                <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                  {/* Location Comparison Cards if present */}
                  {m.structuredData.locationsCompared && m.structuredData.locationsCompared.length > 1 && (
                    <div className="space-y-1.5">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <Scale className="w-3.5 h-3.5 text-brand-500" />
                        Location Air Quality Comparison
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {m.structuredData.locationsCompared.map((loc, lIdx) => (
                          <div
                            key={lIdx}
                            className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-700/80 text-xs space-y-1"
                          >
                            <div className="font-bold flex items-center justify-between">
                              <span className="truncate">{loc.name}</span>
                              <span className="text-[11px] font-extrabold px-1.5 py-0.5 rounded bg-brand-100 dark:bg-brand-900 text-brand-700 dark:text-brand-300">
                                AQI {loc.aqi ?? "N/A"}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-600 dark:text-slate-400">
                              Status: <span className="font-semibold">{loc.category ?? "Unknown"}</span>
                              {loc.pm25 !== undefined && ` • PM2.5: ${loc.pm25} µg/m³`}
                            </div>
                            {loc.source && (
                              <div className="text-[10px] text-slate-500 truncate">
                                Source: {loc.source}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actionable Tips */}
                  {m.structuredData.actionableTips?.length > 0 && (
                    <div className="space-y-1.5">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        Actionable Protective Steps
                      </h4>
                      <ul className="space-y-1 text-xs">
                        {m.structuredData.actionableTips.map((tip, tIdx) => (
                          <li key={tIdx} className="flex items-start gap-2">
                            <span className="text-emerald-500 font-bold">•</span>
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Scientific Rationale */}
                  {m.structuredData.scientificRationale && (
                    <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 text-xs space-y-1">
                      <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                        Scientific Rationale
                      </div>
                      <p className="text-slate-600 dark:text-slate-300">
                        {m.structuredData.scientificRationale}
                      </p>
                    </div>
                  )}

                  {/* Suggested Follow-Ups */}
                  {m.structuredData.suggestedFollowUps?.length > 0 && (
                    <div className="space-y-1 pt-1">
                      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-300">
                        Suggested Follow-Up Inquiries:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {m.structuredData.suggestedFollowUps.map((fu, fIdx) => (
                          <button
                            key={fIdx}
                            onClick={() => handleSend(fu)}
                            className="text-xs px-2.5 py-1 rounded-lg bg-brand-50 hover:bg-brand-100 dark:bg-brand-900/60 dark:hover:bg-brand-900/60 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800 transition-colors flex items-center gap-1 text-left"
                          >
                            <span>{fu}</span>
                            <ArrowRight className="w-3 h-3 shrink-0" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-600 to-brand-600 text-white flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs flex items-center gap-2 text-slate-600 dark:text-slate-300">
              <Loader2 className="w-4 h-4 animate-spin text-brand-500" />
              <span role="status">Analyzing live atmospheric metrics with Gemini...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompts */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-slate-500 dark:text-slate-300">
          Try asking:
        </span>
        {suggestedQuestions.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(q)}
            disabled={isLoading}
            className="text-xs px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors shadow-2xs focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input Box */}
      <form className="relative" onSubmit={(e) => { e.preventDefault(); void handleSend(); }}>
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a question about smog protection, walking timings, ventilation..."
          rows={2}
          className="w-full p-4 pr-14 text-sm rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none shadow-sm"
          aria-label="Message for ClearSkies AI Assistant"
          aria-describedby="chat-input-help"
          id="chat-message-input"
        />
        <span id="chat-input-help" className="sr-only">Press Enter to send. Press Shift and Enter for a new line.</span>
        <button
          type="submit"
          disabled={!inputText.trim() || isLoading}
          className="absolute right-3.5 bottom-4 p-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-40 text-white transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-md"
          aria-label="Send message"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

      {/* Medical Disclaimer */}
      <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-300">
        <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0" />
        <span>
          ClearSkies AI provides atmospheric and environmental guidance. It is not a substitute for clinical medical advice or diagnosis. Always consult a healthcare professional for respiratory emergencies.
        </span>
      </div>
    </div>
  );
}
