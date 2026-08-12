export interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  categoryId: string;
  price: number;
  imageUrl: string;
  availableQuantity: number;
  active: boolean;
  createdAt: string;
}

export interface ProductFilters {
  search?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  inStockOnly?: boolean;
  sortBy?: 'relevance' | 'price-asc' | 'price-desc' | 'name-asc' | 'newest';
}
