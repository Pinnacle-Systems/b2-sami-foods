import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";

Font.register({
  family: "Poppins",
  fonts: [
    {
      src: "https://raw.githubusercontent.com/google/fonts/main/ofl/poppins/Poppins-Regular.ttf",
    },
    {
      src: "https://raw.githubusercontent.com/google/fonts/main/ofl/poppins/Poppins-Bold.ttf",
      fontWeight: "bold",
    },
  ],
});

const styles = StyleSheet.create({
  page: {
    padding: 10,
    fontSize: 6,
    fontFamily: "Poppins",
    color: "#000",
  },
  container: {
    flex: 1,
  },
  dashedDivider: {
    borderBottomWidth: 1,
    borderBottomColor: "#000",
    borderBottomStyle: "dashed",
    marginVertical: 4,
  },
  // Top Header
  companyName: {
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "center",
  },
  contactInfo: {
    fontSize: 6,
    textAlign: "center",
    marginBottom: 1,
  },
  invoiceTitle: {
    fontSize: 8,
    fontWeight: "bold",
    textAlign: "center",
    textDecoration: "underline",
    marginTop: 4,
    marginBottom: 4,
  },
  // Customer Info
  customerInfoContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  customerLeft: {
    flex: 1,
    alignItems: "flex-start",
  },
  customerRight: {
    flex: 1,
    alignItems: "flex-end",
  },
  customerText: {
    fontSize: 6,
  },
  // Table
  table: {
    width: "100%",
  },
  tableHeader: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#000",
    borderTopStyle: "dashed",
    borderBottomWidth: 1,
    borderBottomColor: "#000",
    borderBottomStyle: "dashed",
    paddingVertical: 3,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 2,
  },
  // Column Widths
  colSNo: { width: "6%", textAlign: "center" },
  colItem: { width: "30%", textAlign: "left" },
  colUOM: { width: "10%", textAlign: "left" },
  colWgtQty: { width: "13%", textAlign: "right", paddingRight: 4 },
  colProdQty: { width: "13%", textAlign: "right", paddingRight: 4 },
  colPrice: { width: "13%", textAlign: "right", paddingRight: 4 },
  colTotal: { width: "15%", textAlign: "right" },

  thText: {
    fontWeight: "bold",
    textAlign: "center",
  },
  itemText: {
    fontSize: 5.5,
  },

  // Totals
  totalsBlock: {
    marginTop: 2,
  },
  totalsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 1,
  },
  totalsLabelContainer: {
    width: "35%",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingRight: 10,
  },
  totalsText: {
    fontSize: 6,
  },
  totalsValue: {
    fontSize: 6,
    textAlign: "right",
    width: "25%",
  },
  totalPayableRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
    borderTopWidth: 1,
    borderTopColor: "#000",
    borderTopStyle: "dashed",
    borderBottomWidth: 1,
    borderBottomColor: "#000",
    borderBottomStyle: "dashed",
    marginTop: 2,
    marginBottom: 4,
  },
  totalPayableLabel: {
    fontSize: 9,
    fontWeight: "bold",
  },
  totalPayableAmount: {
    fontSize: 9,
    fontWeight: "bold",
    textAlign: "right",
  },

  // Footer
  paymentBreakdownLabel: {
    fontSize: 6,
    textDecoration: "underline",
    marginBottom: 2,
  },
  termsText: {
    textAlign: "center",
    fontSize: 6,
    marginTop: 4,
  },
  watermarkContainer: {
    justifyContent: "center",
    alignItems: "center",
    marginTop: 15,
    paddingBottom: 15,
  },
  watermarkText: {
    color: "rgba(180, 180, 180, 0.4)",
    fontSize: 40,
    fontWeight: "bold",
    textTransform: "uppercase",
    transform: "rotate(-60deg)",
  },
});

const formatCurrency = (amount) => {
  return Number(amount).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const InvoicePDF = ({ order }) => {
  if (!order) return null;

  const subtotal =
    order.items?.reduce((acc, item) => acc + item.price * item.quantity, 0) ||
    0;
  const deliveryCharge = order.totalAmount - subtotal;

  const totalQtySum =
    order.items?.reduce((acc, item) => acc + item.quantity, 0) || 0;

  const orderDate = new Date(order.createdAt).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const customerName = order.user?.name || "WALK-IN CUSTOMER";
  const customerMobile = order.address?.mobile || order.user?.mobile || "";

  return (
    <Document>
      <Page size={[226, 1200]} style={styles.page}>
        <View style={styles.container}>
          {/* Header (Company Info) */}
          <Text style={styles.companyName}>B2 SAMI FOODS</Text>
          <Text style={styles.contactInfo}>
            56-B, Sakkarai palayam. Muthur -638105. Thirupur District.
            TamilNadu.
          </Text>
          <Text style={styles.contactInfo}>Ph No.: 9003543646</Text>

          <Text style={styles.invoiceTitle}>INVOICE</Text>

          {/* Ship To Section */}
          <View style={{ marginTop: 2, marginBottom: 4 }}>
            <Text
              style={[
                styles.customerText,
                {
                  fontWeight: "bold",
                  textDecoration: "underline",
                  marginBottom: 2,
                },
              ]}
            >
              Ship To:
            </Text>
            {/* Customer & Order Info */}
            <View style={styles.customerInfoContainer}>
              <View style={styles.customerLeft}>
                <Text
                  style={[styles.customerText, { textTransform: "uppercase" }]}
                >
                  {customerName}
                </Text>
                {customerMobile && (
                  <Text style={styles.customerText}>{customerMobile}</Text>
                )}
              </View>
              <View style={styles.customerRight}>
                <Text style={styles.customerText}># {order.orderNo || ""}</Text>
                <Text style={styles.customerText}>Date : {orderDate}</Text>
              </View>
            </View>
            {order.address ? (
              <View>
                <Text style={styles.customerText}>
                  {order.address.address}, {order.address.city},
                </Text>
                <Text style={styles.customerText}>
                  {order.address.state} - {order.address.pinCode}
                </Text>
              </View>
            ) : (
              <Text style={styles.customerText}>
                Walk-in / No Shipping Address
              </Text>
            )}
          </View>

          {/* Table */}
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.colSNo, styles.thText]}>#</Text>
              <Text style={[styles.colItem, styles.thText]}>Item</Text>
              <Text style={[styles.colUOM, styles.thText]}>UOM</Text>
              <Text style={[styles.colWgtQty, styles.thText]}>Wgt Qty</Text>
              <Text style={[styles.colProdQty, styles.thText]}>Prod Qty</Text>
              <Text style={[styles.colPrice, styles.thText]}>Rate</Text>
              <Text style={[styles.colTotal, styles.thText]}>Amt</Text>
            </View>

            {order.items?.map((item, index) => (
              <View style={styles.tableRow} key={item.id}>
                <Text style={[styles.colSNo, styles.itemText]}>
                  {index + 1}
                </Text>
                <Text style={[styles.colItem, styles.itemText]}>
                  {item.product.productName}
                </Text>
                <Text style={[styles.colUOM, styles.itemText]}>
                  {item.product.productUom?.shortCode || "-"}
                </Text>
                <Text style={[styles.colWgtQty, styles.itemText]}>
                  {Number(item.weightQty).toFixed(2)}
                </Text>
                <Text style={[styles.colProdQty, styles.itemText]}>
                  {item.quantity}
                </Text>
                <Text style={[styles.colPrice, styles.itemText]}>
                  {formatCurrency(item.price)}
                </Text>
                <Text style={[styles.colTotal, styles.itemText]}>
                  {formatCurrency(item.price * item.quantity)}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.dashedDivider} />

          {/* Totals Block */}
          <View style={{ position: "relative" }}>
            <View style={styles.totalsBlock}>
              <View style={styles.totalsRow}>
                <View style={styles.totalsLabelContainer}>
                  <Text style={styles.totalsText}>Total Items</Text>
                  <Text style={styles.totalsText}>:</Text>
                </View>
                <Text style={styles.totalsValue}>
                  {order.items?.length || 0} (Qty: {totalQtySum})
                </Text>
              </View>
              <View style={styles.totalsRow}>
                <View style={styles.totalsLabelContainer}>
                  <Text style={styles.totalsText}>Subtotal</Text>
                  <Text style={styles.totalsText}>:</Text>
                </View>
                <Text style={styles.totalsValue}>
                  {formatCurrency(subtotal)}
                </Text>
              </View>
              <View style={styles.totalsRow}>
                <View style={styles.totalsLabelContainer}>
                  <Text style={styles.totalsText}>Delivery Charge</Text>
                  <Text style={styles.totalsText}>:</Text>
                </View>
                <Text style={styles.totalsValue}>
                  {formatCurrency(deliveryCharge)}
                </Text>
              </View>

              <View style={styles.totalPayableRow}>
                <Text style={styles.totalPayableLabel}>Total Amount Paid</Text>
                <Text style={styles.totalPayableAmount}>
                  Rs.{formatCurrency(order.totalAmount)}
                </Text>
              </View>
            </View>
            <View
              style={{
                position: "absolute",
                top: 15,
                left: 0,
                right: 0,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={styles.watermarkText}>{order.status}</Text>
            </View>
          </View>

          {/* <View style={styles.dashedDivider} /> */}

          {/* T&Cs */}
          <Text style={styles.termsText}>THANK YOU!</Text>
        </View>
      </Page>
    </Document>
  );
};

export default InvoicePDF;
