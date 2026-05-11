import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ShopDetailsView from './ShopDetailsView';
import api from '@/lib/axios';
import { useParams } from 'next/navigation';

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
  useAuth: () => ({
    user: { id: 'user-1', role: 'client' },
    isLoading: false,
  }),
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
    render(<ShopDetailsView isPublic={true} />);
    expect(screen.getByRole('progressbar', { hidden: true }) || screen.getByTestId('loader')).toBeInTheDocument();
  });

  it('devrait afficher les informations de la boutique après le chargement', async () => {
    render(<ShopDetailsView isPublic={true} />);
    await waitFor(() => {
      expect(screen.getByText('Boutique Test')).toBeInTheDocument();
      expect(screen.getByText('Description de test')).toBeInTheDocument();
    });
  });

  it('devrait afficher un message si la boutique n\'existe pas', async () => {
    (api.get as any).mockRejectedValueOnce(new Error('404'));
    render(<ShopDetailsView isPublic={true} />);
    await waitFor(() => {
      expect(screen.getByText(/Boutique introuvable/i)).toBeInTheDocument();
    });
  });
});
