'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ParentLayout } from '@/components/layouts/ParentLayout';
import { PinPad } from '@/components/ui/PinPad';
import { useDB } from '@/hooks/useDB';
import { getSetting, putSetting, clearProgress, clearSessions } from '@/lib/db';
import { verifyPIN } from '@/lib/crypto';

export default function ParentPage() {
  const db = useDB();
  const router = useRouter();
  const [pinHash, setPinHash] = useState('');
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [pinError, setPinError] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    if (!db) return;
    (async () => {
      try {
        const stored = await getSetting(db as never, 'pinHash');
        setPinHash(String(stored?.value ?? ''));
      } catch (err) {
        console.error('[ParentPage] Failed to load pinHash:', err);
      }
    })();
  }, [db]);

  async function handlePinSubmit(pin: string) {
    if (!pinHash) {
      // Check if onboarding was completed
      if (db) {
        try {
          const oc = await getSetting(db as never, 'onboardingComplete');
          if (String(oc?.value) !== 'true') {
            router.replace('/onboarding');
            return;
          }
        } catch {}
      }
      setErrorMsg('No PIN set. Please complete onboarding. / 请先完成引导设置。');
      return;
    }
    try {
      const ok = await verifyPIN(pin, pinHash);
      if (ok) {
        sessionStorage.setItem('parentAuthed', '1');
        router.replace('/parent/dashboard');
      } else {
        const attempts = wrongAttempts + 1;
        setWrongAttempts(attempts);
        setPinError(true);
        setErrorMsg(`密码错误 / Wrong PIN (${attempts}/3)`);
        setTimeout(() => setPinError(false), 500);
      }
    } catch (err) {
      console.error('[ParentPage] PIN verify error:', err);
    }
  }

  async function handleResetConfirm() {
    if (!db) return;
    setIsResetting(true);
    try {
      await clearProgress(db as never);
      await clearSessions(db as never);
      await putSetting(db as never, 'onboardingComplete', 'false');
      router.replace('/onboarding');
    } catch (err) {
      console.error('[ParentPage] Reset error:', err);
      setIsResetting(false);
    }
  }

  const locked = wrongAttempts >= 3;

  return (
    <ParentLayout>
      <div data-testid="parent-pin-page" className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] gap-6 p-6">
        <h2 className="text-slate-700 text-center" style={{ fontFamily: 'var(--font-fredoka)', fontSize: 28 }}>
          家长密码 / Parent PIN
        </h2>

        <div className={locked ? 'pointer-events-none opacity-50' : ''}>
          <PinPad onSubmit={handlePinSubmit} error={pinError} />
        </div>

        {errorMsg && (
          <p className="text-red-500 text-sm font-medium">{errorMsg}</p>
        )}

        {locked && (
          <button onClick={() => setShowForgotModal(true)} className="text-[#4F46E5] underline text-base">
            忘记密码? / Forgot PIN?
          </button>
        )}

        <AnimatePresence>
          {showForgotModal && (
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
              >
                <h3 className="text-red-600 font-bold text-lg text-center">重置进度 / Reset all progress</h3>
                <p className="text-slate-600 text-sm text-center">
                  This will delete all learning progress and return to onboarding. / 这将删除所有学习进度并返回引导页面。
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowForgotModal(false)}
                    className="flex-1 py-3 rounded-xl border border-slate-300 text-slate-600 font-semibold"
                  >
                    取消 / Cancel
                  </button>
                  <button
                    onClick={handleResetConfirm}
                    disabled={isResetting}
                    className="flex-1 py-3 rounded-xl bg-red-500 text-white font-semibold disabled:opacity-50"
                  >
                    确认重置 / Confirm Reset
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ParentLayout>
  );
}
