require("dotenv").config();
const express = require("express");
const cors = require("cors");
const otpRoutes = require("./routes/otpRoutes");
const authRoutes = require("./routes/authRoutes");
const connectDB = require("./config/db");
connectDB();
const cartRoutes = require("./routes/cartRoutes");
const favoriteRoutes = require("./routes/favoriteRoutes");

const app = express();
const userRoutes = require('./routes/userRoutes');

app.use(cors());
app.use(express.json());
app.use("/api/otp", otpRoutes);
app.use("/uploads", express.static("uploads"));
app.use("/api/test", require("./routes/testRoutes"));
app.use("/api/role-test", require("./routes/roleTestRoutes"));
app.use("/api/auth", authRoutes);
app.use("/api/products", require("./routes/productRoutes"));
app.use("/api/cart", cartRoutes);
app.use("/api/favorites", favoriteRoutes);
app.use('/api/users', userRoutes);
app.use('/api/reviews', require('./routes/reviewRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/offers', require('./routes/offerRoutes'));

app.get("/", (req, res) => {
  res.send("meow");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`http://localhost:${PORT}`);
});

