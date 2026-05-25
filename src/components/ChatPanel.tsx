import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Send, Mic, MicOff, Camera, Sparkles, Bot, User, Loader2, ImagePlus, ChevronDown } from 'lucide-react';
import { apiFetch } from '../api/client';
import { useFinance } from '../data/financeData';
import useSpeechRecognition from '../hooks/useSpeechRecognition';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  parsedTx?: any;
  receiptData?: any;
}

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const personas = [
  { id: 'default', label: '🤖 Professional', color: '#4edea3' },
  { id: 'ramsay',  label: '🔥 Gordon Ramsay', color: '#ff6b6b' },
  { id: 'coach',   label: '🧘 Gentle Coach', color: '#74b9ff' },
  { id: 'pirate',  label: '🏴‍☠️ Pirate', color: '#fdcb6e' },
];

const quickActions = [
  '📊 Analyze my spending',
  '💰 How much did I save?',
  '📈 Predict my cash flow',
  '🔥 Roast my spending!',
  '💡 Give me saving tips',
];

export default function ChatPanel({ isOpen, onClose }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [persona, setPersona] = useState('default');
  const [showPersonas, setShowPersonas] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isListening, transcript, isSupported, startListening, stopListening, resetTranscript } = useSpeechRecognition();
  const { addTransaction } = useFinance();

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  // Handle speech transcript
  useEffect(() => {
    if (transcript) {
      setInput(transcript);
    }
  }, [transcript]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text.trim(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    resetTranscript();
    setIsLoading(true);

    // Build history for context
    const history = messages.slice(-10).map(m => ({
      role: m.role,
      content: m.content,
    }));

    try {
      // Check if it looks like a transaction entry
      const txKeywords = /^(i |spent|bought|paid|received|earned|got|sold|income|expense)/i;
      
      if (txKeywords.test(text.trim())) {
        // Try to parse as transaction
        const parsed = await apiFetch('/ai/parse-transaction', {
          method: 'POST',
          body: JSON.stringify({ text: text.trim() }),
        });

        // Check if multiple transactions were parsed
        if (parsed.multiple && parsed.transactions) {
          const assistantMsg: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: `I found ${parsed.transactions.length} transactions in your message. Do these look right?`,
            parsedTx: parsed.transactions, // Array of transactions
          };
          setMessages(prev => [...prev, assistantMsg]);
        } else {
          const assistantMsg: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: `I parsed that as a transaction. Does this look right?`,
            parsedTx: parsed,
          };
          setMessages(prev => [...prev, assistantMsg]);
        }
      } else {
        // Regular chat
        const data = await apiFetch('/ai/chat', {
          method: 'POST',
          body: JSON.stringify({
            message: text.trim(),
            persona,
            history,
          }),
        });

        const assistantMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.reply,
        };
        setMessages(prev => [...prev, assistantMsg]);
      }
    } catch (err: any) {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `⚠️ ${err.message || 'Something went wrong. Please try again.'}`,
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, messages, persona, resetTranscript]);

  const handleAddTransaction = async (tx: any) => {
    try {
      await addTransaction(tx);
      const confirmMsg: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `✅ Transaction added! "${tx.title}" for $${Math.abs(tx.amount).toFixed(2)}`,
      };
      setMessages(prev => [...prev, confirmMsg]);
    } catch (err) {
      const errorMsg: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: '⚠️ Failed to add transaction. Please try again.',
      };
      setMessages(prev => [...prev, errorMsg]);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Convert to base64
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;

      const userMsg: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: '📷 [Uploaded receipt image]',
      };
      setMessages(prev => [...prev, userMsg]);
      setIsLoading(true);

      try {
        const parsed = await apiFetch('/ai/parse-receipt', {
          method: 'POST',
          body: JSON.stringify({
            image: base64,
            mimeType: file.type,
          }),
        });

        const assistantMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: parsed.items
            ? `📋 I found ${parsed.items.length} item(s) on this receipt from **${parsed.title}**. Total: **$${Math.abs(parsed.amount).toFixed(2)}**`
            : `📋 Receipt from **${parsed.title}** for **$${Math.abs(parsed.amount).toFixed(2)}**`,
          parsedTx: {
            title: parsed.title,
            amount: parsed.amount,
            category: parsed.category,
            date: parsed.date,
            type: parsed.type,
            icon: parsed.icon,
          },
          receiptData: parsed,
        };
        setMessages(prev => [...prev, assistantMsg]);
      } catch (err: any) {
        const errorMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `⚠️ ${err.message || 'Could not read this receipt. Try a clearer photo.'}`,
        };
        setMessages(prev => [...prev, errorMsg]);
      } finally {
        setIsLoading(false);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const currentPersona = personas.find(p => p.id === persona) || personas[0];

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] md:bg-transparent md:backdrop-blur-none" onClick={onClose} />
      )}

      {/* Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-full md:w-[440px] bg-[#1a1a1a]/95 backdrop-blur-2xl border-l border-white/10 z-[70] flex flex-col transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-[#1e1e1e]/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#4edea3] to-[#2ebd82] flex items-center justify-center shadow-lg shadow-[#4edea3]/20">
              <Sparkles className="w-5 h-5 text-[#003824]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">FinPrecision AI</h3>
              <p className="text-[10px] text-[#bbcabf] font-mono">Powered by Gemini</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Persona selector */}
            <div className="relative">
              <button
                onClick={() => setShowPersonas(!showPersonas)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-[#bbcabf] hover:border-[#4edea3]/50 transition-all cursor-pointer"
              >
                <span>{currentPersona.label}</span>
                <ChevronDown className="w-3 h-3" />
              </button>
              {showPersonas && (
                <div className="absolute right-0 top-full mt-1.5 bg-[#1e1e1e] border border-white/10 rounded-lg shadow-2xl py-1 z-50 w-48">
                  {personas.map(p => (
                    <button
                      key={p.id}
                      onClick={() => { setPersona(p.id); setShowPersonas(false); }}
                      className={`w-full text-left px-3 py-2 text-xs hover:bg-white/5 transition-all cursor-pointer ${
                        persona === p.id ? 'text-[#4edea3]' : 'text-[#e5e2e1]'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 transition-all cursor-pointer text-[#bbcabf] hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-thin">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center px-6 gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#4edea3]/20 to-[#4edea3]/5 flex items-center justify-center border border-[#4edea3]/20">
                <Bot className="w-8 h-8 text-[#4edea3]" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white mb-1">Hi! I'm your AI financial assistant</h4>
                <p className="text-xs text-[#bbcabf] leading-relaxed">
                  Ask me about your spending, add transactions by voice, or upload a receipt photo!
                </p>
              </div>
              <div className="w-full space-y-2 mt-2">
                {quickActions.map((action, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(action)}
                    className="w-full text-left px-3 py-2.5 rounded-lg bg-white/[0.03] border border-white/5 text-xs text-[#bbcabf] hover:text-[#4edea3] hover:border-[#4edea3]/30 hover:bg-[#4edea3]/5 transition-all cursor-pointer"
                  >
                    {action}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map(msg => (
            <div key={msg.id} className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#4edea3] to-[#2ebd82] flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-4 h-4 text-[#003824]" />
                </div>
              )}
              <div className={`max-w-[80%] space-y-2 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div
                  className={`px-3.5 py-2.5 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-[#4edea3] text-[#003824] rounded-br-md font-medium'
                      : 'bg-white/[0.06] text-[#e5e2e1] rounded-bl-md border border-white/5'
                  }`}
                >
                  {msg.content}
                </div>

                {/* Parsed Transaction Confirmation */}
                {msg.parsedTx && (
                  <div className="space-y-2">
                    {Array.isArray(msg.parsedTx) ? (
                      // Multiple transactions
                      <>
                        {msg.parsedTx.map((tx, idx) => (
                          <div key={idx} className="bg-[#1e1e1e] border border-[#4edea3]/20 rounded-xl p-3 space-y-2">
                            <div className="text-[10px] uppercase tracking-wider text-[#4edea3] font-mono font-semibold">
                              Transaction {idx + 1} of {msg.parsedTx.length}
                            </div>
                            <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                              <div className="text-[#bbcabf]">Title</div>
                              <div className="text-white font-medium">{tx.title}</div>
                              <div className="text-[#bbcabf]">Amount</div>
                              <div className={`font-bold ${tx.amount < 0 ? 'text-[#ffb4ab]' : 'text-[#4edea3]'}`}>
                                ${Math.abs(tx.amount).toFixed(2)}
                              </div>
                              <div className="text-[#bbcabf]">Category</div>
                              <div className="text-white">{tx.category}</div>
                              <div className="text-[#bbcabf]">Date</div>
                              <div className="text-white">{tx.date}</div>
                              <div className="text-[#bbcabf]">Type</div>
                              <div className="text-white capitalize">{tx.type}</div>
                            </div>
                          </div>
                        ))}
                        <div className="flex gap-2 pt-1">
                          <button
                            onClick={async () => {
                              for (const tx of msg.parsedTx) {
                                await handleAddTransaction(tx);
                              }
                            }}
                            className="flex-1 bg-[#4edea3] text-[#003824] text-[11px] font-bold py-2 rounded-lg hover:bg-[#6ffbbe] transition-colors cursor-pointer"
                          >
                            ✅ Add All {msg.parsedTx.length} Transactions
                          </button>
                          <button
                            onClick={() => {
                              const dismissMsg: Message = { id: Date.now().toString(), role: 'assistant', content: 'No problem! Transactions discarded.' };
                              setMessages(prev => [...prev, dismissMsg]);
                            }}
                            className="px-3 bg-white/5 text-[#bbcabf] text-[11px] py-2 rounded-lg hover:bg-white/10 transition-colors cursor-pointer border border-white/10"
                          >
                            ✕ Discard
                          </button>
                        </div>
                      </>
                    ) : (
                      // Single transaction
                      <>
                        <div className="bg-[#1e1e1e] border border-[#4edea3]/20 rounded-xl p-3 space-y-2">
                          <div className="text-[10px] uppercase tracking-wider text-[#4edea3] font-mono font-semibold">Parsed Transaction</div>
                          <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                            <div className="text-[#bbcabf]">Title</div>
                            <div className="text-white font-medium">{msg.parsedTx.title}</div>
                            <div className="text-[#bbcabf]">Amount</div>
                            <div className={`font-bold ${msg.parsedTx.amount < 0 ? 'text-[#ffb4ab]' : 'text-[#4edea3]'}`}>
                              ${Math.abs(msg.parsedTx.amount).toFixed(2)}
                            </div>
                            <div className="text-[#bbcabf]">Category</div>
                            <div className="text-white">{msg.parsedTx.category}</div>
                            <div className="text-[#bbcabf]">Date</div>
                            <div className="text-white">{msg.parsedTx.date}</div>
                            <div className="text-[#bbcabf]">Type</div>
                            <div className="text-white capitalize">{msg.parsedTx.type}</div>
                          </div>

                          {/* Receipt line items */}
                          {msg.receiptData?.items && msg.receiptData.items.length > 0 && (
                            <div className="border-t border-white/10 pt-2 mt-2">
                              <div className="text-[10px] uppercase tracking-wider text-[#bbcabf] font-mono mb-1">Line Items</div>
                              {msg.receiptData.items.map((item: any, i: number) => (
                                <div key={i} className="flex justify-between text-[11px]">
                                  <span className="text-[#e5e2e1]">{item.name}</span>
                                  <span className="text-[#bbcabf]">${(item.price || 0).toFixed(2)}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2 pt-1">
                          <button
                            onClick={() => handleAddTransaction(msg.parsedTx)}
                            className="flex-1 bg-[#4edea3] text-[#003824] text-[11px] font-bold py-2 rounded-lg hover:bg-[#6ffbbe] transition-colors cursor-pointer"
                          >
                            ✅ Add Transaction
                          </button>
                          <button
                            onClick={() => {
                              const dismissMsg: Message = { id: Date.now().toString(), role: 'assistant', content: 'No problem! Transaction discarded.' };
                              setMessages(prev => [...prev, dismissMsg]);
                            }}
                            className="px-3 bg-white/5 text-[#bbcabf] text-[11px] py-2 rounded-lg hover:bg-white/10 transition-colors cursor-pointer border border-white/10"
                          >
                            ✕ Discard
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
              {msg.role === 'user' && (
                <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-4 h-4 text-[#bbcabf]" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#4edea3] to-[#2ebd82] flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-[#003824]" />
              </div>
              <div className="bg-white/[0.06] border border-white/5 rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-2">
                <Loader2 className="w-4 h-4 text-[#4edea3] animate-spin" />
                <span className="text-xs text-[#bbcabf]">Thinking...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-white/10 px-4 py-3 bg-[#1e1e1e]/50 space-y-2">
          <div className="flex gap-2">
            <div className="flex-1 flex items-center bg-[#161616] border border-white/10 rounded-xl px-3 focus-within:border-[#4edea3] focus-within:ring-1 focus-within:ring-[#4edea3] transition-all">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isListening ? '🎤 Listening...' : 'Ask anything or describe a transaction...'}
                className="flex-1 bg-transparent text-xs text-white py-2.5 focus:outline-none placeholder:text-[#bbcabf]/40"
                disabled={isLoading}
              />
              
              {/* Voice button */}
              {isSupported && (
                <button
                  onClick={isListening ? stopListening : startListening}
                  className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                    isListening
                      ? 'text-red-400 bg-red-500/10 animate-pulse'
                      : 'text-[#bbcabf] hover:text-[#4edea3] hover:bg-[#4edea3]/10'
                  }`}
                  title={isListening ? 'Stop listening' : 'Voice input'}
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
              )}

              {/* Receipt upload button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-1.5 rounded-lg text-[#bbcabf] hover:text-[#4edea3] hover:bg-[#4edea3]/10 transition-all cursor-pointer"
                title="Upload receipt"
              >
                <ImagePlus className="w-4 h-4" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>

            {/* Send button */}
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isLoading}
              className="w-10 h-10 rounded-xl bg-[#4edea3] flex items-center justify-center text-[#003824] hover:bg-[#6ffbbe] transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[10px] text-[#bbcabf]/40 text-center font-mono">
            Try: "I spent $20 on lunch" • Upload a receipt • Ask about your spending
          </p>
        </div>
      </div>
    </>
  );
}
