import { useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { selectIsAuthenticated } from "@/redux/features/authSlice";
import { useAuthModal } from "@/components/auth-modal-provider";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Package,
  CheckCircle2,
  Clock,
  XCircle,
  Truck,
} from "lucide-react";
import { useGetOrdersQuery, useVerifyPaymentMutation } from "@/redux/services/paymentApi";
import { useGetMeQuery } from "@/redux/services/authApi";

export default function OrdersPage() {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const { openLogin } = useAuthModal();
  const navigate = useNavigate();

  const { data, isLoading, refetch } = useGetOrdersQuery(undefined, {
    skip: !isAuthenticated,
  });

  const [verifyPayment, { isLoading: isVerifying }] = useVerifyPaymentMutation();
  const { data: user } = useGetMeQuery(undefined, { skip: !isAuthenticated });

  const orders = data?.orders || [];

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

  const handleRetryPayment = async (order) => {
    const res = await loadRazorpayScript();
    if (!res) {
      alert("Razorpay SDK failed to load. Are you online?");
      return;
    }

    try {
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        name: "Sami Foods",
        description: "Retry Order Payment",
        order_id: order.razorpayOrderId,
        handler: async function (response) {
          try {
            const verifyData = await verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }).unwrap();

            if (verifyData.success || verifyData === true) {
              alert("Payment Successful!");
              refetch();
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
          color: "#0f172a",
        },
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "PAID":
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case "FAILED":
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-orange-500" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen pt-24 flex justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-12 bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link
            to="/shop"
            className="inline-flex items-center text-primary hover:underline font-medium"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Shop
          </Link>
        </div>

        <h1 className="text-3xl font-bold text-foreground mb-8">Your Orders</h1>

        {orders.length === 0 ? (
          <div className="text-center py-16 bg-card rounded-3xl border border-border">
            <div className="w-24 h-24 mx-auto mb-6 bg-secondary rounded-full flex items-center justify-center">
              <Package className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-semibold mb-2">No orders yet</h2>
            <p className="text-muted-foreground mb-6">
              You haven't placed any orders.
            </p>
            <Button asChild className="rounded-full px-8">
              <Link to="/shop">Start Shopping</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-card rounded-2xl border border-border p-6 shadow-sm"
              >
                <div className="flex flex-wrap justify-between items-center border-b border-border pb-4 mb-4 gap-4">
                  <div>
                    <p className="text-sm ">
                      Order Placed Date : {/* Order #{order.id} •{" "} */}
                      {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                    <p className="text-xs  mt-1 font-mono">
                      Txn: {order.razorpayPaymentId || order.razorpayOrderId}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex items-center gap-2 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200 px-3 py-1.5 rounded-full">
                      <Truck className="w-4 h-4" />
                      <span className="text-sm font-semibold">
                        {order.deliveryStatus || "Order Placed"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 bg-secondary/50 px-3 py-1.5 rounded-full">
                      {getStatusIcon(order.status)}
                      <span className="text-sm font-semibold">
                        {order.status}
                      </span>
                    </div>
                  </div>
                </div>
                
                {order.status !== "PAID" && (
                  <div className="mb-4 flex justify-end">
                    <Button 
                      onClick={() => handleRetryPayment(order)}
                      disabled={isVerifying}
                      className="w-full sm:w-auto"
                    >
                      Retry Payment
                    </Button>
                  </div>
                )}

                <div className="space-y-4">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-xl bg-secondary overflow-hidden shrink-0 relative">
                        {item.product.productImage ? (
                          <img
                            src={
                              item.product.productImage.startsWith("http")
                                ? item.product.productImage
                                : `/${item.product.productImage}`
                            }
                            alt={item.product.productName}
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                        ) : (
                          <Package className="w-6 h-6 m-auto text-muted-foreground absolute inset-0" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-foreground">
                          {item.product.productName}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          Qty: {item.quantity} × ₹{item.price.toFixed(2)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-foreground">
                          ₹{(item.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-border mt-4 pt-4 space-y-2">
                  <div className="flex justify-between items-center text-sm text-muted-foreground">
                    <span>Subtotal</span>
                    <span>
                      ₹
                      {order.items
                        .reduce(
                          (sum, item) => sum + item.price * item.quantity,
                          0,
                        )
                        .toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm text-muted-foreground">
                    <span>Delivery Charge</span>
                    <span>
                      ₹
                      {(
                        order.totalAmount -
                        order.items.reduce(
                          (sum, item) => sum + item.price * item.quantity,
                          0,
                        )
                      ).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-border">
                    <span className="font-semibold text-foreground">
                      Total Amount
                    </span>
                    <span className="text-xl font-bold text-primary">
                      ₹{order.totalAmount.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
