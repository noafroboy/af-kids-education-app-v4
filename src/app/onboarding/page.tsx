'use client';

import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useDB } from '@/hooks/useDB';
import { putSetting } from '@/lib/db';
import { StepWelcome } from '@/components/onboarding/StepWelcome';
import { StepName } from '@/components/onboarding/StepName';
import { StepAge } from '@/components/onboarding/StepAge';
import { StepPin } from '@/components/onboarding/StepPin';
import { StepHandoff } from '@/components/onboarding/StepHandoff';

type WizardData = {
  childName: string;
  childAge: number;
  pinHash: string;
};

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<Partial<WizardData>>({});
  const db = useDB();
  const router = useRouter();

  async function handleDone() {
    if (!db) return;
    try {
      await Promise.all([
        putSetting(db as never, 'childName', data.childName ?? ''),
        putSetting(db as never, 'childAge', data.childAge ?? 3),
        putSetting(db as never, 'pinHash', data.pinHash ?? ''),
        putSetting(db as never, 'onboardingComplete', 'true'),
      ]);
      router.replace('/');
    } catch (err) {
      console.error('[Onboarding] Failed to save settings:', err);
    }
  }

  return (
    <div className="max-w-[428px] mx-auto min-h-screen bg-[#FFF9F0] overflow-hidden">
      <AnimatePresence mode="wait">
        {step === 0 && (
          <StepWelcome key="welcome" onNext={() => setStep(1)} />
        )}
        {step === 1 && (
          <StepName
            key="name"
            onNext={(name) => { setData((d) => ({ ...d, childName: name })); setStep(2); }}
            onBack={() => setStep(0)}
          />
        )}
        {step === 2 && (
          <StepAge
            key="age"
            onNext={(age) => { setData((d) => ({ ...d, childAge: age })); setStep(3); }}
            onBack={() => setStep(1)}
          />
        )}
        {step === 3 && (
          <StepPin
            key="pin"
            onNext={(hash) => { setData((d) => ({ ...d, pinHash: hash })); setStep(4); }}
            onBack={() => setStep(2)}
          />
        )}
        {step === 4 && (
          <StepHandoff key="handoff" onDone={handleDone} />
        )}
      </AnimatePresence>
    </div>
  );
}
