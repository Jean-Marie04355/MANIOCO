import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AdminProfileView from './AdminProfileView';
import api from '@/lib/axios';

// Mocks
vi.mock('@/lib/axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

vi.mock('@/app/dashboard/components/Sidebar', () => ({
  default: () => <div data-testid="sidebar" />,
}));

describe('AdminProfileView', () => {
  const mockUser = {
    id: 'admin-1',
    name: 'Super Admin',
    email: 'admin@afrigari.com',
    role: 'super_admin',
    profilePhoto: null,
    createdAt: '2023-01-01T00:00:00Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (api.get as any).mockResolvedValue({ data: [] });
  });

  const defaultProps = {
    mode: 'super-admin' as const,
    themeColor: 'indigo-600',
    accentColor: 'indigo',
    identityTag: 'CITADEL-01'
  };

  it('devrait afficher les informations de l\'utilisateur', async () => {
    vi.mocked(require('@/features/auth/AuthContext').useAuth).mockReturnValue({
      user: mockUser,
      isLoading: false,
      logout: vi.fn(),
      fetchUser: vi.fn(),
    });

    render(<AdminProfileView {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('Super Admin')).toBeInTheDocument();
      expect(screen.getByText('admin@afrigari.com')).toBeInTheDocument();
      expect(screen.getByText('SUPER ADMIN')).toBeInTheDocument();
    });
  });

  it('devrait afficher la barre de puissance', async () => {
    render(<AdminProfileView {...defaultProps} />);
    expect(screen.getByText(/Puissance d'Accès/i)).toBeInTheDocument();
  });
});

// Mock AuthContext at the end or top
vi.mock('@/features/auth/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    user: { id: 'admin-1', name: 'Super Admin', email: 'admin@afrigari.com', role: 'super_admin' },
    isLoading: false,
  })),
}));
