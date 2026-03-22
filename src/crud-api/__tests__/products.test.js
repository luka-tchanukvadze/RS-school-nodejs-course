import { describe, it, expect, beforeAll } from "vitest";
import { createServer } from "../server.js";

let app;
let createdProductId;

const sampleProduct = {
  name: "Test Laptop",
  description: "A laptop for testing purposes",
  price: 999.99,
  category: "electronics",
  inStock: true,
};

const updatedProduct = {
  name: "Updated Laptop",
  description: "An updated laptop description",
  price: 1299.99,
  category: "electronics",
  inStock: false,
};

beforeAll(async () => {
  app = createServer();
  await app.ready();
});

describe("Product CRUD API", () => {
  it("should create a product and retrieve it by ID", async () => {
    const createRes = await app.inject({
      method: "POST",
      url: "/api/products",
      payload: sampleProduct,
    });

    expect(createRes.statusCode).toBe(201);
    const created = createRes.json();
    expect(created.id).toBeDefined();
    expect(created.name).toBe(sampleProduct.name);

    createdProductId = created.id;

    const getRes = await app.inject({
      method: "GET",
      url: `/api/products/${createdProductId}`,
    });

    expect(getRes.statusCode).toBe(200);
    expect(getRes.json().id).toBe(createdProductId);
  });

  it("should update a product and return updated data", async () => {
    const res = await app.inject({
      method: "PUT",
      url: `/api/products/${createdProductId}`,
      payload: updatedProduct,
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.id).toBe(createdProductId);
    expect(body.name).toBe(updatedProduct.name);
    expect(body.price).toBe(updatedProduct.price);
  });

  it("should delete a product and return 404 when fetching it", async () => {
    const deleteRes = await app.inject({
      method: "DELETE",
      url: `/api/products/${createdProductId}`,
    });

    expect(deleteRes.statusCode).toBe(204);

    const getRes = await app.inject({
      method: "GET",
      url: `/api/products/${createdProductId}`,
    });

    expect(getRes.statusCode).toBe(404);
  });

  it("should return 400 for invalid UUID and missing fields", async () => {
    const badIdRes = await app.inject({
      method: "GET",
      url: "/api/products/not-a-uuid",
    });

    expect(badIdRes.statusCode).toBe(400);

    const badBodyRes = await app.inject({
      method: "POST",
      url: "/api/products",
      payload: { name: "Incomplete" },
    });

    expect(badBodyRes.statusCode).toBe(400);
  });
});
