import { useEffect, useState } from 'react';

import { productApi } from '@/api/productApi';
import type { Product } from '@/types/product';

export function useFeaturedProducts(limit = 6) {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    productApi
      .featured(limit)
      .then((data) => {
        if (mounted) setProducts(data);
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [limit]);

  return { products, isLoading };
}
