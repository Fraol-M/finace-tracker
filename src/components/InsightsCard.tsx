import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Sparkles, Loader2, RefreshCw, Lightbulb } from 'lucide-react';
import { apiFetch } from '../api/client';

interface PredictionData {
  safeToSpend: number;
  predictedEndBalance: number;
  monthlyIncome: number;
  monthlyExpense: number;
  insights: string[];
  projections: { date: string; balance: number }[];
}

export default function InsightsCard() {
  const [data, setData] = useState<PredictionData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchPredictions = async () => {
    setIsLoading(true);
    setError('');
    try {
      const result = await apiFetch('/ai/predict', { method: 'POST' });
      setData(result);
    } catch (err: any) {
      setError(err.message || 'Could not load predictions');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPredictions();
  }, []);

  return (
    <div className="bg-gradient-to-br from-[#201f1f] to-[#1a1a1a] rounded-xl border border-white/5 overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#4edea3]/20 to-[#4edea3]/5 flex items-center justify-center border border-[#4edea3]/20">
            <Sparkles className="w-4 h-4 text-[#4edea3]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">AI Insights</h3>
            <p className="text-[10px] text-[#bbcabf] font-mono">Powered by Gemini</p>
          </div>
        </div>
        <button
          onClick={fetchPredictions}
          disabled={isLoading}
          className="p-1.5 rounded-lg text-[#bbcabf] hover:text-[#4edea3] hover:bg-[#4edea3]/10 transition-all cursor-pointer disabled:opacity-30"
          title="Refresh predictions"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="p-5">
        {isLoading && !data && (
          <div className="flex items-center justify-center py-8 gap-2">
            <Loader2 className="w-5 h-5 text-[#4edea3] animate-spin" />
            <span className="text-xs text-[#bbcabf]">Analyzing your finances...</span>
          </div>
        )}

        {error && !data && (
          <div className="text-center py-6">
            <p className="text-xs text-[#ffb4ab]">{error}</p>
            <button onClick={fetchPredictions} className="text-xs text-[#4edea3] mt-2 hover:underline cursor-pointer">
              Try again
            </button>
          </div>
        )}

        {data && (
          <div className="space-y-4">
            {/* Safe to Spend — Hero Metric */}
            <div className="text-center py-3">
              <p className="text-[10px] uppercase tracking-widest font-mono text-[#bbcabf] mb-1">Safe to Spend Today</p>
              <p className="text-4xl font-extrabold text-[#4edea3] tracking-tight">
                ${data.safeToSpend.toFixed(2)}
              </p>
              <p className="text-[10px] text-[#bbcabf] mt-1">per day for the rest of the month</p>
            </div>

            {/* Key Metrics Row */}
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-white/[0.03] rounded-lg p-3 text-center border border-white/5">
                <TrendingUp className="w-4 h-4 text-[#4edea3] mx-auto mb-1" />
                <p className="text-xs font-bold text-white">${data.monthlyIncome.toFixed(0)}</p>
                <p className="text-[9px] text-[#bbcabf] font-mono">INCOME</p>
              </div>
              <div className="bg-white/[0.03] rounded-lg p-3 text-center border border-white/5">
                <TrendingDown className="w-4 h-4 text-[#ffb4ab] mx-auto mb-1" />
                <p className="text-xs font-bold text-white">${data.monthlyExpense.toFixed(0)}</p>
                <p className="text-[9px] text-[#bbcabf] font-mono">EXPENSES</p>
              </div>
              <div className="bg-white/[0.03] rounded-lg p-3 text-center border border-white/5">
                <DollarSign className="w-4 h-4 text-[#c487ff] mx-auto mb-1" />
                <p className="text-xs font-bold text-white">${data.predictedEndBalance.toFixed(0)}</p>
                <p className="text-[9px] text-[#bbcabf] font-mono">PREDICTED</p>
              </div>
            </div>

            {/* Mini Projection Chart */}
            {data.projections && data.projections.length > 0 && (
              <div className="bg-white/[0.02] rounded-lg p-3 border border-white/5">
                <p className="text-[10px] uppercase tracking-wider font-mono text-[#bbcabf] mb-2">7-Day Projection</p>
                <div className="flex items-end gap-1 h-12">
                  {data.projections.slice(0, 7).map((proj, i) => {
                    const max = Math.max(...data.projections.map(p => Math.abs(p.balance)));
                    const height = max > 0 ? (Math.abs(proj.balance) / max) * 100 : 50;
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                        <div
                          className={`w-full rounded-sm transition-all ${proj.balance >= 0 ? 'bg-[#4edea3]/60' : 'bg-[#ffb4ab]/60'}`}
                          style={{ height: `${Math.max(height, 8)}%` }}
                          title={`${proj.date}: $${proj.balance.toFixed(2)}`}
                        />
                        <span className="text-[8px] text-[#bbcabf]/50">{proj.date.slice(-2)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* AI Insights */}
            {data.insights && (Array.isArray(data.insights) ? data.insights : [data.insights]).length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5 text-[#fdcb6e]" />
                  <p className="text-[10px] uppercase tracking-wider font-mono text-[#bbcabf] font-semibold">AI Insights</p>
                </div>
                {(Array.isArray(data.insights) ? data.insights : [data.insights]).map((insight, i) => (
                  <div key={i} className="flex gap-2 items-start">
                    <span className="text-[#4edea3] text-xs mt-0.5">•</span>
                    <p className="text-[11px] text-[#e5e2e1] leading-relaxed">{insight}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
