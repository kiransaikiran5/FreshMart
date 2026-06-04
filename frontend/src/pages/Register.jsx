import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

import {
  FiUser,
  FiMail,
  FiLock,
  FiArrowRight,
  FiShoppingBag,
  FiCheck,
} from "react-icons/fi";

export default function Register() {
  const navigate = useNavigate();
  const toast = useToast();
  const { register } = useAuth();

  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    role: "CUSTOMER",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);

    try {
      await register(form);

      toast.success("Account created successfully");

      navigate("/products");
    } catch (err) {
      const detail = err.response?.data?.detail;

      const message =
        typeof detail === "string"
          ? detail
          : Array.isArray(detail)
          ? detail[0]?.msg || "Registration failed"
          : "Registration failed";

      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-70px)] bg-[#f3f6f4] flex items-center justify-center px-4 overflow-hidden">

      {/* MAIN CARD */}
      <div
        className="
          w-full
          max-w-5xl
          h-[540px]
          bg-white
          rounded-[24px]
          shadow-2xl
          overflow-hidden
          grid
          lg:grid-cols-2
        "
      >

        {/* LEFT SIDE */}
        <div className="hidden lg:flex relative bg-gradient-to-br from-green-600 to-emerald-500 text-white p-5">

          {/* BACKGROUND EFFECTS */}
          <div className="absolute top-0 right-0 w-52 h-52 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-60 h-60 bg-black/10 rounded-full blur-3xl" />

          <div className="relative z-10 flex flex-col justify-between h-full">

            {/* TOP */}
            <div>

              {/* LOGO */}
              <div className="flex items-center gap-3 mb-6">

                <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center">
                  <FiShoppingBag className="w-6 h-6" />
                </div>

                <h1 className="text-3xl font-bold">
                  FreshMart
                </h1>
              </div>

              {/* HEADING */}
              <h2 className="text-3xl font-bold leading-tight">
                Grocery shopping
                <br />
                made simple
              </h2>

              <p className="mt-3 text-base text-green-50 leading-relaxed max-w-sm">
                Fresh vegetables, fruits, dairy,
                bakery snacks and daily essentials
                delivered quickly to your doorstep.
              </p>
            </div>

            {/* FEATURES */}
            <div className="space-y-3">

              <div className="flex items-center gap-3">

                <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
                  <FiCheck className="w-4 h-4" />
                </div>

                <div>
                  <h3 className="font-semibold">
                    Fast Delivery
                  </h3>

                  <p className="text-sm text-green-100">
                    Groceries delivered within hours
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">

                <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
                  <FiCheck className="w-4 h-4" />
                </div>

                <div>
                  <h3 className="font-semibold">
                    Fresh Products
                  </h3>

                  <p className="text-sm text-green-100">
                    Quality checked daily essentials
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">

                <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
                  <FiCheck className="w-4 h-4" />
                </div>

                <div>
                  <h3 className="font-semibold">
                    Secure Payments
                  </h3>

                  <p className="text-sm text-green-100">
                    Trusted payment system
                  </p>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="flex items-center justify-center px-6 py-3 lg:px-10 bg-white">

          <div className="w-full max-w-md">

            {/* MOBILE LOGO */}
            <div className="lg:hidden flex items-center justify-center gap-3 mb-4">

              <div className="w-11 h-11 bg-green-600 rounded-2xl flex items-center justify-center">
                <FiShoppingBag className="w-5 h-5 text-white" />
              </div>

              <h1 className="text-2xl font-bold text-gray-800">
                FreshMart
              </h1>
            </div>

            {/* HEADER */}
            <div className="mb-4 text-center">

              <h2 className="text-3xl font-bold text-gray-800">
                Create Account
              </h2>

              <p className="text-gray-500 mt-1 text-sm">
                Start shopping with FreshMart
              </p>
            </div>

            {/* FORM */}
            <form
              onSubmit={handleSubmit}
              className="space-y-2"
            >

              {/* USERNAME */}
              <div>

                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username
                </label>

                <div className="relative">

                  <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />

                  <input
                    type="text"
                    required
                    value={form.username}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        username: e.target.value,
                      })
                    }
                    placeholder="Enter username"
                    className="
                      w-full
                      pl-11
                      pr-4
                      py-2
                      rounded-xl
                      border
                      border-gray-200
                      bg-gray-50
                      text-sm
                      focus:outline-none
                      focus:ring-2
                      focus:ring-green-400
                    "
                  />
                </div>
              </div>

              {/* EMAIL */}
              <div>

                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>

                <div className="relative">

                  <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />

                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        email: e.target.value,
                      })
                    }
                    placeholder="Enter email address"
                    className="
                      w-full
                      pl-11
                      pr-4
                      py-2
                      rounded-xl
                      border
                      border-gray-200
                      bg-gray-50
                      text-sm
                      focus:outline-none
                      focus:ring-2
                      focus:ring-green-400
                    "
                  />
                </div>
              </div>

              {/* PASSWORD */}
              <div>

                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>

                <div className="relative">

                  <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />

                  <input
                    type="password"
                    required
                    value={form.password}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        password: e.target.value,
                      })
                    }
                    placeholder="Enter password"
                    className="
                      w-full
                      pl-11
                      pr-4
                      py-2
                      rounded-xl
                      border
                      border-gray-200
                      bg-gray-50
                      text-sm
                      focus:outline-none
                      focus:ring-2
                      focus:ring-green-400
                    "
                  />
                </div>
              </div>

              {/* ACCOUNT TYPE */}
              <div>

                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Account Type
                </label>

                <select
                  value={form.role}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      role: e.target.value,
                    })
                  }
                  className="
                    w-full
                    px-4
                    py-2
                    rounded-xl
                    border
                    border-gray-200
                    bg-gray-50
                    text-sm
                    focus:outline-none
                    focus:ring-2
                    focus:ring-green-400
                  "
                >
                  <option value="CUSTOMER">
                    Customer
                  </option>

                  <option value="ADMIN">
                    Admin
                  </option>
                </select>
              </div>

              {/* BUTTON */}
              <button
                type="submit"
                disabled={loading}
                className="
                  w-full
                  bg-green-600
                  hover:bg-green-700
                  text-white
                  py-2.5
                  rounded-xl
                  font-semibold
                  transition-all
                  flex
                  items-center
                  justify-center
                  gap-2
                  shadow-lg
                  mt-2
                "
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    Create Account
                    <FiArrowRight />
                  </>
                )}
              </button>
            </form>

            {/* FOOTER */}
            <div className="mt-3 text-center">

              <p className="text-gray-500 text-sm">
                Already have an account?
              </p>

              <Link
                to="/login"
                className="text-green-600 font-semibold hover:text-green-700 mt-1 inline-block text-sm"
              >
                Login Here
              </Link>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}