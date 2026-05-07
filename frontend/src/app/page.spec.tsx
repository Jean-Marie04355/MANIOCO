import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Home from './page';
import { useAuth } from '@/features/auth/AuthContext';

// Mocks
vi.mock('@/features/auth/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({ push: vi.fn() })),
}));

vi.mock('@/features/home/components/HomeView', () => ({
  default: () => <div data-testid="home-view">HomeView</div>,
}));

describe('Home Page', () => {
  it('renders HomeView when not loading', () => {
    (useAuth as any).mockReturnValue({ user: null, isLoading: false });
    render(<Home />);
    expect(screen.getByTestId('home-view')).toBeDefined();
  });

  it('renders loader when loading', () => {
    (useAuth as any).mockReturnValue({ user: null, isLoading: true });
    
    const { container } = render(<Home />);
    // Check if a container with bg-[#fcfbf7] exists (loader bg)
    expect(container.firstChild).toHaveClass('flex');
  });
});

