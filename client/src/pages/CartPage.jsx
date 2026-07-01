import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { useCart } from "@/components/cart-provider";
import { Button } from "@/components/ui/button";
import { Minus, Plus, Trash2, ArrowLeft, MapPin } from "lucide-react";
import { selectIsAuthenticated } from "@/redux/features/authSlice";
import { useAuthModal } from "@/components/auth-modal-provider";
import { useGetMeQuery } from "@/redux/services/authApi";
import {
  useCreateOrderMutation,
  useVerifyPaymentMutation,
} from "@/redux/services/paymentApi";

export default function CartPage() {
  const {
    cart,
    updateQuantity,
    removeFromCart,
    cartTotal,
    deliveryCharge,
    syncFromBackend,
  } = useCart();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const { openLogin } = useAuthModal();
  const navigate = useNavigate();

  const [createOrder, { isLoading: isCreating }] = useCreateOrderMutation();
  const [verifyPayment, { isLoading: isVerifying }] =
    useVerifyPaymentMutation();

  const { data: user } = useGetMeQuery(undefined, { skip: !isAuthenticated });
  const addresses = user?.Addresses || [];
  const [selectedAddressId, setSelectedAddressId] = useState("");

  useEffect(() => {
    if (addresses.length > 0 && !selectedAddressId) {
      setSelectedAddressId(addresses[0].id);
    }
  }, [addresses, selectedAddressId]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/");
      openLogin();
    }
  }, [isAuthenticated, navigate, openLogin]);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleCheckout = async () => {
    if (!selectedAddressId) {
      alert("Please select a delivery address");
      return;
    }

    const res = await loadRazorpayScript();
    if (!res) {
      alert("Razorpay SDK failed to load. Are you online?");
      return;
    }

    try {
      const orderData = await createOrder({
        totalAmount: cartTotal + (deliveryCharge || 0),
        addressId: selectedAddressId,
        items: cart.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
          price: item.product.price,
        })),
      }).unwrap();

      if (!orderData.success) {
        alert("Server error. Please try again");
        return;
      }

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: orderData.razorpayOrder.amount,
        currency: "INR",
        name: "Sami Foods",
        description: "Order Payment",
        order_id: orderData.razorpayOrder.id,
        handler: async function (response) {
          try {
            const verifyData = await verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }).unwrap();

            if (verifyData.success) {
              alert("Payment Successful!");
              await syncFromBackend(localStorage.getItem("token"));
              navigate("/orders");
            } else {
              alert("Payment Verification Failed");
            }
          } catch (err) {
            alert("Payment Verification Failed");
          }
        },
        prefill: {
          name: user?.name,
          email: user?.email,
          contact: user?.mobile,
        },
        theme: {
          color: "#0f172a", // Tailwind Slate 900
        },
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    }
  };
  return (
    <div className="min-h-screen pt-24 pb-12 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link
            to="/shop"
            className="inline-flex items-center text-primary hover:underline font-medium"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Continue Shopping
          </Link>
        </div>

        <h1 className="text-3xl font-bold text-foreground mb-8">Your Cart</h1>

        {cart.length === 0 ? (
          <div className="text-center py-16 bg-card rounded-3xl border border-border">
            <div className="w-24 h-24 mx-auto mb-6 bg-secondary rounded-full flex items-center justify-center">
              <svg
                className="w-10 h-10 text-muted-foreground"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold mb-2">Your cart is empty</h2>
            <p className="text-muted-foreground mb-6">
              Looks like you haven't added anything yet.
            </p>
            <Button asChild className="rounded-full px-8">
              <Link to="/shop">Start Shopping</Link>
            </Button>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {cart.map((item) => (
                <div
                  key={item.product.id}
                  className="flex flex-col sm:flex-row gap-4 bg-card p-4 rounded-2xl border border-border items-center"
                >
                  <div className="relative w-24 h-24 rounded-xl overflow-hidden shrink-0 bg-secondary">
                    {item.product.image ? (
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        loading="lazy"
                        decoding="async"
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-secondary" />
                    )}
                  </div>
                  <div className="flex-grow flex flex-col sm:flex-row sm:items-center justify-between w-full gap-4">
                    <div>
                      <h3 className="font-semibold text-lg">
                        {item.product.name || item.product.productName}
                      </h3>
                      <p className="text-primary font-bold">
                        ₹{(item?.product?.price ?? 0).toFixed(2)}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center bg-secondary rounded-full p-1 border border-border">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full hover:bg-background"
                          onClick={() =>
                            updateQuantity(item.product.id, item.quantity - 1)
                          }
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                        <span className="font-semibold w-8 text-center">
                          {item.quantity}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full hover:bg-background"
                          onClick={() =>
                            updateQuantity(item.product.id, item.quantity + 1)
                          }
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:bg-destructive/10 rounded-full"
                        onClick={() => removeFromCart(item.product.id)}
                      >
                        <Trash2 className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-card rounded-3xl p-6 border border-border h-fit">
              <h2 className="text-xl font-bold mb-4">Order Summary</h2>

              <div className="mb-6 pb-6 border-b border-border">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" /> Delivery Address
                </h3>
                {addresses.length === 0 ? (
                  <div className="text-sm text-muted-foreground p-3 border border-dashed rounded-xl text-center">
                    No saved addresses.
                    <Link
                      to="/profile"
                      className="text-primary font-medium block mt-1 hover:underline"
                    >
                      Add an address
                    </Link>
                  </div>
                ) : (
                  <select
                    className="w-full text-sm p-3 border border-border rounded-xl bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                    value={selectedAddressId}
                    onChange={(e) =>
                      setSelectedAddressId(Number(e.target.value))
                    }
                  >
                    <option value="">Select Delivery Address...</option>
                    {addresses.map((addr) => (
                      <option key={addr.id} value={addr.id}>
                        {addr.addressType} - {addr.name}, {addr.city} (
                        {addr.pinCode})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="space-y-3 text-sm mb-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">₹{cartTotal?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="font-medium">
                    {deliveryCharge === 0
                      ? "Free"
                      : `₹${deliveryCharge.toFixed(2)}`}
                  </span>
                </div>
              </div>
              <div className="border-t border-border pt-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="font-bold">Total</span>
                  <span className="font-bold text-xl text-primary">
                    ₹{(cartTotal + (deliveryCharge || 0))?.toFixed(2)}
                  </span>
                </div>
              </div>
              <Button
                className="w-full rounded-full"
                size="lg"
                onClick={handleCheckout}
              >
                Proceed to Checkout
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
