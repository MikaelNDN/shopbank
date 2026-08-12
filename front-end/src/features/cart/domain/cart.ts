export interface CartItemSnapshot {
  productId: string;
  name: string;
  price: number;
  availableQuantity: number;
  imageUrl?: string;
}

export interface CartItem extends CartItemSnapshot {
  quantity: number;
}
