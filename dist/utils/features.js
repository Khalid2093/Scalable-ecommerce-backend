import mongoose from "mongoose";
import { Product } from "../models/product.js";
import { redis } from "../app.js";
export const connectDB = (username, pass) => {
    mongoose
        .connect(`mongodb+srv://${username}:${pass}@mern-ecommerce.07rxrbw.mongodb.net/?retryWrites=true&w=majority&appName=mern-ecommerce`, {
        dbName: "mern-ecommerce",
    })
        .then((c) => {
        console.log(`DB connected to ${c.connection.host}`);
    })
        .catch((error) => {
        console.log("Error connecting to MongoDB", error);
    });
};
export const invalidateCache = ({ product, order, admin, userId, orderId, productId, }) => {
    if (product) {
        const productKeys = [
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
        redis.del(productKeys);
        // myCache.del(productKeys);
    }
    if (order) {
        const orderKeys = [
            "all-orders",
            `my-orders-${userId}`,
            `order-${orderId}`,
        ];
        redis.del(orderKeys);
        // myCache.del(orderKeys);
    }
    if (admin) {
        redis.del([
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
export const reduceStock = async (orderItems) => {
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
export const calculatePercentage = (thisMonth, lastMonth) => {
    if (lastMonth === 0) {
        return thisMonth * 100;
    }
    const percent = (thisMonth / lastMonth) * 100;
    return Number(percent.toFixed(0));
};
export const getInventories = async ({ categories, productsCount, }) => {
    const categoriesCountPromise = categories.map((category) => Product.countDocuments({ category }));
    const categoriesCount = await Promise.all(categoriesCountPromise);
    const categoryCount = [];
    categories.forEach((category, i) => {
        categoryCount.push({
            [category]: Math.round((categoriesCount[i] / productsCount) * 100),
        });
    });
    return categoryCount;
};
export const getChartData = ({ length, docArr, today, property, }) => {
    const data = new Array(length).fill(0);
    docArr.forEach((i) => {
        const creationDate = i.createdAt;
        const monthDiff = (today.getMonth() - creationDate.getMonth() + 12) % 12;
        if (monthDiff < length) {
            if (property) {
                data[length - monthDiff - 1] += i[property];
            }
            else {
                data[length - monthDiff - 1] += 1;
            }
        }
    });
    return data;
};
