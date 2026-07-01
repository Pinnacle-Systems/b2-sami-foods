import { useState, useEffect } from "react";
import {
  Package,
  Search,
  ChevronDown,
  CheckCircle2,
  XCircle,
  Clock,
  Truck,
  MapPin,
  Phone,
  User,
  ArrowLeft,
  Printer,
} from "lucide-react";
import {
  useGetAllOrdersAdminQuery,
  useGetOneOrderAdminQuery,
  useUpdateDeliveryStatusMutation,
} from "@/redux/services/paymentApi";
import { X } from "lucide-react";
import { PDFDownloadLink, PDFViewer } from "@react-pdf/renderer";
import InvoicePDF from "@/components/InvoicePDF";

const DELIVERY_STATUSES = [
  "Order Placed",
  "Processing",
  "Shipped",
  "Delivered",
];

const getPaymentStatusColor = (status) => {
  switch (status) {
    case "PAID":
      return "text-green-600 bg-green-100";
    case "FAILED":
      return "text-red-600 bg-red-100";
    default:
      return "text-orange-600 bg-orange-100";
  }
};

function OrderDetailsView({ orderId, onBack }) {
  const [showPreview, setShowPreview] = useState(false);
  const { data, isLoading } = useGetOneOrderAdminQuery(orderId);
  const [updateStatus, { isLoading: isUpdating }] =
    useUpdateDeliveryStatusMutation();

  if (isLoading) {
    return (
      <div className="p-12 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const order = data?.order;
  if (!order) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Order details could not be loaded.{" "}
        <button onClick={onBack} className="text-primary underline">
          Go back
        </button>
      </div>
    );
  }

  const handleStatusChange = async (id, newStatus) => {
    try {
      await updateStatus({ id, deliveryStatus: newStatus }).unwrap();
    } catch (err) {
      alert("Failed to update status");
    }
  };

  const subtotal = order.items?.reduce((acc, item) => acc + item.price * item.quantity, 0) || 0;
  const deliveryCharge = order.totalAmount - subtotal;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Orders
        </button>
        <button
          onClick={() => setShowPreview(true)}
          className="flex items-center gap-2 text-sm bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90"
        >
          <Printer className="w-4 h-4" /> Print / Preview Invoice
        </button>
      </div>

      {showPreview && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-5xl h-[90vh] rounded-xl shadow-xl flex flex-col border border-border overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-border bg-muted/30">
              <h3 className="font-semibold">Invoice Preview</h3>
              <button 
                onClick={() => setShowPreview(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 w-full bg-muted/10">
              <PDFViewer width="100%" height="100%" className="border-none">
                <InvoicePDF order={order} />
              </PDFViewer>
            </div>
          </div>
        </div>
      )}

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col md:flex-row">
        {/* Order Info & Items */}
        <div className="p-6 flex-1 border-b md:border-b-0 md:border-r border-border">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="font-bold text-lg">Order #{order.id}</h3>
              <p className="text-sm text-muted-foreground">
                {new Date(order.createdAt).toLocaleString()}
              </p>
              <div className="mt-1 flex items-center gap-2">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${getPaymentStatusColor(order.status)}`}
                >
                  Payment: {order.status}
                </span>
                {order.razorpayPaymentId && (
                  <span className="text-xs text-muted-foreground font-mono">
                    Txn: {order.razorpayPaymentId}
                  </span>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Total Amount</p>
              <p className="font-bold text-xl text-primary">
                ₹{order.totalAmount.toFixed(2)}
              </p>
            </div>
          </div>

          <div className="space-y-3 mt-6 border-b border-border pb-4">
            <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider">
              Items Purchased
            </h4>
            {order.items?.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 bg-muted/50 p-2 rounded-lg"
              >
                <div className="w-10 h-10 rounded bg-secondary overflow-hidden shrink-0">
                  {item.product.productImage ? (
                    <img
                      src={
                        item.product.productImage.startsWith("http")
                          ? item.product.productImage
                          : `/${item.product.productImage}`
                      }
                      alt={item.product.productName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Package className="w-5 h-5 m-auto text-muted-foreground mt-2.5" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {item.product.productName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Qty: {item.quantity} × ₹{item.price.toFixed(2)}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold text-foreground">
                    ₹{(item.price * item.quantity).toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 space-y-2 max-w-sm ml-auto text-sm pr-2">
            <div className="flex justify-between items-center text-muted-foreground">
              <span>Subtotal</span>
              <span className="font-medium text-foreground">
                ₹
                {(order.items || [])
                  .reduce((sum, item) => sum + item.price * item.quantity, 0)
                  .toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center text-muted-foreground">
              <span>Delivery Charge</span>
              <span className="font-medium text-foreground">
                ₹
                {(
                  order.totalAmount -
                  (order.items || []).reduce(
                    (sum, item) => sum + item.price * item.quantity,
                    0,
                  )
                ).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Customer & Tracking */}
        <div className="p-6 w-full md:w-80 shrink-0 bg-muted/10 flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">
              Customer Details
            </h4>

            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <User className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-foreground">
                    {order.user?.name || "Guest"}
                  </p>
                  <p className="text-muted-foreground">{order.user?.email}</p>
                </div>
              </div>

              {order.address ? (
                <>
                  <div className="flex items-start gap-3">
                    <Phone className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                    <p className="text-foreground">{order.address.mobile}</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                    <p className="text-muted-foreground">
                      {order.address.address}, {order.address.city},<br />
                      {order.address.state} - {order.address.pinCode}
                    </p>
                  </div>
                </>
              ) : (
                <p className="text-xs text-orange-500 italic">
                  No delivery address provided.
                </p>
              )}
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-border">
            <h4 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-3">
              Update Tracking
            </h4>
            <div className="relative">
              <select
                className="w-full appearance-none bg-card border border-border rounded-lg px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-primary focus:border-transparent outline-none cursor-pointer"
                value={order.deliveryStatus}
                onChange={(e) => handleStatusChange(order.id, e.target.value)}
                disabled={isUpdating}
              >
                {DELIVERY_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground" />
            </div>

            {/* Visual Tracker Mini */}
            <div className="mt-5 px-2">
              <div className="relative">
                {/* Background Line */}
                <div className="absolute top-1/2 left-0 right-0 h-1 bg-border -translate-y-1/2 rounded"></div>

                {/* Filled Line */}
                {(() => {
                  const currentIndex = Math.max(
                    0,
                    DELIVERY_STATUSES.indexOf(order.deliveryStatus),
                  );
                  const percentage =
                    (currentIndex / (DELIVERY_STATUSES.length - 1)) * 100;
                  return (
                    <div
                      className="absolute top-1/2 left-0 h-1 bg-primary -translate-y-1/2 rounded transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  );
                })()}

                {/* Dots */}
                <div className="flex justify-between relative z-10">
                  {DELIVERY_STATUSES.map((status, index) => {
                    const currentIndex = Math.max(
                      0,
                      DELIVERY_STATUSES.indexOf(order.deliveryStatus),
                    );
                    const isCompleted = index <= currentIndex;
                    const isActive = index === currentIndex;

                    return (
                      <div
                        key={status}
                        className={`w-3.5 h-3.5 rounded-full border-[3px] ${isCompleted ? "bg-card border-primary" : "bg-card border-border"} ${isActive ? "scale-125 ring-2 ring-primary/20" : ""} transition-all duration-300`}
                        title={status}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="flex justify-between mt-1 px-1">
              <span className="text-[10px] text-muted-foreground">Placed</span>
              <span className="text-[10px] text-muted-foreground">
                Delivered
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminOrdersPage() {
  const [filters, setFilters] = useState({
    orderNo: "",
    customerName: "",
    email: "",
    mobile: "",
    status: "",
  });
  const [debouncedFilters, setDebouncedFilters] = useState(filters);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilters(filters);
    }, 500);
    return () => clearTimeout(timer);
  }, [filters]);

  const { data, isLoading, isFetching } =
    useGetAllOrdersAdminQuery(debouncedFilters);
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  const filteredOrders = data?.orders || [];

  if (isLoading) {
    return (
      <div className="p-8 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (selectedOrderId) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Order Details</h2>
          <p className="text-muted-foreground text-sm">
            View order information and manage delivery
          </p>
        </div>
        <OrderDetailsView
          orderId={selectedOrderId}
          onBack={() => setSelectedOrderId(null)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            Orders Tracking
          </h2>
          <p className="text-muted-foreground text-sm">
            Manage customer orders and update delivery status
          </p>
        </div>
      </div>

      {/* ── Filter Bar ── */}
      <div className="pcm-search-row flex-wrap gap-3 overflow-x-auto">
        <div className="flex items-center gap-2">
          <div className="pcm-search-wrap w-24 px-2">
            <input
              className="pcm-search-input"
              placeholder="Order No"
              value={filters.orderNo}
              onChange={(e) =>
                setFilters({ ...filters, orderNo: e.target.value })
              }
            />
          </div>
          <div className="pcm-search-wrap w-36 px-2">
            <input
              className="pcm-search-input"
              placeholder="Customer Name"
              value={filters.customerName}
              onChange={(e) =>
                setFilters({ ...filters, customerName: e.target.value })
              }
            />
          </div>
          <div className="pcm-search-wrap w-48 px-2">
            <input
              className="pcm-search-input"
              placeholder="Email"
              value={filters.email}
              onChange={(e) =>
                setFilters({ ...filters, email: e.target.value })
              }
            />
          </div>
          <div className="pcm-search-wrap w-32 px-2">
            <input
              className="pcm-search-input"
              placeholder="Mobile"
              value={filters.mobile}
              onChange={(e) =>
                setFilters({ ...filters, mobile: e.target.value })
              }
            />
          </div>
          <select
            className="pm-cat-filter w-36"
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <option value="">All Statuses</option>
            {DELIVERY_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
          {(filters.orderNo ||
            filters.customerName ||
            filters.email ||
            filters.mobile ||
            filters.status) && (
            <button
              className="text-muted-foreground hover:text-destructive text-sm flex items-center px-2 py-1.5"
              onClick={() =>
                setFilters({
                  orderNo: "",
                  customerName: "",
                  email: "",
                  mobile: "",
                  status: "",
                })
              }
            >
              <X size={14} className="mr-1" /> Clear
            </button>
          )}
        </div>
        <span className="pcm-count ml-auto">
          {filteredOrders.length} record{filteredOrders.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div>
        {filteredOrders.length === 0 && !isFetching ? (
          <div className="text-center py-12 bg-card border border-border rounded-xl shadow-sm">
            <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium">No orders found</h3>
            <p className="text-muted-foreground text-sm">
              Waiting for new customer orders.
            </p>
          </div>
        ) : (
          <div className="pcm-table-wrap relative min-h-[200px]">
            {isFetching && (
              <div className="absolute inset-0 bg-background/50 flex flex-col items-center justify-center z-10 backdrop-blur-[1px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2"></div>
                <span className="text-sm font-medium text-primary">
                  Searching...
                </span>
              </div>
            )}
            <table className="pcm-table w-[80vw] rounded-lg bg-transparent overflow-x-auto table-fixed">
              <thead>
                <tr>
                  <th className="pcm-th pcm-th-num w-12">S.No</th>
                  <th className="pcm-th pcm-th-num w-16">Order No</th>
                  <th className="pcm-th w-40">Received Date & Time</th>
                  <th className="pcm-th w-32">Customer Name</th>
                  <th className="pcm-th w-40">Email</th>
                  <th className="pcm-th w-32">Contact No</th>
                  <th className="pcm-th w-28 text-right">Amount Paid</th>
                  <th className="pcm-th w-28 text-left">Delivery Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders?.map((order, idx) => (
                  <tr
                    key={order.id}
                    onClick={() => setSelectedOrderId(order.id)}
                    className="pcm-tr cursor-pointer hover:bg-gray-50/50"
                  >
                    <td className="py-2 text-xs text-gray-600 text-center border-r border-gray-300">
                      {idx + 1}
                    </td>
                    <td className="pcm-td pcm-td-num border-r border-gray-300">
                      #{order.id}
                    </td>
                    <td className="pcm-td pcm-td-name border-r border-gray-300">
                      {new Date(order.createdAt).toLocaleString()}
                    </td>
                    <td className="pcm-td pcm-td-name border-r border-gray-300">
                      <div className="font-medium text-foreground">
                        {order.user?.name || "Guest"}
                      </div>
                    </td>
                    <td className="pcm-td pcm-td-name border-r border-gray-300">
                      <div className="font-medium text-foreground">
                        {order.user?.email || "-"}
                      </div>
                    </td>
                    <td className="pcm-td pcm-td-name border-r border-gray-300">
                      <div className="font-medium text-foreground">
                        {order.user?.mobile || "-"}
                      </div>
                    </td>
                    <td className="pcm-td pcm-td-name text-right pr-4 border-r border-gray-300 font-semibold text-primary">
                      ₹{order.totalAmount.toFixed(2)}
                    </td>
                    <td className="pcm-td border-r border-gray-300 text-left pl-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground border border-border">
                        {order.deliveryStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
