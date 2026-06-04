# 🥦 FreshMart – Grocery Store Management Platform

A full‑stack grocery e‑commerce application built with **FastAPI + MySQL** (backend) and **React + Tailwind** (frontend).  
It supports real‑time notifications, Cashfree payments, loyalty rewards, advanced search, delivery slot scheduling, and a comprehensive admin dashboard.

---

## 🧰 Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | FastAPI (Python), SQLAlchemy (async), MySQL |
| Authentication | JWT (access + refresh), Google OAuth |
| Frontend | React (Vite), Tailwind CSS, Axios, Context API |
| Payments | Cashfree (sandbox) |
| Real‑time | Server‑Sent Events (SSE) |
| Charts | Recharts |
| AI Chat | Rule‑based assistant (context‑aware) |

---

## ✨ Features (Modules 1‑21)

1. **User Authentication & RBAC** – email/password + Google OAuth, admin/customer roles.
2. **Grocery Product Management** – CRUD, image upload, search, category filter.
3. **Shopping Cart** – add/remove, quantity update, stock validation.
4. **Order Management** – place order, order history, status updates (admin).
5. **Payment System** – Cashfree sandbox integration + simulated mode.
6. **Inventory Management** – stock tracking, low‑stock alerts, auto‑reduction.
7. **Delivery Tracking** – status updates, progress indicator.
8. **Reviews & Ratings** – submit review, average rating, star display.
9. **In‑App Notifications** – triggered on order/payment/delivery, mark as read.
10. **AI Support Chat** – product recommendations, order queries.
11. **Admin Dashboard & Analytics** – KPI cards, top‑products chart, order monitoring.
12. **Coupons & Discounts** – admin CRUD, validation, usage tracking.
13. **Wishlist Management** – add/remove, move to cart, heart icons.
14. **Loyalty Rewards** – earn points on purchase, redeem at checkout.
15. **Order Cancellation & Returns** – cancel orders, request returns/refunds, admin approval.
16. **Delivery Slot Scheduling** – slot selection, capacity management, admin CRUD.
17. **Personalized Recommendations** – based on purchase history, frequently bought together.
18. **Advanced Search & Smart Filters** – brand, rating, availability, sort, search suggestions.
19. **Real‑Time Notifications (SSE)** – live push to the notification bell.
20. **Admin Promotions & Campaign Dashboard** – campaign CRUD, performance analytics.
21. **Sales Analytics & Business Reports** – daily/monthly revenue, top products, customer trends.

---

## 📋 Prerequisites

- Python 3.9+ & pip
- Node.js 18+ & npm
- MySQL (or MariaDB)
- Cashfree sandbox account (for payment testing)
- Google Cloud Console project (for Google OAuth, optional)
- ngrok (for local HTTPS during Cashfree testing)

---

## 🚀 Quick Start

### 1. Clone the repository

git clone https://github.com/your-username/FreshMart.git
cd FreshMart

 ## 📁 Project Structure

```
FreshMart/
├── backend/
│   ├── app/
│   │   ├── api/                # FastAPI route files
│   │   │   ├── auth.py         #   Registration, login, JWT, Google OAuth
│   │   │   ├── products.py     #   Product CRUD, search, filters
│   │   │   ├── cart.py         #   Shopping cart endpoints
│   │   │   ├── orders.py       #   Order placement, cancellation, returns
│   │   │   ├── payments.py     #   Cashfree integration + verify
│   │   │   ├── deliveries.py   #   Delivery tracking & updates
│   │   │   ├── reviews.py      #   Product reviews & ratings
│   │   │   ├── notifications.py#   REST + SSE real‑time notifications
│   │   │   ├── admin.py        #   Admin dashboard & order management
│   │   │   ├── chat.py         #   AI chat assistant
│   │   │   ├── inventory.py    #   Stock levels & low‑stock alerts
│   │   │   ├── categories.py   #   Category management (admin)
│   │   │   ├── coupons.py      #   Discount coupons
│   │   │   ├── wishlist.py     #   Customer wishlist
│   │   │   ├── loyalty.py      #   Loyalty points & transactions
│   │   │   ├── returns.py      #   Return / refund requests
│   │   │   ├── delivery_slots.py # Delivery slot scheduling
│   │   │   ├── campaigns.py    #   Promotional campaigns (admin)
│   │   │   ├── analytics.py    #   Sales reports & business analytics
│   │   │   └── recommendations.py # Personalised product recommendations
│   │   ├── models/             # SQLAlchemy ORM models
│   │   ├── schemas/            # Pydantic request/response schemas
│   │   ├── services/           # Business logic & SSE pub‑sub
│   │   ├── core/               # Security (JWT, hashing), dependencies
│   │   ├── utils/              # Timezone helpers
│   │   └── main.py             # FastAPI application entry point
│   ├── static/
│   │   └── images/             # Uploaded product images (ignored by Git)
│   └── requirements.txt        # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   │   ├── Navbar.jsx
│   │   │   ├── NotificationBell.jsx
│   │   │   ├── ChatWidget.jsx
│   │   │   ├── StarRating.jsx
│   │   │   ├── ProtectedRoute.jsx
│   │   │   └── ImageWithFallback.jsx
│   │   ├── context/            # React Context providers
│   │   │   ├── AuthContext.jsx
│   │   │   ├── CartContext.jsx
│   │   │   ├── WishlistContext.jsx
│   │   │   ├── NotificationContext.jsx
│   │   │   └── ToastContext.jsx
│   │   ├── pages/              # Page components
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Products.jsx
│   │   │   ├── ProductDetail.jsx
│   │   │   ├── Cart.jsx
│   │   │   ├── Checkout.jsx
│   │   │   ├── Payment.jsx
│   │   │   ├── PaymentResult.jsx
│   │   │   ├── OrderHistory.jsx
│   │   │   ├── DeliveryTracking.jsx
│   │   │   ├── NotificationsPage.jsx
│   │   │   ├── Wishlist.jsx
│   │   │   ├── Loyalty.jsx
│   │   │   ├── Returns.jsx
│   │   │   ├── AuthCallback.jsx
│   │   │   ├── NotFound.jsx
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── AdminProducts.jsx
│   │   │   ├── AdminOrders.jsx
│   │   │   ├── AdminInventory.jsx
│   │   │   ├── AdminCategories.jsx
│   │   │   ├── AdminCoupons.jsx
│   │   │   ├── AdminReturns.jsx
│   │   │   ├── AdminDeliverySlots.jsx
│   │   │   ├── AdminCampaigns.jsx
│   │   │   └── AdminAnalytics.jsx
│   │   └── services/
│   │       └── api.js          # Axios instance & all API calls
│   ├── public/
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
├── .gitignore
└── README.md
```

## Backend Setup
cd backend
python -m venv venv

### venv\Scripts\activate       # Windows
### source venv/bin/activate    # Mac/Linux

pip install -r requirements.txt

# Create a .env file inside backend/ with the following variables

- DATABASE_URL=mysql+aiomysql://root:password@localhost/freshmart_db
- SECRET_KEY=your-secret-key
- ALGORITHM=HS256
- ACCESS_TOKEN_EXPIRE_MINUTES=30
- REFRESH_TOKEN_EXPIRE_DAYS=7

# Google OAuth (optional)
- GOOGLE_CLIENT_ID=
- GOOGLE_CLIENT_SECRET=
- GOOGLE_REDIRECT_URI=http://localhost:8000/api/v1/auth/google/callback
- FRONTEND_URL=http://localhost:5173

# Cashfree (optional)
- CASHFREE_APP_ID=
- CASHFREE_SECRET_KEY=
- CASHFREE_ENV=sandbox

# Backend server Run

uvicorn app.main:app --reload

# Frontend Setup

cd ../frontend
npm install
npm run dev

The frontend runs at http://localhost:517

# Cashfree Payment Testing

- Create a Cashfree sandbox account and obtain App ID and Secret Key.
- Add them to backend/.env.

# Google OAuth

- Create a Google Cloud Console project → enable Google Identity Services.

- Get a Client ID and Secret.

- Add them to backend/.env and update the Authorised JavaScript origins and redirect URIs.

- A “Continue with Google” button appears on the Login page and Navbar.
