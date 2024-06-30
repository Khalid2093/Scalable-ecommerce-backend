import express from "express";
import { rateLimiter } from "../middlewares/rateLimiter.js";
import { adminOnly } from "../middlewares/auth.js";
import {
  allOrders,
  deleteOrder,
  getSingleOrder,
  myOrders,
  newOrder,
  processOrder,
} from "../controllers/order.js";

const app = express.Router();

// route - /api/v1/order/new
app.post("/new", newOrder);

// route - /api/v1/order/my
app.get("/my", myOrders);

// route - /api/v1/order/my
app.get(
  "/all",
  adminOnly,
  rateLimiter({ limit: 20, timer: 60, key: `all-orders` }),
  allOrders
);

app
  .route("/:id")
  .get(getSingleOrder)
  .put(adminOnly, processOrder)
  .delete(adminOnly, deleteOrder);

export default app;
