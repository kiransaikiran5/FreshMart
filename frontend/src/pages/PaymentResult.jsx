import { useState, useEffect } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import API from "../services/api";

export default function PaymentResult() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const cfOrderId = searchParams.get("cf_order_id");
  const urlOrderId = searchParams.get("order_id");

  const [verifying, setVerifying] = useState(true);
  const [success, setSuccess] = useState(null);
  const [verifyError, setVerifyError] = useState(false);
  const [orderId, setOrderId] = useState(urlOrderId);

  useEffect(() => {
    let redirectTimer;

    const verifyPayment = async () => {
      try {
        if (!cfOrderId) {
          setSuccess(false);
          setVerifyError(true);
          return;
        }

        const { data } = await API.post(
          "/payments/verify",
          {
            order_id: cfOrderId,
          }
        );

        console.log(
          "Payment Verification Response:",
          data
        );

        setSuccess(data.success);

        if (data.order_id) {
          setOrderId(data.order_id);
        }

        setVerifyError(false);

        if (data.success) {
          redirectTimer = setTimeout(() => {
            navigate("/orders", {
              replace: true,
            });
          }, 3000);
        }
      } catch (error) {
        console.error(
          "Verification Error:",
          error
        );

        setSuccess(false);
        setVerifyError(true);
      } finally {
        setVerifying(false);
      }
    };

    verifyPayment();

    return () => {
      if (redirectTimer) {
        clearTimeout(redirectTimer);
      }
    };
  }, [cfOrderId, navigate]);

  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white rounded-3xl shadow-xl p-8 text-center w-full max-w-md">
          <div className="animate-spin rounded-full h-14 w-14 border-b-4 border-green-600 mx-auto mb-5"></div>

          <h2 className="text-xl font-bold text-gray-800">
            Verifying Payment
          </h2>

          <p className="text-gray-500 mt-2">
            Please wait while we verify your
            payment...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white rounded-3xl shadow-xl p-8 max-w-lg w-full text-center">

        {success ? (
          <>
            <div className="text-7xl mb-4">
              ✅
            </div>

            <h1 className="text-3xl font-bold text-green-600">
              Payment Successful
            </h1>

            <p className="text-gray-600 mt-3">
              Your payment has been verified
              successfully.
            </p>

            {orderId && (
              <p className="mt-3 text-gray-700 font-medium">
                Order ID: #{orderId}
              </p>
            )}

            <div className="mt-5 bg-green-50 border border-green-200 rounded-xl p-4">
              <p className="text-green-700 font-medium">
                Your order has been confirmed.
              </p>

              <p className="text-green-600 text-sm mt-1">
                Redirecting to Orders page...
              </p>
            </div>

            <div className="mt-6">
              <Link
                to="/orders"
                className="inline-block bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-700 transition"
              >
                View Orders
              </Link>
            </div>
          </>
        ) : (
          <>
            <div className="text-7xl mb-4">
              ❌
            </div>

            <h1 className="text-3xl font-bold text-red-600">
              Payment Failed
            </h1>

            <p className="text-gray-600 mt-3">
              We couldn't verify your payment.
            </p>

            {verifyError && (
              <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <p className="text-yellow-700 text-sm">
                  Payment verification failed.
                  If money was deducted,
                  please check your Orders
                  page or contact support.
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">

              {orderId && (
                <button
                  onClick={() =>
                    navigate(
                      `/payment/${orderId}`
                    )
                  }
                  className="bg-orange-500 text-white px-6 py-3 rounded-xl hover:bg-orange-600 transition"
                >
                  Try Again
                </button>
              )}

              <Link
                to="/orders"
                className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition"
              >
                View Orders
              </Link>

              <Link
                to="/products"
                className="bg-gray-200 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-300 transition"
              >
                Continue Shopping
              </Link>

            </div>
          </>
        )}

      </div>
    </div>
  );
}