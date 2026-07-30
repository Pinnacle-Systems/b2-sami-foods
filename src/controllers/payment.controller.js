import {
  createOrderService,
  verifyPaymentService,
  getOrdersService,
  getAllOrdersAdminService,
  getOrderByIdAdminService,
  updateDeliveryStatusService,
  webhookService
} from '../services/payment.service.js';

export const createOrder = async (req, res) => {
  try {
    const { totalAmount, items, addressId } = req.body;
    const userId = req.user.id;

    const result = await createOrderService({ userId, totalAmount, items, addressId });

    res.status(200).json({
      success: true,
      order: result.order,
      razorpayOrder: result.razorpayOrder
    });
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(error.status || 500).json({ success: false, message: error.message || "Internal server error" });
  }
};

export const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    await verifyPaymentService({ razorpay_order_id, razorpay_payment_id, razorpay_signature });

    res.status(200).json({ success: true, message: "Payment verified successfully" });
  } catch (error) {
    console.error("Error verifying payment:", error);
    res.status(error.status || 500).json({ success: false, message: error.message || "Internal server error" });
  }
};

export const getOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const orders = await getOrdersService(userId);
    
    res.status(200).json({ success: true, orders });
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(error.status || 500).json({ success: false, message: error.message || "Internal server error" });
  }
};

export const webhook = async (req, res) => {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const signature = req.headers['x-razorpay-signature'];
    
    const result = await webhookService({ signature, body: req.body, secret });
    if (result === "Webhook secret not configured") {
       return res.status(200).send(result);
    }

    res.status(200).json({ status: 'ok' });
  } catch (error) {
    console.error("Webhook error:", error);
    res.status(error.status || 500).json({ status: 'error', message: error.message || 'Internal server error' });
  }
};

export const getAllOrdersAdmin = async (req, res) => {
  try {
    const result = await getAllOrdersAdminService(req.query);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    console.error("Error fetching all orders admin:", error);
    res.status(error.status || 500).json({ success: false, message: error.message || "Internal server error" });
  }
};

export const getOrderByIdAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await getOrderByIdAdminService(id);
    res.status(200).json({ success: true, order });
  } catch (error) {
    console.error("Error fetching single order admin:", error);
    res.status(error.status || 500).json({ success: false, message: error.message || "Internal server error" });
  }
};

export const updateDeliveryStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { deliveryStatus } = req.body;
    
    const updatedOrder = await updateDeliveryStatusService({ id, deliveryStatus });
    
    res.status(200).json({ success: true, order: updatedOrder });
  } catch (error) {
    console.error("Error updating delivery status:", error);
    res.status(error.status || 500).json({ success: false, message: error.message || "Internal server error" });
  }
};
