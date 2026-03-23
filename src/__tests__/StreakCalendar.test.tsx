import React from 'react';
import { render, screen } from '@testing-library/react';
import { StreakCalendar } from '@/components/ui/StreakCalendar';
import { formatDate } from '@/lib/utils';

describe('StreakCalendar', () => {
  it('renders with data-testid streak-calendar', () => {
    render(<StreakCalendar sessionDates={new Set()} />);
    expect(screen.getByTestId('streak-calendar')).toBeInTheDocument();
  });

  it('renders 7 day circles', () => {
    render(<StreakCalendar sessionDates={new Set()} />);
    // Each day has a date number; today's date should appear
    const calendar = screen.getByTestId('streak-calendar');
    const dayDivs = calendar.querySelectorAll('.rounded-full');
    expect(dayDivs.length).toBe(7);
  });

  it('shows today with ring-2 ring style', () => {
    render(<StreakCalendar sessionDates={new Set()} />);
    const calendar = screen.getByTestId('streak-calendar');
    const today = new Date();
    const todayDate = String(today.getDate());
    // Find the circle with today's date
    const circles = calendar.querySelectorAll('.rounded-full');
    const todayCircle = Array.from(circles).find((c) => c.textContent?.trim() === todayDate);
    expect(todayCircle).toBeTruthy();
    expect(todayCircle?.className).toContain('ring-2');
  });

  it('marks active days with coral fill', () => {
    const today = new Date();
    const todayStr = formatDate(today);
    render(<StreakCalendar sessionDates={new Set([todayStr])} />);
    const calendar = screen.getByTestId('streak-calendar');
    const circles = calendar.querySelectorAll('.rounded-full');
    const todayCircle = Array.from(circles).find((c) => c.textContent?.trim() === String(today.getDate()));
    expect(todayCircle?.className).toContain('bg-[#FF6B35]');
  });

  it('leaves inactive days without fill', () => {
    render(<StreakCalendar sessionDates={new Set()} />);
    const calendar = screen.getByTestId('streak-calendar');
    const circles = calendar.querySelectorAll('.rounded-full');
    // Days that are not today should not have coral fill
    const today = new Date();
    const inactiveCircles = Array.from(circles).filter(
      (c) => c.textContent?.trim() !== String(today.getDate())
    );
    inactiveCircles.forEach((c) => {
      expect(c.className).not.toContain('bg-[#FF6B35]');
    });
  });

  it('shows day labels (Mon/周一)', () => {
    render(<StreakCalendar sessionDates={new Set()} />);
    // At least one of the day labels should appear
    const hasLabel = screen.queryByText('Mon') || screen.queryByText('Tue') || screen.queryByText('Wed');
    expect(hasLabel).toBeTruthy();
  });
});
