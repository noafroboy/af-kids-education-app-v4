'use client';

import { motion } from 'framer-motion';
import type { Category } from '@/types';

export interface CategoryItem {
  category: Category;
  label: string;
  labelZh: string;
  emoji: string;
  wordCount: number;
}

interface CategorySelectorProps {
  categories: CategoryItem[];
  onSelect: (cat: Category | 'all') => void;
}

export function CategorySelector({ categories, onSelect }: CategorySelectorProps) {
  return (
    <div
      data-testid="category-selector"
      className="grid grid-cols-2 gap-3 p-4"
    >
      {/* All Categories tile */}
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => onSelect('all')}
        className="flex flex-col items-center justify-center gap-1 bg-[#FF6B35] rounded-2xl shadow-sm p-3"
        style={{ minHeight: 88 }}
        data-testid="category-all"
      >
        <span style={{ fontSize: '2rem' }}>🌟</span>
        <span
          className="text-white font-bold"
          style={{ fontFamily: 'var(--font-fredoka)', fontSize: '16px' }}
        >
          All Categories
        </span>
        <span
          className="text-white/80"
          style={{ fontFamily: 'var(--font-nunito)', fontSize: '13px' }}
        >
          全部
        </span>
      </motion.button>

      {categories.map((item) => (
        <motion.button
          key={item.category}
          whileTap={{ scale: 0.95 }}
          onClick={() => onSelect(item.category)}
          className="flex flex-col items-center justify-center gap-1 bg-white rounded-2xl shadow-sm p-3 border-2 border-transparent active:border-[#FF6B35]"
          style={{ minHeight: 88 }}
          data-testid={`category-${item.category}`}
        >
          <span style={{ fontSize: '2rem' }}>{item.emoji}</span>
          <span
            className="text-[#1a1a1a] font-bold"
            style={{ fontFamily: 'var(--font-fredoka)', fontSize: '15px' }}
          >
            {item.label}
          </span>
          <span
            className="text-slate-500"
            style={{ fontFamily: 'var(--font-nunito)', fontSize: '13px' }}
          >
            {item.labelZh}
          </span>
          <span
            className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full mt-1"
            style={{ fontFamily: 'var(--font-nunito)' }}
          >
            {item.wordCount} words
          </span>
        </motion.button>
      ))}
    </div>
  );
}
