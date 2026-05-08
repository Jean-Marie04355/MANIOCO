import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TopNav from './TopNav';
import { useAuth } from '@/features/auth/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import api from '@/lib/axios';

// Mocks
vi.mock('@/features/auth/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  usePathname: vi.fn(),
}));

vi.mock('@/lib/axios', () => ({
  default: {
    get: vi.fn(),
    patch: vi.fn(),
  },
}));

describe('TopNav', () => {
  const mockLogout = vi.fn();
  const user = { id: '1', name: 'John Doe', email: 'john@test.com' };
  const notifications = [
    { id: 'n1', title: 'Test', message: 'Hello', isRead: false, createdAt: new Date().toISOString() },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as any).mockReturnValue({ user, logout: mockLogout });
    (useRouter as any).mockReturnValue({ back: vi.fn() });
    (usePathname as any).mockReturnValue('/dashboard/seller');
    (api.get as any).mockResolvedValue({ data: notifications });
  });

  it('devrait afficher le titre et le nom de l\'utilisateur', () => {
    render(<TopNav title="Dashboard" isAdmin={false} />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('devrait ouvrir le menu des notifications et marquer comme lu', async () => {
    render(<TopNav title="Dashboard" isAdmin={false} />);
    
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[1]); // Bouton cloche
    
    expect(await screen.findByText('Notifications')).toBeInTheDocument();
    
    const notifItem = screen.getByText('Test');
    fireEvent.click(notifItem);
    
    expect(api.patch).toHaveBeenCalledWith('/notifications/n1/read');
  });

  it('devrait appeler logout au clic sur déconnexion', () => {
    render(<TopNav title="Dashboard" isAdmin={false} />);
    
    fireEvent.click(screen.getByText('John Doe'));
    fireEvent.click(screen.getByText(/Déconnexion/i));
    
    expect(mockLogout).toHaveBeenCalled();
  });
});
