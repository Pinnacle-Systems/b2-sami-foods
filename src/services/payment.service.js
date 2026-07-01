import Razorpay from "razorpay";
import crypto from "crypto";
import prisma from "../config/db.js";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export const createOrderService = async ({ userId, items, addressId }) => {
  // Fetch products from database to calculate true prices securely
  const productIds = items.map((item) => item.productId);
  const products = await prisma.productMaster.findMany({
    where: { id: { in: productIds } },
    include: { priceRange: true },
  });

  let calculatedItemTotal = 0;
  let calculatedDelivery = 0;

  const validatedItems = items.map((item) => {
    const product = products.find((p) => p.id === item.productId);
    if (!product) throw new Error(`Product ID ${item.productId} not found`);

    const truePrice = product.productPrice ?? product.originalPrice ?? 0;
    calculatedItemTotal += truePrice * item.quantity;

    // Delivery charge calculation matching frontend logic
    const baseQty = parseFloat(product.productqty) || 0;
    const totalQty = baseQty * item.quantity;
    let chargeForProduct = 0;

    if (product.priceRange && Array.isArray(product.priceRange)) {
      for (const tier of product.priceRange) {
        const from = parseFloat(tier.fromQty);
        const to = parseFloat(tier.toQty);
        if (!isNaN(from) && !isNaN(to) && totalQty >= from && totalQty <= to) {
          chargeForProduct = parseFloat(tier.price) || 0;
          break;
        }
      }
    }
    calculatedDelivery += chargeForProduct;

    return {
      productId: item.productId,
      quantity: item.quantity,
      weightQty: Math.round(totalQty),
      price: truePrice,
    };
  });

  const finalAmount = calculatedItemTotal + calculatedDelivery;

  // Create order in Razorpay
  const options = {
    amount: Math.round(finalAmount * 100), // amount in the smallest currency unit
    currency: "INR",
    receipt: `receipt_${Date.now()}`,
  };

  const razorpayOrder = await razorpay.orders.create(options);

  // Save order in our database securely, with robust unique orderNo generation
  let newOrder;
  let attempts = 0;
  while (attempts < 5) {
    try {
      // Option 3: Short Alphanumeric but highly numeric (e.g., #B2-84729103)
      const randomInt = Math.floor(10000000 + Math.random() * 90000000);
      const generatedOrderNo = `B2-${randomInt}`;

      newOrder = await prisma.order.create({
        data: {
          userId,
          orderNo: generatedOrderNo,
          totalAmount: finalAmount,
          addressId: addressId ? Number(addressId) : null,
          razorpayOrderId: razorpayOrder.id,
          items: {
            create: validatedItems,
          },
        },
      });
      break; // Successfully inserted, break the loop
    } catch (error) {
      // P2002 is Prisma's error code for Unique constraint failed
      if (error.code === "P2002" && error.meta?.target?.includes("orderNo")) {
        attempts++;
        if (attempts >= 5) {
          throw new Error(
            "Failed to generate a unique order  due to high traffic. Please try again.",
          );
        }
        // If collision happened, we silently loop and retry with a new randomInt
      } else {
        throw error; // Throw any other unexpected database error
      }
    }
  }

  return { order: newOrder, razorpayOrder };
};

export const verifyPaymentService = async ({
  razorpay_order_id,
  razorpay_payment_id,
  razorpay_signature,
}) => {
  const body = razorpay_order_id + "|" + razorpay_payment_id;

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body.toString())
    .digest("hex");

  const isAuthentic = expectedSignature === razorpay_signature;

  if (isAuthentic) {
    // Payment is successful
    const updatedOrder = await prisma.order.update({
      where: { razorpayOrderId: razorpay_order_id },
      data: {
        status: "PAID",
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
      },
    });

    // Clear the user's cart
    const cart = await prisma.cart.findUnique({
      where: { userId: updatedOrder.userId },
    });

    if (cart) {
      await prisma.cartItem.deleteMany({
        where: { cartId: cart.id },
      });
    }

    return true;
  } else {
    throw Object.assign(new Error("Invalid signature"), { status: 400 });
  }
};

export const getOrdersService = async (userId) => {
  const orders = await prisma.order.findMany({
    where: { userId },
    include: {
      items: {
        include: {
          product: {
            select: { productName: true, productImage: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
  return orders;
};

export const getAllOrdersAdminService = async (filters = {}) => {
  const { orderNo, customerName, email, mobile, status } = filters;

  const where = {};

  if (orderNo) {
    where.id = Number(orderNo);
  }
  if (status) {
    where.deliveryStatus = status;
  }

  if (customerName || email || mobile) {
    where.user = {};
    if (customerName) {
      where.user.name = { contains: customerName, mode: "insensitive" };
    }
    if (email) {
      where.user.email = { contains: email, mode: "insensitive" };
    }
    if (mobile) {
      where.user.mobile = { contains: mobile };
    }
  }

  const orders = await prisma.order.findMany({
    where,
    include: {
      user: { select: { name: true, email: true, mobile: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return orders;
};

export const getOrderByIdAdminService = async (id) => {
  const order = await prisma.order.findUnique({
    where: { id: Number(id) },
    include: {
      user: { select: { name: true, email: true, mobile: true } },
      address: true,
      items: {
        include: {
          product: {
            select: { productName: true, productImage: true, productUom: true },
          },
        },
      },
    },
  });
  if (!order)
    throw Object.assign(new Error("Order not found"), { status: 404 });
  return order;
};

export const updateDeliveryStatusService = async ({ id, deliveryStatus }) => {
  if (!deliveryStatus) {
    throw Object.assign(new Error("deliveryStatus is required"), {
      status: 400,
    });
  }

  const updatedOrder = await prisma.order.update({
    where: { id: Number(id) },
    data: { deliveryStatus },
  });

  return updatedOrder;
};

export const webhookService = async ({ signature, body, secret }) => {
  if (!secret) return "Webhook secret not configured";

  const shasum = crypto.createHmac("sha256", secret);
  shasum.update(JSON.stringify(body));
  const digest = shasum.digest("hex");

  if (digest === signature) {
    const event = body.event;
    if (event === "payment.captured" || event === "order.paid") {
      const paymentEntity = body.payload.payment.entity;
      const razorpayOrderId = paymentEntity.order_id;
      const razorpayPaymentId = paymentEntity.id;

      const order = await prisma.order.findUnique({
        where: { razorpayOrderId },
      });
      if (order && order.status !== "PAID") {
        await prisma.order.update({
          where: { razorpayOrderId },
          data: {
            status: "PAID",
            razorpayPaymentId,
          },
        });

        // Clear cart
        const cart = await prisma.cart.findUnique({
          where: { userId: order.userId },
        });

        if (cart) {
          await prisma.cartItem.deleteMany({
            where: { cartId: cart.id },
          });
        }
      }
    }
    return "ok";
  } else {
    throw Object.assign(new Error("Invalid signature"), { status: 400 });
  }
};
