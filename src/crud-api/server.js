import Fastify from "fastify";
import { registerProductRoutes } from "./routes/products.js";

export function createServer() {
  // logger: true prints every request to the console for debugging
  const fastify = Fastify({ logger: true });

  registerProductRoutes(fastify);

  // Handle requests to URLs that don't exist
  fastify.setNotFoundHandler((request, reply) => {
    reply.status(404).send({
      message: `Route ${request.method} ${request.url} not found. Please check the URL.`,
    });
  });

  // Handle unexpected errors inside route handlers
  // We log the real error but send a generic message to the user for security
  fastify.setErrorHandler((error, request, reply) => {
    fastify.log.error(error);
    reply.status(500).send({
      message: "Something went wrong on the server. Please try again later.",
    });
  });

  return fastify;
}
