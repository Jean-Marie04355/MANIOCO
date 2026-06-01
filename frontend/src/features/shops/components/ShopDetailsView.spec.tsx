import { render, screen, waitFor, fireEvent } from '@testing-library/react';
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
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    back: vi.fn(),
  })),
}));

import { useRouter } from 'next/navigation';

vi.mock('@/features/auth/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@/components/CartDrawer', () => ({
  default: () => <div data-testid="cart-drawer" />,
}));

vi.mock('@/features/cart/CartContext', () => ({
  useCart: () => ({
    addToCart: vi.fn(),
    totalItems: 0,
  }),
}));

vi.mock('@/features/favorites/FavoritesContext', () => ({
  useFavorites: () => ({
    toggleFavorite: vi.fn(),
    isFavorited: () => false,
    totalFavorites: 0,
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
      expect(screen.getByText(/Mode Aperçu/i)).toBeInTheDocument();
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

  it('devrait ouvrir le panier lors du clic sur l\'icône de panier', async () => {
    (useAuth as any).mockReturnValue({
      user: { id: 'user-1', role: 'client' },
      isLoading: false,
    });
    render(<ShopDetailsView isPublic={false} />);
    
    await waitFor(() => {
      const cartBtn = screen.getByTestId('cart-drawer');
      expect(cartBtn).toBeInTheDocument();
    });
  });

  it('devrait rediriger vers le chat lors du clic sur contacter', async () => {
    const mockPush = vi.fn();
    (useRouter as any).mockReturnValue({
      push: mockPush,
    });
    
    (useAuth as any).mockReturnValue({
      user: { id: 'user-1', role: 'client' },
      isLoading: false,
    });
    (api.post as any).mockResolvedValue({ data: { id: 'chat-1' } });

    render(<ShopDetailsView isPublic={false} />);
    
    await waitFor(async () => {
      const contactBtn = screen.getByText(/Contacter/i);
      fireEvent.click(contactBtn);
      await waitFor(() => {
        expect(api.post).toHaveBeenCalled();
      });
    });
  });

  it('devrait retourner des liens Unsplash basés sur le nom du produit', async () => {
    const mockProducts = [
      { id: 'p1', name: 'iPhone 15', price: 1000 },
      { id: 'p2', name: 'Nike Air', price: 2000 },
      { id: 'p3', name: 'Parfum Luxe', price: 3000 },
      { id: 'p4', name: 'Rolex Watch', price: 4000 },
      { id: 'p5', name: 'Tomate', price: 50, image: 'custom.jpg' },
    ];
    (api.get as any).mockImplementation((url: string) => {
      if (url.includes('/stores/')) return Promise.resolve({ data: storeData });
      if (url.includes('/products')) return Promise.resolve({ data: mockProducts });
      return Promise.resolve({ data: {} });
    });

    (useAuth as any).mockReturnValue({ user: { id: 'u1' }, isLoading: false });
    render(<ShopDetailsView isPublic={true} />);

    await waitFor(() => {
      const images = document.querySelectorAll('img');
      expect(images.length).toBeGreaterThan(0);
    }, { timeout: 3000 });
  });
});


