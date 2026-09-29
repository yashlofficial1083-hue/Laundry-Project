const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");

// ✅ Login endpoint
router.post("/login", authController.employeeLogin);

module.exports = router;
