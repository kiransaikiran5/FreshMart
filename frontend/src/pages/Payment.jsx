import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { load } from "@cashfreepayments/cashfree-js";
import { useToast } from "../context/ToastContext";
import API from "../services/api";

export default function Payment() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [error, setError] = useState(null);

  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    let timeoutId;

    const initiatePayment = async () => {
      try {
        const { data } = await API.post(
          `/payments/create-order?order_id=${orderId}`
        );

        const {
          payment_session_id,
          cf_order_id,
        } = data;

        if (!payment_session_id) {
          throw new Error(
            "Payment session not received"
          );
        }

        const cashfree = await load({
          mode: "sandbox",
        });

        if (!cashfree) {
          throw new Error(
            "Unable to load Cashfree SDK"
          );
        }

        timeoutId = setTimeout(() => {
          toast.error(
            "Payment session expired. Please try again."
          );

          navigate("/orders", {
            replace: true,
          });
        }, 180000);

        await cashfree.checkout({
          paymentSessionId:
            payment_session_id,

          redirectTarget: "_self",

          returnUrl:
            `${window.location.origin}` +
            `/payment-result?cf_order_id=${cf_order_id}`,
        });
      } catch (err) {
        console.error(err);

        const message =
          err?.response?.data?.detail ||
          err?.message ||
          "Failed to initiate payment";

        setError(message);

        toast.error(message);
      }
    };

    initiatePayment();

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [orderId, navigate, toast]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white shadow-xl rounded-2xl p-8 max-w-md w-full text-center">

          <div className="text-6xl mb-4">
            ⚠️
          </div>

          <h1 className="text-2xl font-bold text-red-600 mb-3">
            Payment Failed
          </h1>

          <p className="text-gray-600 mb-6">
            {error}
          </p>

          <div className="space-y-3">

            <button
              onClick={() =>
                window.location.reload()
              }
              className="w-full bg-orange-500 text-white py-3 rounded-xl hover:bg-orange-600 transition"
            >
              Retry Payment
            </button>

            <button
              onClick={() =>
                navigate("/orders")
              }
              className="w-full bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 transition"
            >
              View Orders
            </button>

            <button
              onClick={() =>
                navigate("/products")
              }
              className="w-full bg-gray-200 text-gray-700 py-3 rounded-xl hover:bg-gray-300 transition"
            >
              Continue Shopping
            </button>

          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-white">

      <div className="bg-white shadow-xl rounded-2xl p-10 text-center max-w-md w-full">

        <div className="animate-spin rounded-full h-14 w-14 border-b-4 border-green-600 mx-auto mb-6"></div>

        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Redirecting to Cashfree
        </h2>

        <p className="text-gray-500">
          Please wait while we connect you
          to the secure payment gateway...
        </p>

      </div>
    </div>
  );
}