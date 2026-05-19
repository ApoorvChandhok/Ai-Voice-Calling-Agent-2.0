"use client";

import { useState } from 'react';
import { Phone, MessageSquare, Loader2, Sparkles, Server } from 'lucide-react';

export default function CallDispatcher() {
    const [phoneNumber, setPhoneNumber] = useState('');
    const [prompt, setPrompt] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const handleDispatch = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('loading');
        setMessage('');

        const form = e.target as HTMLFormElement;
        const modelProvider = (form.elements.namedItem('modelProvider') as HTMLSelectElement).value;
        const voice = (form.elements.namedItem('voice') as HTMLSelectElement).value;

        try {
            const res = await fetch('/api/dispatch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phoneNumber, prompt, modelProvider, voice }),
            });

            const data = await res.json();

            if (res.ok) {
                setStatus('success');
                setMessage(`Call dispatched to ${phoneNumber}`);
            } else {
                setStatus('error');
                setMessage(data.error || 'Failed to dispatch call');
            }
        } catch (err: any) {
            setStatus('error');
            setMessage(err.message || 'Network error');
        }
    };

    return (
        <div className="w-full">
            <div className="p-8">
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-[#30363d]">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-[#2f81f7]/10 text-[#2f81f7] rounded-lg">
                            <Phone className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-[#e6edf3]">Manual Dial</h2>
                            <p className="text-sm text-[#8b949e]">Deploy an agent to a specific number</p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleDispatch} className="space-y-5">
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-[#e6edf3]">Phone Number</label>
                        <input
                            type="tel"
                            placeholder="+919876543210"
                            required
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            className="w-full px-3 py-2.5 bg-[#0d1117] border border-[#30363d] rounded-lg focus:ring-1 focus:ring-[#2f81f7] focus:border-[#2f81f7] text-[#e6edf3] placeholder-[#8b949e] outline-none transition-all text-sm"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-[#e6edf3]">Context / Prompt</label>
                        <textarea
                            placeholder="e.g. You are calling regarding a coffee order..."
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            className="w-full px-3 py-2.5 bg-[#0d1117] border border-[#30363d] rounded-lg focus:ring-1 focus:ring-[#2f81f7] focus:border-[#2f81f7] text-[#e6edf3] placeholder-[#8b949e] outline-none transition-all h-24 resize-none text-sm"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-[#e6edf3]">Model provider</label>
                            <select
                                className="w-full px-3 py-2.5 bg-[#0d1117] border border-[#30363d] rounded-lg text-[#e6edf3] outline-none focus:ring-1 focus:ring-[#2f81f7] focus:border-[#2f81f7] text-sm"
                                name="modelProvider"
                                defaultValue="groq"
                            >
                                <option value="openai">OpenAI (GPT-4o)</option>
                                <option value="groq">Groq (Llama 3)</option>
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-medium text-[#e6edf3]">Voice</label>
                            <select
                                className="w-full px-3 py-2.5 bg-[#0d1117] border border-[#30363d] rounded-lg text-[#e6edf3] outline-none focus:ring-1 focus:ring-[#2f81f7] focus:border-[#2f81f7] text-sm"
                                name="voice"
                                defaultValue="alloy"
                            >
                                <option value="alloy">Alloy (US)</option>
                                <option value="echo">Echo (US)</option>
                                <option value="shimmer">Shimmer (US)</option>
                                <option value="anushka">Anushka (IN)</option>
                                <option value="aravind">Aravind (IN)</option>
                            </select>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={status === 'loading'}
                        className="w-full py-2.5 px-4 bg-[#2f81f7] hover:bg-[#1a6de8] text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                        {status === 'loading' ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" /> Dispatching...
                            </>
                        ) : (
                            'Initiate Call'
                        )}
                    </button>

                    {message && (
                        <div className={`p-3 rounded-lg text-sm flex items-center gap-2 border ${status === 'success' ? 'bg-[#2ea043]/10 text-[#2ea043] border-[#2ea043]/20' : 'bg-[#da3633]/10 text-[#da3633] border-[#da3633]/20'}`}>
                            {message}
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
}
