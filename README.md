# 🌾 AgroMart – Agricultural Marketplace

AgroMart is a full-stack MERN application that connects farmers directly with customers through a digital marketplace. Farmers can manage products and orders, while customers can browse, purchase, and track agricultural products seamlessly.

## 🚀 Key Features

### 👨‍🌾 Farmer Module

* Product Management (Add, Update, Delete)
* Inventory Management
* Order Tracking
* Offer & Discount Management
* Product Image Uploads

### 🛒 Customer Module

* Product Browsing & Search
* Shopping Cart
* Secure Checkout
* Order Placement
* Order History & Tracking

### 🔐 Authentication & Security

* OTP-Based Email Verification
* JWT Authentication
* Role-Based Access Control
* Protected Routes
* Input Validation

### 💳 Payment Integration

* Razorpay Payment Gateway (Test Mode)

---

## 🛠️ Tech Stack

**Frontend:** React.js, React Router, Axios, Bootstrap

**Backend:** Node.js, Express.js, JWT, Nodemailer, Multer

**Database:** MongoDB, Mongoose

**Tools:** Git, GitHub, Postman, VS Code

---

## 📂 Project Structure

```text
AgroMart/
├── frontend/
├── backend/
└── README.md
```

## ⚙️ Environment Variables

Create a `.env` file inside the backend folder:

```env
PORT=5000
DB_HOST=your_db_host
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=your_database_name

JWT_SECRET=your_jwt_secret

EMAIL_USER=your_email
EMAIL_PASS=your_email_password

RAZORPAY_KEY_ID=your_key_id
RAZORPAY_KEY_SECRET=your_key_secret
```

---

## 🚀 Installation

```bash
git clone https://github.com/yourusername/AgroMart.git

cd AgroMart

# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

Run Backend:

```bash
npm start
```

Run Frontend:

```bash
npm start
```

---

## 👩‍💻 Team

* Shivani J
* Adepu Shruthi Shankar
* Gauri Gohad

---

⭐ If you found this project useful, consider giving it a star on GitHub.

**AgroMart – Empowering Farmers, Connecting Customers. 🌱**
