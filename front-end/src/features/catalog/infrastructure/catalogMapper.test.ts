import { describe, expect, it } from "@jest/globals";
import {
  mapCategoryRequest,
  mapCategoryResponse,
  mapInventoryRequest,
  mapInventoryResponse,
  mapProductRequest,
  mapProductResponse,
  slugify,
} from "./catalogMapper";

describe("catalogMapper", () => {
  it("maps categories and slugs names", () => {
    expect(slugify("Eletronicos & Casa")).toBe("eletronicos-casa");
    expect(mapCategoryResponse({ id: 2, name: "Livros", description: null, active: true })).toEqual({
      id: "2",
      name: "Livros",
      slug: "livros",
      description: undefined,
      active: true,
    });
    expect(mapCategoryRequest({ name: " Moda ", active: false })).toEqual({
      name: "Moda",
      description: undefined,
      active: false,
    });
    expect(mapCategoryRequest({ name: "Casa", description: "Itens de casa" })).toEqual({
      name: "Casa",
      description: "Itens de casa",
      active: true,
    });
  });

  it("maps products, inventory and write payloads", () => {
    const inventory = mapInventoryResponse({
      id: 9,
      productId: 3,
      availableQuantity: 12,
      reservedQuantity: 2,
      updatedAt: "2026-05-13T10:00:00",
    });

    expect(mapProductResponse(
      {
        id: 3,
        categoryId: 2,
        storeId: 1,
        name: "Notebook",
        description: null,
        price: "6499.90",
        imageUrl: null,
        active: true,
      },
      inventory,
    )).toEqual({
      id: "3",
      categoryId: "2",
      storeId: "1",
      name: "Notebook",
      description: "",
      price: 6499.9,
      imageUrl: "",
      active: true,
      availableQuantity: 12,
    });

    expect(
      mapProductRequest({
        categoryId: "2",
        storeId: "1",
        name: " Notebook ",
        price: 6499.9,
      }),
    ).toEqual({
      categoryId: 2,
      storeId: 1,
      name: "Notebook",
      description: undefined,
      price: 6499.9,
      imageUrl: undefined,
      active: true,
    });

    expect(mapInventoryRequest("3", -5)).toEqual({ productId: 3, quantity: 5 });
  });

  it("maps product defaults when inventory and optional fields are absent", () => {
    expect(
      mapProductResponse({
        id: 3,
        categoryId: 2,
        storeId: 1,
        name: "Livro",
        description: "DDD",
        price: 159,
        imageUrl: "https://image.test",
        active: false,
      }),
    ).toEqual({
      id: "3",
      categoryId: "2",
      storeId: "1",
      name: "Livro",
      description: "DDD",
      price: 159,
      imageUrl: "https://image.test",
      active: false,
      availableQuantity: 0,
    });
  });
});
