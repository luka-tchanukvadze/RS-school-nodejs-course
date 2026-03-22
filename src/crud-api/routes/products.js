import * as productController from "../controllers/products.js";

export function registerProductRoutes(fastify) {
  fastify.get("/api/products", productController.getAllProducts);
  fastify.get("/api/products/:productId", productController.getProductById);
  fastify.post("/api/products", productController.createProduct);
  fastify.put("/api/products/:productId", productController.updateProduct);
  fastify.delete("/api/products/:productId", productController.deleteProduct);
}
