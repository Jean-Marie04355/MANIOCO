import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ProductModal from './AddProductModal';
import api from '@/lib/axios';

// Mock de l'API axios
vi.mock('@/lib/axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}));

// Mock de Next/Image
vi.mock('next/image', () => ({
  default: (props: any) => <img {...props} />,
}));

describe('AddProductModal', () => {
  const mockOnClose = vi.fn();
  const mockOnSuccess = vi.fn();
  const storeId = 'store-123';
  const categories = [
    { id: 'cat-1', name: 'Légumes' },
    { id: 'cat-2', name: 'Fruits' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (api.get as any).mockResolvedValue({ data: categories });
  });

  it('ne devrait rien afficher si isOpen est false', () => {
    render(<ProductModal isOpen={false} onClose={mockOnClose} onSuccess={mockOnSuccess} storeId={storeId} />);
    expect(screen.queryByText(/Ajouter un produit/i)).not.toBeInTheDocument();
  });

  it('devrait pré-remplir les champs en mode édition', async () => {
    const productToEdit = {
      id: 'p1',
      name: 'Tomate',
      price: 1000,
      stock: 50,
      unit: 'Kg',
      categoryId: 'cat-1',
    };

    render(<ProductModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} storeId={storeId} productToEdit={productToEdit} />);
    expect(screen.getByPlaceholderText(/Ex: iPhone 15/i)).toHaveValue('Tomate');
  });

  it('devrait mettre à jour le prix et le stock lors du changement d\'unité', async () => {
    render(<ProductModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} storeId={storeId} />);

    // Remplir prix (5000) et stock (10) pour l'unité "Sac" (par défaut)
    fireEvent.change(screen.getByPlaceholderText('0'), { target: { value: '5000' } });
    fireEvent.change(screen.getByDisplayValue('1'), { target: { value: '10' } });

    // Changer l'unité vers "Kg" (1 sac = 50kg)
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'Kg' } });

    expect(screen.getByPlaceholderText('0')).toHaveValue(100); // 5000 / 50
    expect(screen.getByDisplayValue('500')).toBeInTheDocument(); // 10 * 50
  });

  it('devrait afficher une alerte si des champs obligatoires sont manquants', async () => {
    const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => {});
    render(<ProductModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} storeId={storeId} />);

    const form = document.getElementById('product-form');
    if (form) fireEvent.submit(form);

    expect(alertMock).toHaveBeenCalled();
    alertMock.mockRestore();
  });
});
