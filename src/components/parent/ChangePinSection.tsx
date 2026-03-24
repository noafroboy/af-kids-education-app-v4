'use client';

import { useState, useEffect, useRef } from 'react';
import { PinPad } from '@/components/ui/PinPad';
import { verifyPIN, hashPIN } from '@/lib/crypto';
import { useDB } from '@/hooks/useDB';
import { getSetting, putSetting } from '@/lib/db';

export function ChangePinSection() {
  const db = useDB();
  const [step, setStep] = useState<'verify' | 'newPin' | 'done'>('verify');
  const [pinError, setPinError] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const pinErrorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (pinErrorTimerRef.current) clearTimeout(pinErrorTimerRef.current);
    };
  }, []);

  async function handleVerifyCurrent(pin: string) {
    if (!db) return;
    try {
      const stored = await getSetting(db as never, 'pinHash');
      const hash = String(stored?.value ?? '');
      const ok = await verifyPIN(pin, hash);
      if (ok) {
        setPinError(false);
        setErrorMsg('');
        setStep('newPin');
      } else {
        setPinError(true);
        setErrorMsg('Wrong PIN / 密码错误');
        if (pinErrorTimerRef.current) clearTimeout(pinErrorTimerRef.current);
        pinErrorTimerRef.current = setTimeout(() => setPinError(false), 500);
      }
    } catch (err) {
      console.error('[ChangePinSection] verify error:', err);
    }
  }

  async function handleNewPin(pin: string) {
    if (!db) return;
    try {
      const newHash = await hashPIN(pin);
      await putSetting(db as never, 'pinHash', newHash);
      setStep('done');
    } catch (err) {
      console.error('[ChangePinSection] save error:', err);
      setErrorMsg('Failed to save new PIN / 保存失败');
    }
  }

  if (step === 'done') {
    return (
      <div className="text-center py-4">
        <p className="text-green-600 text-lg font-semibold">✅ PIN Changed / 密码已更改</p>
        <button onClick={() => setStep('verify')} className="mt-3 text-[#4F46E5] underline text-sm">
          Change again / 再次更改
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 py-2">
      <p className="text-slate-600 text-sm text-center">
        {step === 'verify' ? 'Enter current PIN / 输入当前密码' : 'Enter new PIN / 输入新密码'}
      </p>
      {errorMsg && <p className="text-red-500 text-sm">{errorMsg}</p>}
      <PinPad
        onSubmit={step === 'verify' ? handleVerifyCurrent : handleNewPin}
        error={pinError}
      />
    </div>
  );
}
