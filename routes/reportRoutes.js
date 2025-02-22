const express = require('express');
const router = express.Router();
const db = require('../models/db');

router.get('/report', async (req, res) => {
    const userid = req.session.user.userid; 
    try {
        res.render('report', { 
            user: req.session.user, 
            userid: req.session.user.userid 
        });
    } catch (error) {
        res.render('report', { 
            user: req.session.user, 
            userid: req.session.user.userid 
        });
    }
});

router.post('/reportadjustment/getAdjustment', async (req, res) => {
    const { startDate, endDate } = req.body;
    const userId = req.session.user.userid;
    try {
        // Base query
        let query = `
            SELECT adjustmentid, reason, adjustdate, description, adjtotalqty 
            FROM adjustment 
            WHERE userid = ?
        `;
        const queryParams = [userId];

        

        // Apply date range
        if (startDate) {
            query += ` AND adjustdate >= ?`;
            queryParams.push(startDate);
        }
        if (endDate) {
            query += ` AND adjustdate <= ?`;
            queryParams.push(endDate);
        }
        query += ` ORDER BY adjustdate DESC;`;

        // Execute query
        const [results] = await db.query(query, queryParams);
        
        // Format results for the frontend
        const adjustment = results.map(row => {
            const adjustdate = new Date(row.adjustdate);
            const formattedDate = `${adjustdate.getDate().toString().padStart(2, '0')}-${(adjustdate.getMonth() + 1)
                .toString()
                .padStart(2, '0')}-${adjustdate.getFullYear()} ${adjustdate
                .getHours()
                .toString()
                .padStart(2, '0')}:${adjustdate.getMinutes().toString().padStart(2, '0')}`;
                    
            return {
                adjustmentid: row.adjustmentid,
                adjustdate: formattedDate, // New format
                reason: row.reason,
                description: row.description,
                adjtotalqty: row.adjtotalqty,
            };
        });

        res.json(adjustment);
    } catch (error) {
        console.error('Error fetching adjustment:', error);
        res.status(500).send('An error occurred while fetching adjustment.');
    }
});
router.get('/reportlist/reportadjustment', async (req, res) => {
    const userid = req.session.user.userid; 
    try {
        res.render('reportlist/reportadjustment', { 
            user: req.session.user, 
            userid: req.session.user.userid 
        });
    } catch (error) {
        console.error('Error fetching stores or adjustment ID:', error);
        res.render('reportlist/reportadjustment', { 
            user: req.session.user, 
            userid: req.session.user.userid 
        });
    }
});

router.get('/reportlist/reportadjustmentdetail', async (req, res) => {
    const userid = req.session.user.userid; 
    try {
        res.render('reportlist/reportadjustmentdetail', { 
            user: req.session.user, 
            userid: req.session.user.userid 
        });
    } catch (error) {
        console.error('Error fetching stores or adjustment ID:', error);
        res.render('reportlist/reportadjustmentdetail', { 
            user: req.session.user, 
            userid: req.session.user.userid 
        });
    }
});
router.post('/reportlist/reportadjustmentdetail', async (req, res) => {
    const { adjustmentid } = req.body;
    const userid = req.session.user.userid;

    try {
        // Fetch adjustment data
        const [adjustmentResults] = await db.query(
            `SELECT adjustmentid, adjustdate, reason, description, adjtotalqty 
             FROM adjustment 
             WHERE adjustmentid = ? AND userid = ?`,
            [adjustmentid, userid]
        );

        if (adjustmentResults.length === 0) {
            return res.status(404).send('Adjustment not found.');
        }

        let adjustment = adjustmentResults[0];

        // Format the adjustdate to YYYY-MM-DD
        const adjustDate = new Date(adjustment.adjustdate);
        adjustment.adjustdate = adjustDate.toISOString().split('T')[0]; // Formats to YYYY-MM-DD

        // Get the first item in adjustment_detail to fetch category and store details
        const [firstItem] = await db.query(
            `SELECT ad.itemid, i.categoryid 
             FROM adjustment_detail ad 
             JOIN item i ON ad.itemid = i.itemid 
             WHERE ad.adjustmentid = ? 
             LIMIT 1`,
            [adjustmentid]
        );

        let storeName = '';
        let categoryName = '';

        if (firstItem.length > 0) {
            const categoryId = firstItem[0].categoryid;

            // Fetch category and store data
            const [categoryResults] = await db.query(
                `SELECT c.categoryname, s.storename 
                 FROM category c 
                 JOIN store s ON c.storeid = s.storeid 
                 WHERE c.categoryid = ?`,
                [categoryId]
            );

            if (categoryResults.length > 0) {
                categoryName = categoryResults[0].categoryname;
                storeName = categoryResults[0].storename;
            }
        }

        // Get item details for adjustment
        const [items] = await db.query(
            `SELECT i.itemname, ad.adjustqty, i.expdate
             FROM adjustment_detail ad
             JOIN item i ON ad.itemid = i.itemid
             WHERE ad.adjustmentid = ?`,
            [adjustmentid]
        );

        // Format expdate for each item
        items.forEach(item => {
            if (item.expdate) {
                const expDate = new Date(item.expdate);
                item.expdate = expDate.toISOString().split('T')[0]; // Formats to YYYY-MM-DD
            } else {
                item.expdate = 'N/A'; // If no date, display 'N/A'
            }
        });

        // Render the page with all the fetched data
        res.render('reportlist/reportadjustmentdetail', { 
            user: req.session.user, 
            adjustment, 
            storeName, 
            categoryName, 
            items
        });

    } catch (error) {
        console.error('Error fetching adjustment details:', error);
        res.status(500).send('An error occurred while fetching adjustment details.');
    }
});


router.get('/reportlist/reportalert', async (req, res) => {
    const userid = req.session.user.userid; 
    try {
        res.render('reportlist/reportalert', { 
            user: req.session.user, 
            userid: req.session.user.userid 
        });
    } catch (error) {
        console.error('Error fetching stores or transaction ID:', error);
        res.render('reportlist/reportalert', { 
            user: req.session.user, 
            userid: req.session.user.userid 
        });
    }
});
router.get('/reportlist/reportcategory', async (req, res) => {
    const userid = req.session.user.userid;
    try {
        const [category] = await db.query('SELECT c.categoryname, s.storename FROM category c JOIN store s ON s.storeid=c.storeid WHERE userid = ?', [userid]);
        res.render('reportlist/reportcategory', { 
            user: req.session.user, 
            userid,
            category
        });
    } catch (error) {
        console.error('Error fetching stores:', error);
        res.render('reportlist/reportcategory', { 
            user: req.session.user, 
            userid,
            category: []
        });
    }
});
router.get('/reportlist/reportedithistory', async (req, res) => {
    const userid = req.session.user.userid; 
    try {
        res.render('reportlist/reportedithistory', { 
            user: req.session.user, 
            userid: req.session.user.userid 
        });
    } catch (error) {
        console.error('Error fetching stores or transaction ID:', error);
        res.render('reportlist/reportedithistory', { 
            user: req.session.user, 
            userid: req.session.user.userid 
        });
    }
});
router.get('/reportlist/reportin', async (req, res) => {
    const userid = req.session.user.userid; 
    try {
        res.render('reportlist/reportin', { 
            user: req.session.user, 
            userid: req.session.user.userid 
        });
    } catch (error) {
        console.error('Error fetching stores or transaction ID:', error);
        res.render('reportlist/reportin', { 
            user: req.session.user, 
            userid: req.session.user.userid 
        });
    }
});
router.get('/reportlist/reportitem', async (req, res) => {
    const userid = req.session.user.userid;
    try {
        const [item] = await db.query(
            'SELECT i.itemname, i.itemqty, i.alertqty, i.alertcon, i.expdate, i.alertdate, c.categoryname, s.storename FROM item i JOIN category c ON c.categoryid=i.categoryid JOIN store s ON s.storeid=c.storeid WHERE userid = ?', [userid]);
        res.render('reportlist/reportitem', { 
            user: req.session.user, 
            userid,
            item
        });
    } catch (error) {
        console.error('Error fetching stores:', error);
        res.render('reportlist/reportitem', { 
            user: req.session.user, 
            userid,
            item: []
        });
    }
});

router.get('/reportlist/reportout', async (req, res) => {
    const userid = req.session.user.userid; 
    try {
        res.render('reportlist/reportout', { 
            user: req.session.user, 
            userid: req.session.user.userid 
        });
    } catch (error) {
        console.error('Error fetching stores or transaction ID:', error);
        res.render('reportlist/reportout', { 
            user: req.session.user, 
            userid: req.session.user.userid 
        });
    }
});

router.get('/reportlist/reportstore', async (req, res) => {
    const userid = req.session.user.userid;
    try {
        const [stores] = await db.query('SELECT storename FROM store WHERE userid = ?', [userid]);
        res.render('reportlist/reportstore', { 
            user: req.session.user, 
            userid,
            stores
        });
    } catch (error) {
        console.error('Error fetching stores:', error);
        res.render('reportlist/reportstore', { 
            user: req.session.user, 
            userid,
            stores: []
        });
    }
});


router.get('/reportlist/reporttransfer', async (req, res) => {
    const userid = req.session.user.userid; 
    try {
        res.render('reportlist/reporttransfer', { 
            user: req.session.user, 
            userid: req.session.user.userid 
        });
    } catch (error) {
        console.error('Error fetching stores or transaction ID:', error);
        res.render('reportlist/reporttransfer', { 
            user: req.session.user, 
            userid: req.session.user.userid 
        });
    }
});

module.exports = router;