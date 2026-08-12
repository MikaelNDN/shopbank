import { useEffect, useState } from 'react';

import { categoryApi } from '@/api/categoryApi';
import type { Category } from '@/types/product';

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    categoryApi
      .list()
      .then((data) => {
        if (mounted) setCategories(data);
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  return { categories, isLoading };
}
