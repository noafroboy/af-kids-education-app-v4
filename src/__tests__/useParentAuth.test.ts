import { renderHook, act } from '@testing-library/react';
import { useParentAuth } from '@/hooks/useParentAuth';

const mockReplace = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

describe('useParentAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    sessionStorage.clear();
  });

  it('sets isAuthed to true and does NOT redirect when parentAuthed=1 in sessionStorage', async () => {
    sessionStorage.setItem('parentAuthed', '1');

    const { result } = renderHook(() => useParentAuth());

    await act(async () => {});

    expect(result.current.isAuthed).toBe(true);
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('redirects to /parent and keeps isAuthed false when sessionStorage has no parentAuthed', async () => {
    const { result } = renderHook(() => useParentAuth());

    await act(async () => {});

    expect(result.current.isAuthed).toBe(false);
    expect(mockReplace).toHaveBeenCalledWith('/parent');
  });

  it('redirects to /parent when parentAuthed is not "1"', async () => {
    sessionStorage.setItem('parentAuthed', '0');

    const { result } = renderHook(() => useParentAuth());

    await act(async () => {});

    expect(result.current.isAuthed).toBe(false);
    expect(mockReplace).toHaveBeenCalledWith('/parent');
  });
});
