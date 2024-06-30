import { TryCatch } from "../middlewares/error.js";
import ErrorHandler from "../utils/utility-class.js";
import { Product } from "../models/product.js";
import { rm } from "fs";
import dotenv from "dotenv";
import { redis } from "../app.js";
import { invalidateCache } from "../utils/features.js";
dotenv.config();
//GET ************************
export const getLatestProducts = TryCatch(async (req, res, next) => {
    let products;
    const isExists = await redis.exists("latest-product");
    if (isExists) {
        const data = await redis.get("latest-product");
        products = JSON.parse(data);
    }
    else {
        products = await Product.find({
            stock: { $gt: 0 },
        })
            .sort({ createdAt: -1 })
            .limit(5);
        await redis.set("latest-product", JSON.stringify(products));
    }
    return res.status(200).json({
        success: true,
        count: products.length,
        products,
    });
});
export const getCategories = TryCatch(async (req, res, next) => {
    let categories;
    const isExists = await redis.exists("categories");
    if (isExists) {
        const data = await redis.get("categories");
        categories = JSON.parse(data);
    }
    else {
        categories = await Product.distinct("category");
        await redis.set("categories", JSON.stringify(categories));
    }
    return res.status(200).json({
        success: true,
        count: categories.length,
        categories,
    });
});
export const getAdminProducts = TryCatch(async (req, res, next) => {
    let products;
    const isExists = await redis.exists("admin-products");
    if (isExists) {
        const data = await redis.get("admin-products");
        products = JSON.parse(data);
    }
    else {
        products = await Product.find({});
        await redis.set("admin-products", JSON.stringify(products));
    }
    return res.status(200).json({
        success: true,
        count: products.length,
        products,
    });
});
export const getSingleProduct = TryCatch(async (req, res, next) => {
    let product;
    const isExists = await redis.exists(`product-${req.params.id}`);
    if (isExists) {
        product = JSON.parse((await redis.get(`product-${req.params.id}`)));
    }
    else {
        product = await Product.findById(req.params.id);
        if (!product)
            return next(new ErrorHandler("Product not found", 404));
        await redis.set(`product-${req.params.id}`, JSON.stringify(product));
    }
    return res.status(200).json({
        success: true,
        product,
    });
});
export const getAllProducts = TryCatch(async (req, res, next) => {
    const { search, category, price, sort } = req.query;
    const page = Number(req.query.page) || 1;
    const limit = Number(process.env.PRODUCT_PER_PAGE) || 8;
    const skip = (page - 1) * limit;
    const baseQuery = {};
    if (search) {
        baseQuery.name = {
            $regex: search,
            $options: "i",
        };
    }
    if (category) {
        baseQuery.category = category;
    }
    if (price) {
        baseQuery.price = {
            $lte: Number(price),
        };
    }
    const [products, filteredOnlyProducts] = await Promise.all([
        Product.find(baseQuery)
            .sort(sort && { price: sort === "asc" ? 1 : -1 })
            .limit(limit)
            .skip(skip),
        Product.find(baseQuery),
    ]);
    const totalPages = Math.ceil(filteredOnlyProducts.length / limit);
    return res.status(200).json({
        success: true,
        totalPages,
        products,
    });
});
//POST ************************
export const newProduct = TryCatch(async (req, res, next) => {
    const { name, price, stock, category } = req.body;
    const photo = req.file;
    if (!photo)
        return next(new ErrorHandler("Please upload a photo", 400));
    if (!name || !price || !stock || !category) {
        rm(photo.path, () => {
            console.log("Photo deleted");
        });
        return next(new ErrorHandler("Please fill all fields", 400));
    }
    await Product.create({
        name,
        price,
        stock,
        category: category.toLowerCase(),
        photo: photo.path,
    });
    invalidateCache({ product: true, admin: true });
    return res.status(201).json({
        success: true,
        message: "Product created successfully",
    });
});
export const deleteProduct = TryCatch(async (req, res, next) => {
    const product = await Product.findById(req.params.id);
    if (!product)
        return next(new ErrorHandler("Product not found", 404));
    rm(product.photo, () => {
        console.log("Product Photo deleted");
    });
    await product.deleteOne();
    invalidateCache({
        product: true,
        productId: String(product._id),
        admin: true,
    });
    return res.status(200).json({
        success: true,
        message: "Product deleted successfully",
    });
});
export const updateProduct = TryCatch(async (req, res, next) => {
    let product = await Product.findById(req.params.id);
    if (!product)
        return next(new ErrorHandler("Product not found", 404));
    const { name, price, stock, category } = req.body;
    const photo = req.file;
    if (photo) {
        rm(product.photo, () => {
            console.log("Old Photo deleted");
        });
        product.photo = photo.path;
    }
    if (name)
        product.name = name;
    if (price)
        product.price = price;
    if (stock)
        product.stock = stock;
    if (category)
        product.category = category.toLowerCase();
    await product.save();
    invalidateCache({
        product: true,
        productId: String(product._id),
        admin: true,
    });
    return res.status(200).json({
        success: true,
        message: "Product updated successfully",
    });
});
