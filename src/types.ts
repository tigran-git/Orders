export interface Product {
  id: string;
  name: string;
  price: number;
  category?: 'jerki' | 'akanj' | string;
  color?: string;
}

export interface OrderLine {
  id: string;
  productName: string;
  price: number;
  quantity: number;
  total: number;
  category?: 'jerki' | 'akanj' | string;
  color?: string;
}

export interface SavedOrder {
  id: string;
  orderNumber: string;
  createdAt: string;
  customerCode: string;
  customerName: string;
  lines: OrderLine[];
  total: number;
  notes?: string;
}
