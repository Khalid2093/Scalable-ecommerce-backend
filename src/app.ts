import express from "express";
import { connectDB } from "./utils/features.js";
import { errorMiddleware } from "./middlewares/error.js";
import NodeCache from "node-cache";
import { config } from "dotenv";
import morgan from "morgan";
import Stripe from "stripe";
import cors from "cors";
import { Redis } from "ioredis";
import cluster from "cluster";
import os from "os";

// importing routes
import userRoute from "./routes/user.js";
import productRoute from "./routes/product.js";
import orderRoute from "./routes/order.js";
import paymentRoute from "./routes/payment.js";
import dashboardRoute from "./routes/stats.js";

config({ path: "../.env" });
const PORT = process.env.PORT || 3000;
const username = process.env.MONGODB_USERNAME as string;
const pass = process.env.MONGODB_PASSWORD as string;

connectDB(username, pass);

export const redis = new Redis({
  host: process.env.REDIS_HOST as string,
  port: process.env.REDIS_PORT as unknown as number,
  password: process.env.REDIS_PASSWORD as string,
});

const stripeKey = process.env.STRIPE_KEY || "";

export const stripe = new Stripe(stripeKey);

export const myCache = new NodeCache();

// Number of CPU cores
const numCPUs = os.cpus().length;

if (cluster.isPrimary) {
  console.log(`Primary ${process.pid} is running`);

  // Fork workers
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  // Listen for dying workers
  cluster.on("exit", (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died`);
    // Optionally, you can fork a new worker here if needed
    cluster.fork();
  });
} else {
  const app = express();

  app.use(express.json());
  app.use(morgan("dev"));
  app.use(cors());

  redis.on("connect", () => {
    console.log("Redis connected");
  });

  app.get("/", (req, res) => {
    res.send("Hello World");
  });

  // USing routes
  app.use("/api/v1/user", userRoute);

  app.use("/api/v1/product", productRoute);

  app.use("/api/v1/order", orderRoute);

  app.use("/api/v1/payment", paymentRoute);

  app.use("/api/v1/dashboard", dashboardRoute);

  app.use("/uploads", express.static("uploads"));
  app.use(errorMiddleware);

  app.listen(PORT, () => {
    console.log(`Express Server  is running on http://localhost:${PORT}`);
  });
}
