export interface Product {
  id: string;
  name: string;
  category: string;
  price: string;
  stock: number;
  status: 'En ligne' | 'Epuisé' | 'Brouillon';
  image: string;
}
