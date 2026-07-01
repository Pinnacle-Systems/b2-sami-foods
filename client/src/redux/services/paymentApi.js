import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const BASE_URL = process.env.REACT_APP_SERVER_URL || "/api";

const paymentApi = createApi({
  reducerPath: "paymentApi",
  baseQuery: fetchBaseQuery({
    baseUrl: BASE_URL,
  }),
  tagTypes: ["Order"],
  endpoints: (builder) => ({
    getOrders: builder.query({
      query: () => ({
        url: "/payment/orders",
        method: "GET",
        headers: {
          "Content-type": "application/json; charset=UTF-8",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }),
      providesTags: ["Order"],
    }),
    getAllOrdersAdmin: builder.query({
      query: (filters = {}) => {
        const params = new URLSearchParams();
        if (filters.orderNo) params.append('orderNo', filters.orderNo);
        if (filters.customerName) params.append('customerName', filters.customerName);
        if (filters.email) params.append('email', filters.email);
        if (filters.mobile) params.append('mobile', filters.mobile);
        if (filters.status) params.append('status', filters.status);
        
        return {
          url: `/payment/admin/orders?${params.toString()}`,
          method: "GET",
          headers: {
            "Content-type": "application/json; charset=UTF-8",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        };
      },
      providesTags: ["Order"],
    }),
    getOneOrderAdmin: builder.query({
      query: (id) => ({
        url: `/payment/admin/orders/${id}`,
        method: "GET",
        headers: {
          "Content-type": "application/json; charset=UTF-8",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }),
      providesTags: (result, error, id) => [{ type: "Order", id }],
    }),
    updateDeliveryStatus: builder.mutation({
      query: ({ id, deliveryStatus }) => ({
        url: `/payment/admin/orders/${id}/delivery`,
        method: "PUT",
        headers: {
          "Content-type": "application/json; charset=UTF-8",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: { deliveryStatus },
      }),
      invalidatesTags: ["Order"],
    }),
    createOrder: builder.mutation({
      query: (body) => ({
        url: "/payment/create-order",
        method: "POST",
        headers: {
          "Content-type": "application/json; charset=UTF-8",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body,
      }),
    }),
    verifyPayment: builder.mutation({
      query: (body) => ({
        url: "/payment/verify",
        method: "POST",
        headers: {
          "Content-type": "application/json; charset=UTF-8",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body,
      }),
      invalidatesTags: ["Order"],
    }),
  }),
});

export const {
  useGetOrdersQuery,
  useGetAllOrdersAdminQuery,
  useUpdateDeliveryStatusMutation,
  useCreateOrderMutation,
  useVerifyPaymentMutation,
  useGetOneOrderAdminQuery,
} = paymentApi;

export default paymentApi;
