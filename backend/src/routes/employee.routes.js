const express = require("express");
const {
    createEmployee,
    getAllEmployees,
    getEmployeeById,
    updateEmployee,
    deleteEmployee,
    punchIn,
    punchOut,
    getPunchStatus
} = require("../controllers/employee.controller");
const router = express.Router();


// CREATE
router.post("/create", createEmployee);

// GET ALL
router.get("/list", getAllEmployees);

// GET BY ID
router.get("/list/:id", getEmployeeById);

// UPDATE
router.put("/update/:id", updateEmployee);

// DELETE
router.delete("/delete/:id", deleteEmployee);

//= = = = = = =  Attendence Routes = = = = = = = 
router.post("/punch-in", punchIn);
router.post("/punch-out", punchOut);
router.get("/status/:employeeId", getPunchStatus);

module.exports = router;
