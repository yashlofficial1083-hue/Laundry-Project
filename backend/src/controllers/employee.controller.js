const db = require("../../config/database");
const bcrypt = require("bcryptjs");

const ensureEmployeesTable = async () => {
    const sql = `
        CREATE TABLE IF NOT EXISTS employee (
            id INT AUTO_INCREMENT PRIMARY KEY,
            first_name VARCHAR(100) NOT NULL,
            last_name VARCHAR(100) NOT NULL,
            role ENUM('Admin','Supervisor','Driver') NOT NULL,
            mobile_no VARCHAR(20) NOT NULL,
            email VARCHAR(100) NOT NULL,
            password VARCHAR(255) NOT NULL,
            dob DATE NOT NULL,
            hire_date DATE NOT NULL,
            address VARCHAR(255) NOT NULL,
            vehicle_id VARCHAR(100),
            license_no VARCHAR(100),
            status TINYINT(1) DEFAULT 1, -- 0 = inactive, 1 = active
            createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    await db.query(sql);
};

const ensureRolesTable = async () => {
    const sql = `
        CREATE TABLE IF NOT EXISTS roles (
            id INT AUTO_INCREMENT PRIMARY KEY,
            email VARCHAR(100) NOT NULL UNIQUE,
            password VARCHAR(100) NOT NULL,
            role ENUM('admin', 'superadmin') NOT NULL,
            status ENUM('active', 'blocked') DEFAULT 'active',
            createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
    `;
    await db.query(sql);
};

const ensureAttendanceTable = async () => {
    const sql = `
        CREATE TABLE IF NOT EXISTS attendance (
            id INT AUTO_INCREMENT PRIMARY KEY,
            employeeId INT NOT NULL,
            attendance_date DATE NOT NULL,
            punch_in TIME,
            punch_out TIME,
            punch_in_image VARCHAR(255),
            punch_out_image VARCHAR(255),
            is_verified BOOLEAN DEFAULT FALSE,
            createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY unique_attendance (employeeId, attendance_date),
            FOREIGN KEY (employeeId) REFERENCES employee(id)
);
    `;
    await db.query(sql);
};

exports.createEmployee = async (req, res) => {
    try {
        const {
            first_name,
            last_name,
            role,
            mobile_no,
            email,
            password,
            dob,
            hire_date,
            address,
            status,
            vehicle_id,
            license_no,
        } = req.body;

        await ensureEmployeesTable();
        await ensureAttendanceTable();
        await ensureRolesTable();

        // 🔐 Hash password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // ✅ Insert Employee
        const insertSQL = `
            INSERT INTO Employee 
            (
                first_name, last_name, role, mobile_no, email, password,
                dob, hire_date, address, vehicle_id, license_no, status
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const [result] = await db.query(insertSQL, [
            first_name,
            last_name,
            role,
            mobile_no,
            email,
            hashedPassword, // ← store encrypted password
            dob,
            hire_date,
            address,
            vehicle_id,
            license_no,
            status,
        ]);

        res.status(201).json({
            success: true,
            message: "✅ Employee added successfully",
            id: result.insertId,
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: err.message,
        });
    }
};


// ✅ GET ALL WITH PAGINATION
exports.getAllEmployees = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;   // current page
        const limit = parseInt(req.query.limit) || 10; // items per page
        const offset = (page - 1) * limit;

        // Get total count
        const [[{ total }]] = await db.query(`SELECT COUNT(*) AS total FROM Employee`);

        // Get paginated data
        const [rows] = await db.query(
            `SELECT * FROM Employee ORDER BY id DESC LIMIT ? OFFSET ?`,
            [limit, offset]
        );

        res.json({
            success: true,
            data: rows,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};


// ✅ GET BY ID
exports.getEmployeeById = async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await db.query(`SELECT * FROM Employee WHERE id = ?`, [id]);

        if (!rows.length) {
            return res.status(404).json({ success: false, message: "Employee not found" });
        }

        res.json({ success: true, data: rows[0] });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};



// ✅ UPDATE
exports.updateEmployee = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            first_name,
            last_name,
            role,
            mobile_no,
            email,
            password,
            dob,
            hire_date,
            address,
            vehicle_id,
            license_no,
            status,
        } = req.body;

        const updateSQL = `
      UPDATE Employee SET
        first_name = ?,
        last_name = ?,
        role = ?,
        mobile_no = ?,
        email = ?,
        password = ?,
        dob = ?,
        hire_date = ?,
        address = ?,
        vehicle_id = ?,
        license_no = ?,
        status = ?
      WHERE id = ?
    `;

        const [result] = await db.query(updateSQL, [
            first_name,
            last_name,
            role,
            mobile_no,
            email,
            normalizeEncryptedPassword(password),
            dob,
            hire_date,
            address,
            vehicle_id,
            license_no,
            status,
            id,
        ]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Employee not found" });
        }

        res.json({ success: true, message: "Employee updated" });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// ✅ DELETE
exports.deleteEmployee = async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await db.query(`DELETE FROM Employee WHERE id = ?`, [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Employee not found" });
        }

        res.json({ success: true, message: "Employee deleted" });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// ✅Punch In
exports.punchIn = async (req, res) => {
    const { employeeId, image } = req.body;

    try {
        await ensureAttendanceTable();

        const [existing] = await db.query(
            `
      SELECT * 
      FROM attendance 
      WHERE employeeId = ? 
        AND attendance_date = DATE(CONVERT_TZ(NOW(), '+00:00', '+05:30'))
      `,
            [employeeId]
        );

        if (existing.length && existing[0].punch_in) {
            return res.status(400).json({ message: "Already punched in" });
        }

        await db.query(
            `
      INSERT INTO attendance 
        (employeeId, attendance_date, punch_in, punch_in_image, is_verified)
      VALUES 
        (
          ?, 
          DATE(CONVERT_TZ(NOW(), '+00:00', '+05:30')),
          TIME(CONVERT_TZ(NOW(), '+00:00', '+05:30')),
          ?, 
          1
        )
      ON DUPLICATE KEY UPDATE 
        punch_in = TIME(CONVERT_TZ(NOW(), '+00:00', '+05:30')),
        punch_in_image = ?
      `,
            [employeeId, image, image]
        );

        res.json({ message: "Punch In successful (IST)" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ✅Punch Out
exports.punchOut = async (req, res) => {
    const { employeeId, image } = req.body;

    try {
        const [attendance] = await db.query(
            `
      SELECT * 
      FROM attendance 
      WHERE employeeId = ? 
        AND attendance_date = DATE(CONVERT_TZ(NOW(), '+00:00', '+05:30'))
      `,
            [employeeId]
        );

        if (!attendance.length || !attendance[0].punch_in) {
            return res.status(400).json({ message: "Punch in first" });
        }

        if (attendance[0].punch_out) {
            return res.status(400).json({ message: "Already punched out" });
        }

        await db.query(
            `
      UPDATE attendance
      SET 
        punch_out = TIME(CONVERT_TZ(NOW(), '+00:00', '+05:30')),
        punch_out_image = ?
      WHERE employeeId = ?
        AND attendance_date = DATE(CONVERT_TZ(NOW(), '+00:00', '+05:30'))
      `,
            [image, employeeId]
        );

        res.json({ message: "Punch Out successful (IST)" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// ✅Status
exports.getPunchStatus = async (req, res) => {
    try {
        const { employeeId } = req.params;

        // Use 'en-CA' to force YYYY-MM-DD format in local time
        const today = new Date().toLocaleDateString('en-CA');

        const [rows] = await db.query(
            "SELECT punch_in, punch_out FROM attendance WHERE employeeId=? AND attendance_date=?",
            [employeeId, today]
        );

        // If no row exists for TODAY'S date, it's safe to show READY
        if (rows.length === 0) {
            return res.json({ success: true, status: "READY" });
        }

        if (rows[0].punch_out) {
            return res.json({ success: true, status: "COMPLETED" });
        }

        return res.json({ success: true, status: "IN" });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};