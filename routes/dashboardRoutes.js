const express = require('express');
const router = express.Router();
const db = require('../models/db'); // Import the db module

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
    const filter = req.query.filter || "current"; 
    try {

        if (!userId) {
            console.error("User ID is undefined.");
            return res.redirect('/login');
        }

        // Query to count all items
        const allCountQuery = `SELECT COUNT(i.itemid) AS allcount FROM item i
                               LEFT JOIN category c ON c.categoryid = i.categoryid
                               LEFT JOIN store s ON c.storeid = s.storeid
                               WHERE s.userid = ?`;

        // Query to count low stock items
        const lowStockQuery = `SELECT COUNT(i.itemid) AS lowstock FROM item i
                               JOIN category c ON i.categoryid = c.categoryid
                               JOIN store s ON c.storeid = s.storeid
                               WHERE s.userid = ? 
                               AND (
                                   (i.alertqty IS NOT NULL AND i.alertcon IS NULL AND i.itemqty < i.alertqty)
                                   OR (i.alertcon = 'lt' AND i.itemqty < i.alertqty)
                                   OR (i.alertcon = 'lte' AND i.itemqty <= i.alertqty)
                                   OR (i.itemqty = 0)
                               )`;

        // Query to count overstock items
        const overStockQuery = `SELECT COUNT(i.itemid) AS overstock FROM item i
                                JOIN category c ON i.categoryid = c.categoryid
                                JOIN store s ON c.storeid = s.storeid
                                WHERE s.userid = ? 
                                AND (
                                    (i.alertcon = 'gt' AND i.itemqty > i.alertqty)
                                    OR (i.alertcon = 'gte' AND i.itemqty >= i.alertqty)
                                )`;

        // Query to count expired items
        const expireQuery = `SELECT COUNT(i.itemid) AS expiredate FROM item i
                             JOIN category c ON i.categoryid = c.categoryid
                             JOIN store s ON c.storeid = s.storeid
                             WHERE s.userid = ? 
                             AND (
                                 (i.expdate IS NOT NULL AND i.alertdate IS NULL AND i.expdate <= CURDATE())
                                 OR (i.expdate IS NOT NULL AND i.alertdate IS NOT NULL AND DATE_ADD(CURDATE(), INTERVAL i.alertdate DAY) >= i.expdate)
                             )`;

        const instockQuery = `SELECT sum(i.itemqty) AS InstockQty
                                FROM item i
                                JOIN category c ON i.categoryid = c.categoryid
                                JOIN store s ON c.storeid = s.storeid
                                WHERE s.userid = ? `;

                            
        let dateCondition, dateAdjCondition;
        if (filter === "last") {
            dateCondition = "MONTH(trandate) = MONTH(CURRENT_DATE() - INTERVAL 1 MONTH) AND YEAR(trandate) = YEAR(CURRENT_DATE() - INTERVAL 1 MONTH)";
            dateAdjCondition = "MONTH(adjustdate) = MONTH(CURRENT_DATE() - INTERVAL 1 MONTH) AND YEAR(adjustdate) = YEAR(CURRENT_DATE() - INTERVAL 1 MONTH)";
        } else if (filter === "last3") {
            dateCondition = "trandate >= DATE_SUB(CURRENT_DATE(), INTERVAL 3 MONTH)";
            dateAdjCondition = "adjustdate >= DATE_SUB(CURRENT_DATE(), INTERVAL 3 MONTH)";
        } else {
            dateCondition = "MONTH(trandate) = MONTH(CURRENT_DATE()) AND YEAR(trandate) = YEAR(CURRENT_DATE())";
            dateAdjCondition = "MONTH(adjustdate) = MONTH(CURRENT_DATE()) AND YEAR(adjustdate) = YEAR(CURRENT_DATE())";
        }

        // Queries with dynamic date condition
        const incomingQuery = `SELECT COUNT(transactionid) AS INCount 
                                FROM transaction 
                                WHERE tranname ='IN' 
                                AND ${dateCondition} AND userid = ?`;
                                
        const outgoingQuery = `SELECT COUNT(transactionid) AS OutCount 
                                FROM transaction 
                                WHERE tranname ='OUT' 
                                AND ${dateCondition} AND userid = ?`;

        const transferQuery = `SELECT COUNT(transactionid) AS TranCount 
                                FROM transaction 
                                WHERE tranname ='TRAN' 
                                AND ${dateCondition} AND userid = ?`;

        const adjustmentQuery = `SELECT COUNT(adjustmentid) AS AdjCount 
                                FROM adjustment 
                                WHERE ${dateAdjCondition}
                                AND userid = ?`;

        
                                
        // Execute queries
        const [allCountResult] = await db.query(allCountQuery, [userId]);
        const [lowStockResult] = await db.query(lowStockQuery, [userId]);
        const [overStockResult] = await db.query(overStockQuery, [userId]);
        const [expireResult] = await db.query(expireQuery, [userId]);
        const [instockResult] = await db.query(instockQuery, [userId]);
        const [incomingResult] = await db.query(incomingQuery, [userId]);
        const [outgoingResult] = await db.query(outgoingQuery, [userId]);
        const [transferResult] = await db.query(transferQuery, [userId]);
        const [adjustmentResult] = await db.query(adjustmentQuery, [userId]);

        // Extract values
        const allcount = allCountResult.length > 0 ? allCountResult[0].allcount : 0;
        const lowstock = lowStockResult.length > 0 ? lowStockResult[0].lowstock : 0;
        const overstock = overStockResult.length > 0 ? overStockResult[0].overstock : 0;
        const expiredate = expireResult.length > 0 ? expireResult[0].expiredate : 0;
        const instockqty = instockResult.length > 0 ? instockResult[0].InstockQty : 0;
        const incomingqty = incomingResult.length > 0 ? incomingResult[0].INCount : 0;

        const outgoingqty = outgoingResult.length > 0 ? outgoingResult[0].OutCount : 0;
        const transferqty = transferResult.length > 0 ? transferResult[0].TranCount : 0;
        const adjustmentqty = adjustmentResult.length > 0 ? adjustmentResult[0].AdjCount : 0;

        // Pass data to the EJS template
        res.render('dashboard', {
            user: req.session.user,
            allcount,
            lowstock,
            overstock,
            expiredate,
            instockqty,
            incomingqty,
            outgoingqty,
            transferqty,
            adjustmentqty,
            selectedFilter: filter
        });

    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        res.status(500).send('Internal Server Error');
    }
});

router.get('/dashboard/chart-data', async (req, res) => {
    const userId = req.session.user.userid;
    const filter = req.query.filter || "current"; // Default to This Month

    try {
        if (!userId) {
            return res.status(401).json({ success: false, message: "User not logged in" });
        }

        let dateCondition, dateAdjCondition;
        if (filter === "last") {
            dateCondition = "MONTH(trandate) = MONTH(CURRENT_DATE() - INTERVAL 1 MONTH) AND YEAR(trandate) = YEAR(CURRENT_DATE() - INTERVAL 1 MONTH)";
            dateAdjCondition = "MONTH(adjustdate) = MONTH(CURRENT_DATE() - INTERVAL 1 MONTH) AND YEAR(adjustdate) = YEAR(CURRENT_DATE() - INTERVAL 1 MONTH)";
        } else if (filter === "last3") {
            dateCondition = "trandate >= DATE_SUB(CURRENT_DATE(), INTERVAL 3 MONTH)";
            dateAdjCondition = "adjustdate >= DATE_SUB(CURRENT_DATE(), INTERVAL 3 MONTH)";
        } else {
            dateCondition = "MONTH(trandate) = MONTH(CURRENT_DATE()) AND YEAR(trandate) = YEAR(CURRENT_DATE())";
            dateAdjCondition = "MONTH(adjustdate) = MONTH(CURRENT_DATE()) AND YEAR(adjustdate) = YEAR(CURRENT_DATE())";
        }

        const incomingQuery = `SELECT COUNT(transactionid) AS INCount FROM transaction WHERE tranname ='IN' AND ${dateCondition} AND userid = ?`;
        const outgoingQuery = `SELECT COUNT(transactionid) AS OutCount FROM transaction WHERE tranname ='OUT' AND ${dateCondition} AND userid = ?`;
        const transferQuery = `SELECT COUNT(transactionid) AS TranCount FROM transaction WHERE tranname ='TRAN' AND ${dateCondition} AND userid = ?`;
        const adjustmentQuery = `SELECT COUNT(adjustmentid) AS AdjCount FROM adjustment WHERE ${dateAdjCondition} AND userid = ?`;

        const [incomingResult] = await db.query(incomingQuery, [userId]);
        const [outgoingResult] = await db.query(outgoingQuery, [userId]);
        const [transferResult] = await db.query(transferQuery, [userId]);
        const [adjustmentResult] = await db.query(adjustmentQuery, [userId]);

        res.json({
            success: true,
            incomingqty: incomingResult[0].INCount || 0,
            outgoingqty: outgoingResult[0].OutCount || 0,
            transferqty: transferResult[0].TranCount || 0,
            adjustmentqty: adjustmentResult[0].AdjCount || 0
        });

    } catch (error) {
        console.error('Error fetching activity chart data:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

module.exports = router;
