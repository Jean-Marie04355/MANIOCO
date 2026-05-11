import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ShopDetailsView from './ShopDetailsView';
import api from '@/lib/axios';
import { useParams } from 'next/navigation';

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
  useParams: vi.fn(),
  useRouter: () => ({
    push: vi.fn(),
    back: vi.fn(),
  }),
}));

vi.mock('@/features/auth/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@/features/cart/CartContext', () => ({
  useCart: () => ({
    addToCart: vi.fn(),
    totalItems: 0,
  }),
}));

vi.mock('@/components/CartDrawer', () => ({
  default: () => <div data-testid="cart-drawer" />,
}));

describe('ShopDetailsView', () => {
  const storeData = {
    id: 'store-1',
    name: 'Boutique Test',
    description: 'Description de test',
    ownerId: 'owner-1',
    profilePhoto: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useParams as any).mockReturnValue({ id: 'store-1' });
    (api.get as any).mockImplementation((url: string) => {
      if (url.includes('/stores/')) return Promise.resolve({ data: storeData });
      if (url.includes('/products')) return Promise.resolve({ data: [] });
      return Promise.resolve({ data: {} });
    });
  });

  it('devrait afficher le chargeur au début', () => {
    (useAuth as any).mockReturnValue({
      user: null,
      isLoading: true,
    });
    render(<ShopDetailsView isPublic={true} />);
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('devrait afficher les informations de la boutique après le chargement', async () => {
    (useAuth as any).mockReturnValue({
      user: { id: 'user-1', role: 'client' },
      isLoading: false,
    });
    render(<ShopDetailsView isPublic={true} />);
    await waitFor(() => {
      expect(screen.getByText('Boutique Test')).toBeInTheDocument();
      expect(screen.getByText('Description de test')).toBeInTheDocument();
    });
  });

  it('devrait afficher un message si la boutique n\'existe pas', async () => {
    (useAuth as any).mockReturnValue({
      user: { id: 'user-1', role: 'client' },
      isLoading: false,
    });
    (api.get as any).mockRejectedValueOnce(new Error('404'));
    render(<ShopDetailsView isPublic={true} />);
    await waitFor(() => {
      expect(screen.getByText(/Boutique introuvable/i)).toBeInTheDocument();
    });
  });

  it('devrait afficher le badge propriétaire si l\'utilisateur est le vendeur', async () => {
    // Mock useAuth for owner
    (useAuth as any).mockReturnValue({
      user: { id: 'owner-1', role: 'vendeur' },
      isLoading: false,
    });

    render(<ShopDetailsView isPublic={false} />);
    await waitFor(() => {
      expect(screen.getByText(/Vous visualisez votre boutique/i)).toBeInTheDocument();
    });
  });

  it('devrait afficher les produits dans la grille', async () => {
    const mockProducts = [
      { id: 'p1', name: 'Produit 1', price: 1000, unit: 'Kg' },
      { id: 'p2', name: 'Produit 2', price: 2000, unit: 'Litre' },
    ];
    (api.get as any).mockImplementation((url: string) => {
      if (url.includes('/stores/')) return Promise.resolve({ data: storeData });
      if (url.includes('/products')) return Promise.resolve({ data: mockProducts });
      return Promise.resolve({ data: {} });
    });

    (useAuth as any).mockReturnValue({
      user: { id: 'user-1', role: 'client' },
      isLoading: false,
    });
    render(<ShopDetailsView isPublic={true} />);
    await waitFor(() => {
      expect(screen.getByText('Produit 1')).toBeInTheDocument();
      expect(screen.getByText('Produit 2')).toBeInTheDocument();
    });
  });
});

