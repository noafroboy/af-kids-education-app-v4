'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ParentLayout } from '@/components/layouts/ParentLayout';
import { ChangePinSection } from '@/components/parent/ChangePinSection';
import { useDB } from '@/hooks/useDB';
import { useParentAuth } from '@/hooks/useParentAuth';
import { getSetting, putSetting, clearProgress, clearSessions } from '@/lib/db';

const AGES = [2, 3, 4, 5];

export default function ParentSettings() {
  const { isAuthed } = useParentAuth();
  const db = useDB();
  const router = useRouter();
  const [childName, setChildName] = useState('');
  const [childAge, setChildAge] = useState<number | null>(null);
  const [saved, setSaved] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!db) return;
    (async () => {
      try {
        const [name, age] = await Promise.all([
          getSetting(db as never, 'childName'),
          getSetting(db as never, 'childAge'),
        ]);
        setChildName(String(name?.value ?? ''));
        if (age?.value) setChildAge(Number(age.value));
      } catch (err) {
        console.error('[ParentSettings] load error:', err);
      }
    })();
  }, [db]);

  async function handleSaveProfile() {
    if (!db) return;
    try {
      await putSetting(db as never, 'childName', childName);
      if (childAge !== null) await putSetting(db as never, 'childAge', childAge);
      setSaved(true);
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
      savedTimerRef.current = setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error('[ParentSettings] save error:', err);
    }
  }

  async function handleResetConfirm() {
    if (!db) return;
    setIsResetting(true);
    try {
      await clearProgress(db as never);
      await clearSessions(db as never);
      router.push('/');
    } catch (err) {
      console.error('[ParentSettings] reset error:', err);
      setIsResetting(false);
    }
  }

  if (!isAuthed) return null;

  return (
    <ParentLayout title="Settings / 设置">
      <div data-testid="parent-settings" className="p-4 space-y-6">
        <section className="bg-white rounded-xl p-4 space-y-4">
          <h2 className="font-bold text-slate-700 text-lg">Child Profile / 孩子信息</h2>
          <div>
            <label className="text-sm text-slate-500 block mb-1">Name / 姓名</label>
            <input
              type="text"
              value={childName}
              onChange={(e) => setChildName(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-700 focus:outline-none focus:border-[#4F46E5]"
              placeholder="Child's name / 孩子的名字"
            />
          </div>
          <div>
            <label className="text-sm text-slate-500 block mb-2">Age / 年龄</label>
            <div className="grid grid-cols-4 gap-2">
              {AGES.map((age) => (
                <button
                  key={age}
                  data-testid={`age-option-${age}`}
                  onClick={() => setChildAge(age)}
                  className={`py-3 rounded-xl text-xl font-bold transition-all ${
                    childAge === age ? 'bg-[#FF6B35] text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                  style={{ fontFamily: 'var(--font-fredoka)' }}
                >
                  {age}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={handleSaveProfile}
            className="w-full py-3 bg-[#4F46E5] text-white rounded-xl font-semibold"
          >
            {saved ? '✅ Saved / 已保存' : 'Save / 保存'}
          </button>
        </section>

        <section className="bg-white rounded-xl p-4 space-y-2">
          <h2 className="font-bold text-slate-700 text-lg">Change PIN / 更改密码</h2>
          <ChangePinSection />
        </section>

        <section className="bg-white rounded-xl p-4 space-y-4">
          <h2 className="font-bold text-slate-700 text-lg">Reset Progress / 重置进度</h2>
          <button
            onClick={() => setShowResetConfirm(true)}
            className="w-full py-3 bg-red-500 text-white rounded-xl font-semibold"
          >
            🗑️ Reset All Progress / 重置所有进度
          </button>
        </section>
      </div>

      <AnimatePresence>
        {showResetConfirm && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
            >
              <h3 className="text-red-600 font-bold text-lg text-center">⚠️ Reset Progress?</h3>
              <p className="text-slate-600 text-sm text-center">
                This will clear all learning records. / 这将清除所有学习记录。
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="flex-1 min-h-[88px] rounded-xl bg-slate-100 text-slate-600 font-semibold"
                >
                  取消 / Cancel
                </button>
                <button
                  onClick={handleResetConfirm}
                  disabled={isResetting}
                  className="flex-1 min-h-[88px] rounded-xl bg-red-500 text-white font-semibold disabled:opacity-50"
                >
                  确认 / Confirm
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </ParentLayout>
  );
}
