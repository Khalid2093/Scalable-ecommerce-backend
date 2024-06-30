import express from "express";
import { adminOnly } from "../middlewares/auth.js";
import { singleUpload } from "../middlewares/multer.js";
import {
  deleteProduct,
  getAdminProducts,
  getAllProducts,
  getCategories,
  getLatestProducts,
  getSingleProduct,
  newProduct,
  updateProduct,
} from "../controllers/product.js";
import { rateLimiter } from "../middlewares/rateLimiter.js";

const app = express.Router();

//route - /api/v1/product

app.post("/new", adminOnly, singleUpload, newProduct);

// getting all products with filters
app.get("/all", getAllProducts);

app.get(
  "/latest",
  rateLimiter({ limit: 20, timer: 60, key: "latest-product" }),
  getLatestProducts
);

app.get(
  "/categories",
  rateLimiter({ limit: 20, timer: 60, key: "categories" }),
  getCategories
);

app.get("/admin-products", adminOnly, getAdminProducts);

app
  .route("/:id")
  .get(getSingleProduct)
  .delete(adminOnly, deleteProduct)
  .put(adminOnly, singleUpload, updateProduct);

export default app;
