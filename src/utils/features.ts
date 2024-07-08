import mongoose, { Document } from "mongoose";
import { InvalidateCacheProps, OrderItemType } from "../types/types.js";
import { Product } from "../models/product.js";
import { myCache } from "../app.js";
import { redis } from "../app.js";
import axios from "axios";
import OpenAI from "openai";
import { EmbeddingModel, FlagEmbedding } from "fastembed";
import { pipeline } from "@xenova/transformers";

export const connectDB = (username: string, pass: string) => {
  mongoose
    .connect(
      `mongodb+srv://${username}:${pass}@mern-ecommerce.07rxrbw.mongodb.net/?retryWrites=true&w=majority&appName=mern-ecommerce`,
      {
        dbName: "mern-ecommerce",
      }
    )
    .then((c) => {
      console.log(`DB connected to ${c.connection.host}`);
    })
    .catch((error) => {
      console.log("Error connecting to MongoDB", error);
    });
};

export const invalidateCache = async ({
  product,
  order,
  admin,
  userId,
  orderId,
  productId,
}: InvalidateCacheProps) => {
  if (product) {
    const productKeys: string[] = [
      "latest-product",
      "admin-products",
      "categories",
    ];

    if (typeof productId === "string") {
      productKeys.push(`product-${productId}`);
    }
    if (typeof productId === "object") {
      productId.forEach((id) => {
        productKeys.push(`product-${id}`);
      });
    }
    await redis.del(productKeys);
    // myCache.del(productKeys);
  }
  if (order) {
    const orderKeys: string[] = [
      "all-orders",
      `my-orders-${userId}`,
      `order-${orderId}`,
    ];
    await redis.del(orderKeys);
    // myCache.del(orderKeys);
  }
  if (admin) {
    await redis.publish("admin-stats-sub", "update");
    await redis.del([
      "admin-stats",
      "admin-pie-charts",
      "admin-bar-charts",
      "admin-line-charts",
    ]);
    // myCache.del([
    //   "admin-stats",
    //   "admin-pie-charts",
    //   "admin-bar-charts",
    //   "admin-line-charts",
    // ]);
  }
};

export const reduceStock = async (orderItems: OrderItemType[]) => {
  for (let index = 0; index < orderItems.length; index++) {
    const orderItem = orderItems[index];
    const product = await Product.findById(orderItem.productId);
    if (!product) {
      throw new Error("Product not found");
    }
    product.stock = product.stock - orderItem.quantity;
    await product.save();
  }
};

export const calculatePercentage = (thisMonth: number, lastMonth: number) => {
  if (lastMonth === 0) {
    return thisMonth * 100;
  }
  const percent = (thisMonth / lastMonth) * 100;
  return Number(percent.toFixed(0));
};

export const getInventories = async ({
  categories,
  productsCount,
}: {
  categories: string[];
  productsCount: number;
}) => {
  const categoriesCountPromise = categories.map((category) =>
    Product.countDocuments({ category })
  );

  const categoriesCount = await Promise.all(categoriesCountPromise);

  const categoryCount: Record<string, number>[] = [];

  categories.forEach((category, i) => {
    categoryCount.push({
      [category]: Math.round((categoriesCount[i] / productsCount) * 100),
    });
  });

  return categoryCount;
};

interface MyDocument extends Document {
  createdAt: Date;
  discount?: number;
  total?: number;
}
type FuncProps = {
  length: number;
  docArr: MyDocument[];
  today: Date;
  property?: "discount" | "total";
};

export const getChartData = ({
  length,
  docArr,
  today,
  property,
}: FuncProps) => {
  const data: number[] = new Array(length).fill(0);

  docArr.forEach((i) => {
    const creationDate = i.createdAt;
    const monthDiff = (today.getMonth() - creationDate.getMonth() + 12) % 12;

    if (monthDiff < length) {
      if (property) {
        data[length - monthDiff - 1] += i[property]!;
      } else {
        data[length - monthDiff - 1] += 1;
      }
    }
  });

  return data;
};

export const create_embedding = async (description: string) => {
  const tf = require("@tensorflow/tfjs-core");
  const converter = require("@tensorflow/tfjs-converter");

  async function loadUSEModel() {
    const modelUrl =
      "https://tfhub.dev/google/universal-sentence-encoder/lite/model.tflite"; // Replace with appropriate URL
    const model = await converter.loadLiteModel(modelUrl);
    return model;
  }

  // console.log("creating embeding");
  // const extractor = await pipeline(
  //   "feature-extraction",
  //   "Xenova/bert-base-uncased",
  //   { revision: "default" }
  // );
  // const output = await extractor("This is a simple test.", {
  //   pooling: "mean",
  //   normalize: true,
  // });
  // // Tensor {
  // //   type: 'float32',
  // //   data: Float32Array [0.03373778983950615, -0.010106077417731285, ...],
  // //   dims: [1, 768]
  // // }

  // return output.data;
};
