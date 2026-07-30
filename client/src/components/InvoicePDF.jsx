import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  Image,
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
    borderWidth: 1,
    borderColor: "#000",
    borderStyle: "solid",
    padding: 5,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: "#000",
    borderBottomStyle: "solid",
    marginVertical: 4,
    marginLeft: -5,
    marginRight: -5,
  },
  // Top Header
  headerTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerRight: {
    alignItems: "flex-start",
  },
  logo: {
    width: 25,
    height: 25,
    marginRight: 6,
  },
  companyName: {
    fontSize: 10,
    fontWeight: "bold",
  },
  headerRightText: {
    fontSize: 8,
    fontWeight: "bold",
  },
  invoiceTitle: {
    fontSize: 8,
    fontWeight: "bold",
    textAlign: "center",
    textDecoration: "underline",
    marginTop: 2,
    marginBottom: 4,
  },
  // Customer & Company Info
  addressContainer: {
    marginBottom: 4,
  },
  addressBlock: {
    marginBottom: 6,
  },
  addressTitle: {
    fontSize: 10,
    fontWeight: "bold",
    textDecoration: "underline",
    marginBottom: 2,
  },
  addressText: {
    fontSize: 10,
    marginBottom: 1,
  },

  // Totals
  totalsText: {
    fontSize: 10,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 10,
    marginBottom: 10,
  },
  termsText: {
    textAlign: "center",
    fontSize: 12,
    fontWeight: "bold",
    marginTop: 10,
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

const InvoicePDF = ({ order }) => {
  if (!order) return null;
  console.log(order, "order");

  const orderDate = new Date(order.createdAt).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const customerName = order.user?.name || "WALK-IN CUSTOMER";
  const customerMobile = order.address?.mobile || order.user?.mobile || "";
  const alternativeMobile = order.address?.alterNateMobile || "";
  const addressType = order.address?.addressType || "";
  const landmark = order.address?.landmark || "";
  const totalItemsCount = order.items?.length || 0;
  const totalQtySum =
    order.items?.reduce((acc, item) => acc + item.quantity, 0) || 0;

  return (
    <Document>
      <Page size={[297.64, 425.2]} style={styles.page}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.headerTitleContainer}>
            <View style={styles.headerLeft}>
              <Image src="/b2samifinallogo.jpeg" style={styles.logo} />
              <Text style={styles.companyName}>B2 SAMI FOODS</Text>
            </View>
            <View style={styles.headerRight}>
              <View style={{ flexDirection: "row" }}>
                <Text style={[styles.headerRightText, { width: 40 }]}>
                  Order No
                </Text>
                <Text style={styles.headerRightText}>
                  : # {order.orderNo || ""}
                </Text>
              </View>
              <View style={{ flexDirection: "row" }}>
                <Text style={[styles.headerRightText, { width: 40 }]}>
                  Date
                </Text>
                <Text style={styles.headerRightText}>: {orderDate}</Text>
              </View>
            </View>
          </View>

          <View style={styles.divider} />

          {/* <Text style={styles.invoiceTitle}>INVOICE</Text> */}

          {/* Address Section (One Column) */}
          <View style={styles.addressContainer}>
            {/* From Address */}
            <View style={styles.addressBlock}>
              <Text style={styles.addressTitle}>From:</Text>
              <Text style={[styles.addressText, { fontWeight: "bold" }]}>
                B2 SAMI FOODS
              </Text>
              <Text style={styles.addressText}>
                56-B, Sakkarai palayam, Muthur - 638105,
              </Text>
              <Text style={styles.addressText}>
                Thirupur District, TamilNadu.
              </Text>
              <Text style={styles.addressText}>Ph No : 9003543646</Text>
            </View>
            <View style={styles.divider} />

            {/* To Address */}
            <View style={styles.addressBlock}>
              <Text style={styles.addressTitle}>To:</Text>
              <Text
                style={[
                  styles.addressText,
                  { textTransform: "uppercase", fontWeight: "bold" },
                ]}
              >
                {customerName}
              </Text>
              {addressType && (
                <Text style={styles.addressText}>
                  Address Type : {addressType}
                </Text>
              )}
              {order.address ? (
                <View>
                  <Text style={styles.addressText}>
                    {order.address.address},
                  </Text>
                  <Text style={styles.addressText}>{order.address.city},</Text>
                  <Text style={styles.addressText}>
                    {order.address.state} - {order.address.pinCode}
                  </Text>
                  {landmark && (
                    <Text style={styles.addressText}>
                      Landmark: {order.address.landmark || "-"}
                    </Text>
                  )}
                </View>
              ) : (
                <Text style={styles.addressText}>
                  Walk-in / No Shipping Address
                </Text>
              )}
              {customerMobile && (
                <Text style={styles.addressText}>
                  Mobile : {customerMobile}
                </Text>
              )}

              {alternativeMobile && (
                <Text style={styles.addressText}>
                  Alternate Mobile : {alternativeMobile}
                </Text>
              )}
            </View>
            <View style={styles.divider} />
          </View>

          {/* Totals Block */}
          <View style={{ position: "relative" }}>
            <Text style={styles.totalsText}>
              Total {totalItemsCount} {totalItemsCount === 1 ? "Item" : "Items"}{" "}
              (Qty: {totalQtySum})
            </Text>

            {/* {order.status && (
              <View
                style={{
                  position: "absolute",
                  top: -25,
                  left: 0,
                  right: 0,
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: -1,
                }}
              >
                <Text style={styles.watermarkText}>{order.status}</Text>
              </View>
            )} */}
          </View>

          <Text style={styles.termsText}>THANK YOU!</Text>
        </View>
      </Page>
    </Document>
  );
};

export default InvoicePDF;
