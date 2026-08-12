export interface CartItem {
  productId: string;
  name: string;
  imageUrl: string;
  price: number;
  quantity: number;
  availableQuantity: number;
  active: boolean;
}
