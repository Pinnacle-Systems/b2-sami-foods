import { Router } from 'express';
import { createOrder, verifyPayment, getOrders, webhook, getAllOrdersAdmin, getOrderByIdAdmin, updateDeliveryStatus } from '../controllers/payment.controller.js';
import auth from '../middleware/auth.js';
import adminAuth from '../middleware/adminAuth.js';

const router = Router();

router.post('/create-order', auth, createOrder);
router.post('/verify', auth, verifyPayment);
router.get('/orders', auth, getOrders);
router.post('/webhook', webhook); // No auth, verified by signature

// Admin routes
router.get('/admin/orders', adminAuth, getAllOrdersAdmin);
router.get('/admin/orders/:id', adminAuth, getOrderByIdAdmin);
router.put('/admin/orders/:id/delivery', adminAuth, updateDeliveryStatus);

export default router;
