const express = require('express');
const router = express.Router();
const db = require('../models/db'); 

// Middleware to check if user is logged in
router.use((req, res, next) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    next();
});

// Dashboard Route
router.get('/dashboard', async (req, res) => {
    const userId = req.session.user.userid;
    try {
        if (!userId) {
            return res.redirect('/login');
        }

        // Get default current month data
        const [incomingResult] = await db.query(
            `SELECT COUNT(transactionid) AS INCount FROM transaction 
            WHERE tranname = 'IN' AND MONTH(trandate) = MONTH(CURRENT_DATE()) 
            AND YEAR(trandate) = YEAR(CURRENT_DATE()) AND userid = ?`, 
            [userId]
        );

        const [outgoingResult] = await db.query(
            `SELECT COUNT(transactionid) AS OutCount FROM transaction 
            WHERE tranname = 'OUT' AND MONTH(trandate) = MONTH(CURRENT_DATE()) 
            AND YEAR(trandate) = YEAR(CURRENT_DATE()) AND userid = ?`, 
            [userId]
        );

        const [transferResult] = await db.query(
            `SELECT COUNT(transactionid) AS TranCount FROM transaction 
            WHERE tranname = 'TRAN' AND MONTH(trandate) = MONTH(CURRENT_DATE()) 
            AND YEAR(trandate) = YEAR(CURRENT_DATE()) AND userid = ?`, 
            [userId]
        );

        const [adjustmentResult] = await db.query(
            `SELECT COUNT(adjustmentid) AS AdjCount FROM adjustment 
            WHERE MONTH(adjustdate) = MONTH(CURRENT_DATE()) 
            AND YEAR(adjustdate) = YEAR(CURRENT_DATE()) AND userid = ?`, 
            [userId]
        );

        res.render('dashboard', {
            user: req.session.user,
            incomingqty: incomingResult[0].INCount || 0,
            outgoingqty: outgoingResult[0].OutCount || 0,
            transferqty: transferResult[0].TranCount || 0,
            adjustmentqty: adjustmentResult[0].AdjCount || 0
        });
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        res.status(500).send('Internal Server Error');
    }
});

// API Route to get filtered data for Activity Chart
router.get('/dashboard/activity/:filter', async (req, res) => {
    const userId = req.session.user.userid;
    const filter = req.params.filter;

    let dateCondition = "MONTH(trandate) = MONTH(CURRENT_DATE()) AND YEAR(trandate) = YEAR(CURRENT_DATE())"; 

    if (filter === "last") {
        dateCondition = "MONTH(trandate) = MONTH(CURRENT_DATE() - INTERVAL 1 MONTH) AND YEAR(trandate) = YEAR(CURRENT_DATE() - INTERVAL 1 MONTH)";
    } else if (filter === "last3") {
        dateCondition = "trandate >= DATE_SUB(CURDATE(), INTERVAL 3 MONTH)";
    }

    try {
        const [incomingResult] = await db.query(
            `SELECT COUNT(transactionid) AS INCount FROM transaction 
            WHERE tranname = 'IN' AND ${dateCondition} AND userid = ?`, 
            [userId]
        );

        const [outgoingResult] = await db.query(
            `SELECT COUNT(transactionid) AS OutCount FROM transaction 
            WHERE tranname = 'OUT' AND ${dateCondition} AND userid = ?`, 
            [userId]
        );

        const [transferResult] = await db.query(
            `SELECT COUNT(transactionid) AS TranCount FROM transaction 
            WHERE tranname = 'TRAN' AND ${dateCondition} AND userid = ?`, 
            [userId]
        );

        const [adjustmentResult] = await db.query(
            `SELECT COUNT(adjustmentid) AS AdjCount FROM adjustment 
            WHERE adjustdate >= DATE_SUB(CURDATE(), INTERVAL 3 MONTH) AND userid = ?`, 
            [userId]
        );

        res.json({
            incomingqty: incomingResult[0].INCount || 0,
            outgoingqty: outgoingResult[0].OutCount || 0,
            transferqty: transferResult[0].TranCount || 0,
            adjustmentqty: adjustmentResult[0].AdjCount || 0
        });
    } catch (error) {
        console.error('Error fetching activity data:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;
