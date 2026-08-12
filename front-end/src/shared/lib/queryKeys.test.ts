import { describe, expect, it } from "@jest/globals";
import { createQueryKeys, queryKeys } from "./queryKeys";

describe("createQueryKeys", () => {
  it("builds stable keys for lists and details", () => {
    const products = createQueryKeys("products");

    expect(products.all).toEqual(["products"]);
    expect(products.lists()).toEqual(["products", "list"]);
    expect(products.list({ search: "fone", inStockOnly: true })).toEqual([
      "products",
      "list",
      { search: "fone", inStockOnly: true },
    ]);
    expect(products.list()).toEqual(["products", "list", {}]);
    expect(products.details()).toEqual(["products", "detail"]);
    expect(products.detail(10)).toEqual(["products", "detail", "10"]);
  });

  it("exposes the shared scopes used by application features", () => {
    expect(queryKeys.auth.all).toEqual(["auth"]);
    expect(queryKeys.catalog.all).toEqual(["catalog"]);
    expect(queryKeys.orders.detail("123")).toEqual(["orders", "detail", "123"]);
  });
});

