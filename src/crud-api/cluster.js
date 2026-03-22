// cluster.js - runs multiple server instances with a load balancer
//
// Primary process - load balancer on PORT, forwards requests using round-robin.
// Worker processes - each runs a Fastify server on PORT+1, PORT+2 and ...
// Database is kept in sync between workers via IPC messages through the primary.

import cluster from "node:cluster";
import os from "node:os";
import http from "node:http";
import "dotenv/config";

const PORT = Number(process.env.PORT) || 4000;
const numWorkers = os.availableParallelism() - 1;

// PRIMARY PROCESS - acts as a load balancer
if (cluster.isPrimary) {
  console.log(`Primary process ${process.pid} is running`);
  console.log(`Starting ${numWorkers} workers...`);

  // Primary holds the shared database state
  let sharedDb = [];
  const workers = [];

  for (let i = 0; i < numWorkers; i++) {
    const workerPort = PORT + i + 1;
    const worker = cluster.fork({ WORKER_PORT: workerPort });
    workers.push(worker);

    // When a worker changes its database, save and broadcast to all other workers
    worker.on("message", (msg) => {
      if (msg.type === "db-update") {
        sharedDb = msg.data;
        for (const otherWorker of workers) {
          if (otherWorker !== worker && !otherWorker.isDead()) {
            otherWorker.send({ type: "db-sync", data: sharedDb });
          }
        }
      }
    });

    console.log(`Worker started on port ${workerPort}`);
  }

  // Round-robin counter
  let currentWorkerIndex = 0;

  // Load balancer - forwards each request to the next worker
  const loadBalancer = http.createServer((req, res) => {
    const targetPort = PORT + currentWorkerIndex + 1;
    currentWorkerIndex = (currentWorkerIndex + 1) % numWorkers;

    const proxyRequest = http.request(
      {
        hostname: "localhost",
        port: targetPort,
        path: req.url,
        method: req.method,
        headers: req.headers,
      },
      (proxyResponse) => {
        res.writeHead(proxyResponse.statusCode, proxyResponse.headers);
        proxyResponse.pipe(res);
      },
    );

    proxyRequest.on("error", (error) => {
      console.error(`Error forwarding to port ${targetPort}:`, error.message);
      res.writeHead(502);
      res.end(JSON.stringify({ message: "Bad Gateway - Worker unavailable" }));
    });

    req.pipe(proxyRequest);
  });

  loadBalancer.listen(PORT, () => {
    console.log(`Load balancer is running on http://localhost:${PORT}`);
    console.log(
      `Workers are on ports ${PORT + 1} through ${PORT + numWorkers}`,
    );
  });

  cluster.on("exit", (worker, code) => {
    console.log(`Worker ${worker.process.pid} exited (code: ${code})`);
  });
}

// WORKER PROCESS - runs a Fastify server
else {
  const { createServer } = await import("./server.js");
  const { setOnChange, setProducts } = await import("./db.js");

  const workerPort = Number(process.env.WORKER_PORT);

  // When this worker changes the database, send update to primary
  setOnChange((updatedProducts) => {
    process.send({ type: "db-update", data: updatedProducts });
  });

  // When primary sends synced data from another worker, update local database
  process.on("message", (msg) => {
    if (msg.type === "db-sync") {
      setProducts(msg.data);
    }
  });

  const app = createServer();

  try {
    await app.listen({ port: workerPort, host: "0.0.0.0" });
    console.log(`Worker ${process.pid} listening on port ${workerPort}`);
  } catch (error) {
    console.error(
      `Worker failed to start on port ${workerPort}:`,
      error.message,
    );
    process.exit(1);
  }
}
