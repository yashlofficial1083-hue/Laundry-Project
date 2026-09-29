const express = require('express');
const { getDailyReport, getPaymentReport, printTaxReport, getOrderReport, getSalesReport, getClothWiseReport, exportExcelPaymentReport, printPaymentReport, printClothWiseReport, getAttendance, downloadAttendanceExcel, printAttendance } = require('../controllers/report.controller');

const router = express.Router();
// Payment Report API
router.get('/payments', getPaymentReport);
router.get('/payments/excel', exportExcelPaymentReport);
router.get('/payments/print', printPaymentReport);

// 1. Daily Reports API
router.get('/daily', getDailyReport);
router.get('/orders', getOrderReport);
router.get('/sales', getSalesReport);
router.get('/cloth-wise', getClothWiseReport);
router.get('/cloth-wise/print', printClothWiseReport);


router.get('/tax', printTaxReport);

router.get('/attedence', getAttendance);
router.get('/attedence/print', printAttendance);
router.get('/attendance/download', downloadAttendanceExcel);

module.exports = router;