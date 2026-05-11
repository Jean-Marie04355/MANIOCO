import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AdminProfileView from './AdminProfileView';
import api from '@/lib/axios';
import { useAuth } from '@/features/auth/AuthContext';

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

vi.mock('@/features/auth/AuthContext', () => ({
  useAuth: vi.fn(),
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
    (useAuth as any).mockReturnValue({
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

  it('devrait passer en mode édition lors du clic sur le bouton', async () => {
    (useAuth as any).mockReturnValue({
      user: mockUser,
      isLoading: false,
      logout: vi.fn(),
      fetchUser: vi.fn(),
    });
    render(<AdminProfileView {...defaultProps} />);
    
    const editBtn = screen.getByText(/Modifier les informations/i);
    fireEvent.click(editBtn);
    
    expect(screen.getByPlaceholderText('Votre Nom')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Votre Email')).toBeInTheDocument();
    expect(screen.getByText('Enregistrer')).toBeInTheDocument();
  });

  it('devrait soumettre le formulaire lors de la sauvegarde', async () => {
    (useAuth as any).mockReturnValue({
      user: mockUser,
      isLoading: false,
      logout: vi.fn(),
      fetchUser: vi.fn(),
    });
    (api.patch as any).mockResolvedValue({ data: {} });

    render(<AdminProfileView {...defaultProps} />);
    
    // Mode édition
    fireEvent.click(screen.getByText(/Modifier les informations/i));
    
    // Modifier
    fireEvent.change(screen.getByPlaceholderText('Votre Nom'), { target: { value: 'Nouveau Nom' } });
    
    // Sauvegarder
    fireEvent.click(screen.getByText('Enregistrer'));
    
    await waitFor(() => {
      expect(api.patch).toHaveBeenCalledWith(`/users/${mockUser.id}`, expect.objectContaining({ name: 'Nouveau Nom' }));
    });
  });

  it('devrait appeler handlePhotoDelete lors de la suppression de la photo', async () => {
    const userWithPhoto = { ...mockUser, profilePhoto: 'photo.jpg' };
    (useAuth as any).mockReturnValue({
      user: userWithPhoto,
      isLoading: false,
      logout: vi.fn(),
      fetchUser: vi.fn(),
    });
    (api.patch as any).mockResolvedValue({ data: {} });

    render(<AdminProfileView {...defaultProps} />);
    
    const deleteBtn = screen.getByTitle(/Supprimer la photo/i);
    if (deleteBtn) fireEvent.click(deleteBtn);

    await waitFor(() => {
      expect(api.patch).toHaveBeenCalledWith(`/users/${mockUser.id}`, { profilePhoto: null });
    });
  });
});
