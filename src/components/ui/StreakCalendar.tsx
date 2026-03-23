'use client';

import { formatDate } from '@/lib/utils';

interface StreakCalendarProps {
  sessionDates: Set<string>;
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAY_LABELS_ZH = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

export function StreakCalendar({ sessionDates }: StreakCalendarProps) {
  const today = new Date();
  const todayStr = formatDate(today);

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (6 - i));
    return d;
  });

  return (
    <div data-testid="streak-calendar" className="flex justify-between px-2 py-3">
      {days.map((day) => {
        const dateStr = formatDate(day);
        const isToday = dateStr === todayStr;
        const isActive = sessionDates.has(dateStr);
        const dow = day.getDay();
        const labelIdx = dow === 0 ? 6 : dow - 1;

        return (
          <div key={dateStr} className="flex flex-col items-center gap-1">
            <span className="text-xs text-slate-500">{DAY_LABELS[labelIdx]}</span>
            <span className="text-[10px] text-slate-400">{DAY_LABELS_ZH[labelIdx]}</span>
            <div
              className={[
                'w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold',
                isActive ? 'bg-[#FF6B35] text-white' : 'bg-transparent text-slate-400 border border-slate-200',
                isToday ? 'ring-2 ring-[#FF6B35]' : '',
              ].join(' ')}
            >
              {day.getDate()}
            </div>
          </div>
        );
      })}
    </div>
  );
}
