import React from 'react';
import { 
  Monitor, 
  Utensils, 
  Plane, 
  Tv, 
  DollarSign, 
  Landmark, 
  Briefcase 
} from 'lucide-react';

/**
 * Returns the proper SVG icon string representing a transaction's category.
 */
export const getCategoryIconName = (category: string): string => {
  switch (category.toLowerCase()) {
    case 'infrastructure': return 'computer';
    case 'meals': return 'restaurant';
    case 'travel': return 'flight';
    case 'software': return 'subscriptions';
    case 'revenue':
    case 'consulting':
    case 'investments': return 'payments';
    case 'salary': return 'account_balance';
    default: return 'credit_card';
  }
};

/**
 * Generates the Lucide React icon element representing a category icon.
 */
export const renderCategoryIcon = (iconName: string) => {
  const cls = "w-4 h-4";
  switch (iconName) {
    case 'computer': return <Monitor className={cls} />;
    case 'restaurant': return <Utensils className={cls} />;
    case 'flight': return <Plane className={cls} />;
    case 'subscriptions': return <Tv className={cls} />;
    case 'payments': return <DollarSign className={cls} />;
    case 'account_balance': return <Landmark className={cls} />;
    default: return <Briefcase className={cls} />;
  }
};

/**
 * Provides matching CSS styles for transaction category pills.
 */
export const getCategoryStyle = (cat: string): string => {
  switch (cat.toLowerCase()) {
    case 'infrastructure': 
      return 'bg-rose-950/20 text-rose-300 border border-rose-900/30';
    case 'travel': 
      return 'bg-[#ddb7ff]/10 text-[#ddb7ff] border border-[#ddb7ff]/20';
    case 'consulting': 
      return 'bg-emerald-950/20 text-emerald-300 border border-emerald-900/30';
    case 'salary': 
      return 'bg-[#4edea3]/20 text-[#4edea3] border border-[#4edea3]/30';
    case 'investments': 
      return 'bg-purple-950/20 text-purple-300 border border-purple-900/30';
    case 'marketing': 
      return 'bg-rose-950/20 text-rose-300 border border-rose-900/30';
    case 'revenue': 
      return 'bg-emerald-950/20 text-emerald-300 border border-emerald-900/30';
    default: 
      return 'bg-zinc-800 text-zinc-300 border border-zinc-700/50';
  }
};
