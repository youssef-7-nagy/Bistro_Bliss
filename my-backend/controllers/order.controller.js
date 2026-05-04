const Stripe = require("stripe");
const { Order } = require("../models/Order");
const { Product } = require("../models/Product");
const { User } = require("../models/User");

function getStripeClient() {
  const key = String(process.env.STRIPE_SECRET_KEY || "")
    .trim()
    .replace(/^["']|["']$/g, "");

  if (!key || !key.startsWith("sk_") || key.includes("your_stripe_secret_key")) {
    return null;
  }

  return new Stripe(key);
}

function createHttpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function calculateRewardAdjustedTotal(orderItems, activeReward) {
  let totalAmount = orderItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  let rewardConsumed = false;

  if (activeReward === "FREE_MOLTEN_CAKE") {
    const cakeItem = orderItems.find((item) =>
      item.title.toLowerCase().includes("molten lava cake")
    );
    if (cakeItem) {
      totalAmount -= cakeItem.price;
      rewardConsumed = true;
    }
  } else if (activeReward === "FREE_PEPPERONI_PIZZA") {
    const pizzaItem = orderItems.find((item) =>
      item.title.toLowerCase().includes("pepperoni")
    );
    if (pizzaItem) {
      totalAmount -= pizzaItem.price;
      rewardConsumed = true;
    }
  } else if (activeReward === "DISCOUNT_20") {
    totalAmount *= 0.8;
    rewardConsumed = true;
  }

  return {
    totalAmount: Math.max(0, totalAmount),
    rewardConsumed,
  };
}

async function buildOrderItems(items) {
  if (!Array.isArray(items) || items.length === 0) {
    throw createHttpError(400, "No items found.");
  }

  const orderItems = [];

  for (const item of items) {
    const productId = item.product || item._id;
    const quantity = Number(item.quantity);
    const specialInstructions = String(item.specialInstructions || "").trim().slice(0, 200);

    if (!productId || !Number.isFinite(quantity) || quantity <= 0) {
      throw createHttpError(400, "Invalid item data.");
    }

    const product = await Product.findById(productId);
    if (!product) {
      throw createHttpError(404, "Product not found.");
    }

    orderItems.push({
      product: product._id,
      title: product.title,
      image: product.images?.[0],
      category: product.category,
      quantity,
      price: product.price,
      specialInstructions,
    });
  }

  return orderItems;
}

async function createPaymentIntent(request, response) {
  try {
    const stripe = getStripeClient();
    if (!stripe) {
      return response.status(500).json({
        message: "Stripe is not configured. Add STRIPE_SECRET_KEY in backend .env.",
      });
    }

    const userId = request.user.id;
    const { items } = request.body || {};

    const currentUser = await User.findById(userId);
    if (!currentUser) {
      return response.status(404).json({ message: "User not found." });
    }

    const orderItems = await buildOrderItems(items);
    const { totalAmount } = calculateRewardAdjustedTotal(
      orderItems,
      currentUser.activeReward
    );

    if (totalAmount <= 0) {
      return response.status(400).json({
        message: "This order total is 0, no card payment is required.",
      });
    }

    const amountInPiasters = Math.round(totalAmount * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInPiasters,
      currency: "egp",
      automatic_payment_methods: { enabled: true },
      metadata: {
        userId: String(userId),
      },
    });

    return response.status(200).json({
      message: "Payment intent created.",
      data: {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        amount: totalAmount,
        amountInPiasters,
        currency: paymentIntent.currency,
      },
    });
  } catch (error) {
    if (error?.status) {
      return response.status(error.status).json({ message: error.message });
    }
    console.log("Create Payment Intent Error:", error);
    return response.status(500).json({ message: "Internal server error" });
  }
}

async function createOrder(request, response) {
  try {
    const { items, paymentMethod = "cash", paymentIntentId } = request.body || {};
    const userId = request.user.id;
    const normalizedPaymentMethod = String(paymentMethod).toLowerCase();
    let resolvedPaymentStatus = "pending";

    if (!["cash", "visa"].includes(normalizedPaymentMethod)) {
      return response
        .status(400)
        .json({ message: "Invalid payment method. Use cash or visa." });
    }

    const currentUser = await User.findById(userId);
    if (!currentUser) {
      return response.status(404).json({ message: "User not found." });
    }

    const orderItems = await buildOrderItems(items);
    const { totalAmount, rewardConsumed } = calculateRewardAdjustedTotal(
      orderItems,
      currentUser.activeReward
    );

    if (normalizedPaymentMethod === "visa" && totalAmount > 0) {
      // Gateway mode: validate Stripe payment intent if provided.
      // Fallback mode: if no paymentIntentId, accept order and keep payment pending.
      if (paymentIntentId) {
        const stripe = getStripeClient();
        if (!stripe) {
          return response.status(500).json({
            message: "Stripe is not configured. Add STRIPE_SECRET_KEY in backend .env.",
          });
        }

        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

        if (!paymentIntent || paymentIntent.status !== "succeeded") {
          return response.status(400).json({
            message: "Visa payment is not completed.",
          });
        }

        if (String(paymentIntent.metadata?.userId || "") !== String(userId)) {
          return response.status(403).json({
            message: "Payment intent does not belong to this user.",
          });
        }

        if (paymentIntent.currency !== "egp") {
          return response.status(400).json({
            message: "Unexpected payment currency.",
          });
        }

        const expectedAmount = Math.round(totalAmount * 100);
        const paidAmount = paymentIntent.amount_received || paymentIntent.amount || 0;

        if (paidAmount < expectedAmount) {
          return response.status(400).json({
            message: "Paid amount does not match order total.",
          });
        }

        resolvedPaymentStatus = "paid";
      }
    } else if (normalizedPaymentMethod === "visa" && totalAmount <= 0) {
      resolvedPaymentStatus = "paid";
    }

    if (rewardConsumed) {
      currentUser.activeReward = null;
    }

    const newOrder = await Order.create({
      user: userId,
      userName: currentUser.name,
      items: orderItems,
      totalAmount,
      paymentMethod: normalizedPaymentMethod,
      paymentStatus: resolvedPaymentStatus,
      paymentIntentId: paymentIntentId || null,
    });

    const pointsEarned = 5;
    currentUser.points = (currentUser.points || 0) + pointsEarned;
    await currentUser.save();

    return response.status(201).json({
      message: `Order created successfully! You earned ${pointsEarned} points.`,
      data: {
        order: newOrder,
        pointsEarned,
        activeReward: currentUser.activeReward,
      },
    });
  } catch (error) {
    if (error?.status) {
      return response.status(error.status).json({ message: error.message });
    }
    console.log("Create Order Error:", error);
    return response.status(500).json({ message: "Internal server error" });
  }
}

async function getUserOrders(request, response) {
  try {
    const userId = request.user.id;
    const orders = await Order.find({ user: userId }).sort({ createdAt: -1 });
    response.json({ message: "User orders fetched", data: orders });
  } catch (error) {
    console.log("Get Orders Error:", error);
    response.status(500).json({ message: "Internal server error" });
  }
}

async function getAllOrders(req, res) {
  try {
    const orders = await Order.find()
      .populate("user", "name email")
      .sort({ createdAt: -1 });
    res.json({ message: "All Orders", data: orders });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
}

async function updateOrderStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(id, { status }, { new: true });
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json({ message: "Order status updated", data: order });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
}

module.exports = {
  createOrder,
  createPaymentIntent,
  getUserOrders,
  getAllOrders,
  updateOrderStatus,
};
