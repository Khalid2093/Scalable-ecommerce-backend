import { TryCatch } from "../middlewares/error.js";
import { Order } from "../models/order.js";
import { invalidateCache, reduceStock } from "../utils/features.js";
import ErrorHandler from "../utils/utility-class.js";
import { redis } from "../app.js";
//GET****************************************************
export const myOrders = TryCatch(async (req, res, next) => {
    const { id } = req.query;
    let orders;
    const key = `my-orders-${id}`;
    if (await redis.exists(key)) {
        orders = JSON.parse((await redis.get(key)));
    }
    else {
        orders = await Order.find({ user: id });
        await redis.set(key, JSON.stringify(orders));
    }
    res.status(200).json({
        success: true,
        orders,
    });
});
export const allOrders = TryCatch(async (req, res, next) => {
    const key = `all-orders`;
    let orders;
    if (await redis.exists(key)) {
        orders = JSON.parse((await redis.get(key)));
    }
    else {
        orders = await Order.find().populate("user", "name");
        await redis.set(key, JSON.stringify(orders));
    }
    res.status(200).json({
        success: true,
        orders,
    });
});
export const getSingleOrder = TryCatch(async (req, res, next) => {
    const key = `order-${req.params.id}`;
    let order;
    if (await redis.exists(key)) {
        order = JSON.parse((await redis.get(key)));
    }
    else {
        order = await Order.findById(req.params.id).populate("user", "name");
        await redis.set(key, JSON.stringify(order));
    }
    if (!order) {
        return next(new ErrorHandler("Order not found with this ID", 404));
    }
    res.status(200).json({
        success: true,
        order,
    });
});
//POST****************************************************
export const newOrder = TryCatch(async (req, res, next) => {
    const { orderItems, shippingInfo, user, subtotal, tax, shippingCharges, discount, total, } = req.body;
    if (!shippingInfo || !orderItems || !subtotal || !tax || !total || !user) {
        return next(new ErrorHandler("Please provide all required fields", 400));
    }
    const order = await Order.create({
        orderItems,
        shippingInfo,
        user,
        subtotal,
        tax,
        shippingCharges,
        discount,
        total,
    });
    await Promise.all([reduceStock(orderItems)]);
    invalidateCache({
        order: true,
        product: true,
        admin: true,
        userId: user,
        productId: order.orderItems.map((item) => String(item.productId)),
    }),
        res.status(201).json({
            success: true,
            message: "Order placed successfully",
        });
});
//PUT****************************************************
export const processOrder = TryCatch(async (req, res, next) => {
    const order = await Order.findById(req.params.id);
    if (!order) {
        return next(new ErrorHandler("Order not found with this ID", 404));
    }
    switch (order.status) {
        case "Processing":
            order.status = "Shipped";
            break;
        case "Shipped":
            order.status = "Delivered";
            break;
        default:
            order.status = "Delivered";
            break;
    }
    await order.save();
    invalidateCache({
        order: true,
        product: false,
        admin: true,
        userId: order.user,
        orderId: String(order._id),
    });
    res.status(200).json({
        success: true,
        message: "Order status updated",
    });
});
//DELETE****************************************************
export const deleteOrder = TryCatch(async (req, res, next) => {
    const order = await Order.findById(req.params.id);
    if (!order) {
        return next(new ErrorHandler("Order not found with this ID", 404));
    }
    await order.deleteOne();
    invalidateCache({
        order: true,
        product: false,
        admin: true,
        userId: order.user,
        orderId: String(order._id),
    });
    res.status(200).json({
        success: true,
        message: "Order deleted successfully",
    });
});
