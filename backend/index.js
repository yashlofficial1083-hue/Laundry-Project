const express = require("express");
const cors = require("cors");
require("dotenv").config();
require("./config/database");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Static uploads folder
app.use("/uploads", express.static("uploads"));

// Routes
const authRoutes = require("./src/routes/auth.routes");
const employeeRoutes = require("./src/routes/employee.routes");
const customerRoutes = require("./src/routes/customer.routes");
const serviceRoutes = require("./src/routes/service.routes");
const collectionRoutes = require("./src/routes/collection.routes");
const expensesRoutes = require("./src/routes/expenses.routes");
const locationRoutes = require("./src/routes/locationManagement.routes");
const areaRoutes = require("./src/routes/area.routes");
const timeslotRoutes = require("./src/routes/timeslot.routes");
const serviceListRoutes = require("./src/routes/servicelist.routes");
const orderRoutes = require("./src/routes/order.routes");
const reportsRoutes = require("./src/routes/report.routes");

// Health check route
app.get("/api/message", (req, res) => {
    res.send("✅ Laundry POS System Backend Server Running...");
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/service", serviceRoutes);
app.use("/api/service_list", serviceListRoutes);
app.use("/api/collections", collectionRoutes);
app.use("/api/timeslot", timeslotRoutes);
app.use("/api/expenses", expensesRoutes);
app.use("/api/location_management/emirates", locationRoutes);
app.use("/api/areas", areaRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/reports", reportsRoutes);

// Start server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
    await require("./src/controllers/auth.controller").initializeAdminUser();

    app.listen(PORT, "0.0.0.0", () => {
        console.log(`✅ Server running at http://localhost:${PORT}`);
    });
};

startServer().catch((err) => {
    console.error("❌ Server startup failed:", err.message);
    process.exit(1);
});