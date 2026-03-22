import crypto from "node:crypto";
import * as db from "../db.js";

// Check if a string is a valid UUID format (e.g. "550e8400-e29b-41d4-a716-446655440000")
function isValidUuid(str) {
  const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidPattern.test(str);
}

// Check that request body has all required fields and price is positive
// Returns error message string if invalid, or null if OK
function validateProductBody(body) {
  if (!body) {
    return "Request body is missing";
  }

  const { name, description, price, category, inStock } = body;

  if (
    name === undefined ||
    description === undefined ||
    price === undefined ||
    category === undefined ||
    inStock === undefined
  ) {
    return "Missing required fields: name, description, price, category, inStock";
  }

  if (typeof price !== "number" || price <= 0) {
    return "Price must be a positive number";
  }

  return null;
}

// GET /api/products
export async function getAllProducts(request, reply) {
  return db.getAllProducts();
}

// GET /api/products/:productId
export async function getProductById(request, reply) {
  const { productId } = request.params;

  if (!isValidUuid(productId)) {
    return reply
      .status(400)
      .send({ message: "Invalid product ID. It must be a valid UUID." });
  }

  const product = db.getProductById(productId);

  if (!product) {
    return reply.status(404).send({ message: "Product not found" });
  }

  return product;
}

// POST /api/products
export async function createProduct(request, reply) {
  const error = validateProductBody(request.body);
  if (error) {
    return reply.status(400).send({ message: error });
  }

  const newProduct = {
    id: crypto.randomUUID(),
    name: request.body.name,
    description: request.body.description,
    price: request.body.price,
    category: request.body.category,
    inStock: request.body.inStock,
  };

  db.createProduct(newProduct);

  return reply.status(201).send(newProduct);
}

// PUT /api/products/:productId
export async function updateProduct(request, reply) {
  const { productId } = request.params;

  if (!isValidUuid(productId)) {
    return reply
      .status(400)
      .send({ message: "Invalid product ID. It must be a valid UUID." });
  }

  const existing = db.getProductById(productId);
  if (!existing) {
    return reply.status(404).send({ message: "Product not found" });
  }

  const error = validateProductBody(request.body);
  if (error) {
    return reply.status(400).send({ message: error });
  }

  const updated = db.updateProduct(productId, {
    name: request.body.name,
    description: request.body.description,
    price: request.body.price,
    category: request.body.category,
    inStock: request.body.inStock,
  });

  return updated;
}

// DELETE /api/products/:productId
export async function deleteProduct(request, reply) {
  const { productId } = request.params;

  if (!isValidUuid(productId)) {
    return reply
      .status(400)
      .send({ message: "Invalid product ID. It must be a valid UUID." });
  }

  const existing = db.getProductById(productId);
  if (!existing) {
    return reply.status(404).send({ message: "Product not found" });
  }

  db.deleteProduct(productId);
  return reply.status(204).send();
}
