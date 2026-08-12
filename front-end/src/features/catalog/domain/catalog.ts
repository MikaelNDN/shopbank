export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  active: boolean;
}

export interface Product {
  id: string;
  categoryId: string;
  storeId: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  active: boolean;
  availableQuantity: number;
}

export interface Inventory {
  id: string;
  productId: string;
  availableQuantity: number;
  reservedQuantity: number;
  updatedAt: string;
}

export interface ProductFilters {
  search?: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  inStockOnly?: boolean;
  sortBy?: "relevance" | "price-asc" | "price-desc" | "name-asc" | "newest";
}

export interface AdminProductFilters extends ProductFilters {
  includeInactive?: boolean;
  stockStatus?: "all" | "low" | "zero";
}

export interface ProductInput {
  categoryId: string;
  storeId: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  active?: boolean;
  availableQuantity?: number;
}

export interface CatalogRepository {
  listCategories(): Promise<Category[]>;
  listAllCategories(): Promise<Category[]>;
  getCategory(id: string): Promise<Category | null>;
  createCategory(input: { name: string; description?: string; active?: boolean }): Promise<Category>;
  updateCategory(id: string, input: { name: string; description?: string; active?: boolean }): Promise<Category>;
  deleteCategory(id: string): Promise<void>;
  listProducts(filters?: ProductFilters): Promise<Product[]>;
  getProduct(id: string): Promise<Product | null>;
  listAllProducts(filters?: AdminProductFilters): Promise<Product[]>;
  createProduct(input: ProductInput): Promise<Product>;
  updateProduct(id: string, input: Partial<ProductInput>): Promise<Product>;
  deleteProduct(id: string): Promise<void>;
  getInventory(productId: string): Promise<Inventory>;
  updateStock(productId: string, delta: number): Promise<Product | null>;
}
