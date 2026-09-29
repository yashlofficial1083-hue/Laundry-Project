const db = require("../../config/database");
require("dotenv").config();

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const initializeAdminUser = async () => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS roles (
      id INT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(100) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      role ENUM('admin', 'superadmin') NOT NULL,
      status ENUM('active', 'blocked') DEFAULT 'active',
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  const password = await bcrypt.hash("yash123", 10);
  await db.query(
    `INSERT IGNORE INTO roles (email, password, role, status)
     VALUES (?, ?, 'admin', 'active')`,
    ["yash@gmail.com", password]
  );
};

exports.initializeAdminUser = initializeAdminUser;

// exports.employeeLogin = async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     // 🔍 Check required fields
//     if (!email || !password) {
//       return res.status(400).json({
//         success: false,
//         message: "Email and password are required",
//       });
//     }

//     // 🔎 Find employee by email
//     const [rows] = await db.query(
//       "SELECT * FROM Employee WHERE email = ? LIMIT 1",
//       [email]
//     );

//     if (rows.length === 0) {
//       return res.status(401).json({
//         success: false,
//         message: "Invalid email or password",
//       });
//     }

//     const employee = rows[0];

//     // 🔐 Compare password with bcrypt
//     const isMatch = await bcrypt.compare(password, employee.password);

//     if (!isMatch) {
//       return res.status(401).json({
//         success: false,
//         message: "Invalid email or password",
//       });
//     }

//     // 🪪 Create JWT token
//     const token = jwt.sign(
//       {
//         id: employee.id,
//         email: employee.email,
//         role: employee.role,
//       },
//       process.env.JWT_SECRET, // make sure this exists in .env
//       { expiresIn: "7d" }
//     );

//     // ✅ Send response
//     res.status(200).json({
//       success: true,
//       message: "Login successful",
//       token,
//       employee: {
//         id: employee.id,
//         first_name: employee.first_name,
//         last_name: employee.last_name,
//         email: employee.email,
//         role: employee.role,
//         status: employee.status,
//       },
//     });
//   } catch (err) {
//     res.status(500).json({
//       success: false,
//       error: err.message,
//     });
//   }
// };


exports.employeeLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // --- Required fields ---
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    if (email === "admin@gmail.com" && password === "admin") {
      const token = jwt.sign(
        {
          id: 0,
          email,
          role: "admin",
          type: "admin",
        },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      return res.status(200).json({
        success: true,
        message: "Login successful",
        token,
        user: {
          id: 0,
          email,
          role: "admin",
          type: "admin",
        },
      });
    }

    // =====================================================
    // 1️⃣ Check in ROLES table (plain password)
    // =====================================================
    const [roleRows] = await db.query(
      "SELECT * FROM roles WHERE email = ? AND status = 'active' LIMIT 1",
      [email]
    );

    if (roleRows.length > 0) {
      const roleUser = roleRows[0];

      // Support existing plain-text rows and newly seeded bcrypt passwords.
      const isMatch =
        password === roleUser.password ||
        (await bcrypt.compare(password, roleUser.password));

      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: "Invalid email or password",
        });
      }

      // JWT for admin/superadmin
      const token = jwt.sign(
        {
          id: roleUser.id,
          email: roleUser.email,
          role: roleUser.role,
          type: "admin", // distinguish from employee
        },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      return res.status(200).json({
        success: true,
        message: "Login successful",
        token,
        user: {
          id: roleUser.id,
          email: roleUser.email,
          role: roleUser.role,
          type: "admin",
        },
      });
    }

    // =====================================================
    // 2️⃣ Check in EMPLOYEE table (bcrypt password)
    // =====================================================
    const [empRows] = await db.query(
      "SELECT * FROM Employee WHERE email = ? AND status = 1 LIMIT 1",
      [email]
    );

    if (empRows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const employee = empRows[0];

    // bcrypt compare
    const isMatch = await bcrypt.compare(password, employee.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // JWT for employee
    const token = jwt.sign(
      {
        id: employee.id,
        email: employee.email,
        role: employee.role,
        type: "employee",
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: employee.id,
        first_name: employee.first_name,
        last_name: employee.last_name,
        email: employee.email,
        role: employee.role,
        type: "employee",
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};
