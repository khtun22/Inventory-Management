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


router.post('/reportlist/reportalert/filter', async (req, res) => {
    const { filter } = req.body;
    const userid = req.session.user.userid;

    let extraCondition = ""; // Default is empty for "All"

    if (filter === "outofstock") {
        extraCondition = "AND i.itemqty = 0";
    } else if (filter === "lowstock") {
        extraCondition = `
            AND (
                (i.alertqty IS NOT NULL AND i.alertcon IS NULL AND i.itemqty < i.alertqty)
                OR (i.alertcon = 'lt' AND i.itemqty < i.alertqty)
                OR (i.alertcon = 'lte' AND i.itemqty <= i.alertqty)
                OR (i.itemqty = 0)
                OR (i.alertcon= '' AND i.itemqty <=i.alertqty)
            )
        `;
    } else if (filter === "overstock") {
        extraCondition = `
            AND (
                (i.alertcon = 'gt' AND i.itemqty > i.alertqty)
                OR (i.alertcon = 'gte' AND i.itemqty >= i.alertqty)
            )
        `;
    } else if (filter === "expire") {
        extraCondition = `
            AND (
                (i.expdate IS NOT NULL AND i.alertdate IS NULL AND i.expdate <= CURDATE())
                OR (i.expdate IS NOT NULL AND i.alertdate IS NOT NULL AND DATE_ADD(CURDATE(), INTERVAL i.alertdate DAY) >= i.expdate)
            )
        `;
    }

    try {
        const [alertItems] = await db.query(`
            SELECT 
                i.itemname, 
                s.storename, 
                c.categoryname, 
                i.itemqty, 
                i.alertqty, 
                i.alertcon, 
                i.expdate, 
                i.alertdate
            FROM item i
            JOIN category c ON i.categoryid = c.categoryid
            JOIN store s ON c.storeid = s.storeid
            WHERE s.userid = ?
            AND (
                (i.alertqty IS NOT NULL AND i.alertcon IS NULL AND i.itemqty < i.alertqty)
                OR (i.alertcon = 'lt' AND i.itemqty < i.alertqty)
                OR (i.alertcon = 'lte' AND i.itemqty <= i.alertqty)
                OR (i.alertcon = 'gt' AND i.itemqty > i.alertqty)
                OR (i.alertcon = 'gte' AND i.itemqty >= i.alertqty)
                OR (i.expdate IS NOT NULL AND i.alertdate IS NULL AND i.expdate <= CURDATE())
                OR (i.expdate IS NOT NULL AND i.alertdate IS NOT NULL AND DATE_ADD(CURDATE(), INTERVAL i.alertdate DAY) >= i.expdate)
                OR (i.itemqty = 0)
            ) 
            ${extraCondition} 
            ORDER BY s.storename ASC;
        `, [userid]);

        res.json(alertItems);
    } catch (error) {
        console.error('Error fetching alert items:', error);
        res.status(500).send('Error fetching alert items.');
    }
});

router.get('/reportlist/reportalert', async (req, res) => {
    const userid = req.session.user.userid;

    try {
        // SQL Query to get items that meet alert conditions
        const [alertItems] = await db.query(`
            SELECT 
                i.itemname, 
                s.storename, 
                c.categoryname, 
                i.itemqty, 
                i.alertqty, 
                i.alertcon, 
                i.expdate, 
                i.alertdate
            FROM item i
            JOIN category c ON i.categoryid = c.categoryid
            JOIN store s ON c.storeid = s.storeid
            WHERE s.userid = ? 
            AND (
                (i.alertqty IS NOT NULL AND i.alertcon IS NULL AND i.itemqty < i.alertqty)
                OR
                (i.alertcon = 'lt' AND i.itemqty < i.alertqty)
                OR
                (i.alertcon = 'lte' AND i.itemqty <= i.alertqty)
                OR
                (i.alertcon = 'gt' AND i.itemqty > i.alertqty)
                OR
                (i.alertcon = 'gte' AND i.itemqty >= i.alertqty)
                OR
                (i.expdate IS NOT NULL AND i.alertdate IS NULL AND i.expdate <= CURDATE())
                OR
                (i.expdate IS NOT NULL AND i.alertdate IS NOT NULL AND DATE_ADD(CURDATE(), INTERVAL i.alertdate DAY) >= i.expdate)
                OR
                (i.itemqty = 0)
                )
            ORDER BY s.storename ASC;
        `, [userid]);

        // Render the page with alert items
        res.render('reportlist/reportalert', { user: req.session.user, alertItems });

    } catch (error) {
        console.error('Error fetching alert items:', error);
        res.status(500).send('Error fetching alert items.');
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
    try {
      // Your SQL query joining transaction, transaction_detail, and item
      const [reportData] = await db.query(`
        SELECT t.transactionid, DATE_FORMAT(t.trandate, '%Y-%m-%d') AS trandate,
               i.itemname, IFNULL(DATE_FORMAT(i.expdate, '%Y-%m-%d'), 'N/A') AS expdate,
               td.tranqty, s.storename, c.categoryname
        FROM transaction t
        JOIN transaction_detail td ON t.transactionid = td.transactionid
        JOIN item i ON td.itemid = i.itemid
        JOIN category c ON i.categoryid=c.categoryid
        JOIN store s ON s.storeid= c.storeid
        WHERE t.tranname = 'IN' AND t.userid = ?
        ORDER BY t.trandate DESC
      `, [req.session.user.userid]);
  
      res.render('reportlist/reportin', { user: req.session.user, reportData });
    } catch (error) {
      console.error('Error fetching incoming transactions:', error);
      res.render('reportlist/reportin', { user: req.session.user, reportData: [] });
    }
});

router.post('/reportlist/reportin/filter', async (req, res) => {
    const { filterId, startDate, endDate } = req.body;
    const userid = req.session.user.userid;
  
    try {
      let query = `
        SELECT t.transactionid, DATE_FORMAT(t.trandate, '%Y-%m-%d') AS trandate,
               i.itemname, IFNULL(DATE_FORMAT(i.expdate, '%Y-%m-%d'), 'N/A') AS expdate,
               td.tranqty, s.storename, c.categoryname
        FROM transaction t
        JOIN transaction_detail td ON t.transactionid = td.transactionid
        JOIN item i ON td.itemid = i.itemid
        JOIN category c ON i.categoryid = c.categoryid
        JOIN store s ON s.storeid = c.storeid
        WHERE t.tranname = 'IN' AND t.userid = ?
      `;

      let queryParams = [userid];

      // Apply Transaction ID filter if provided
      if (filterId) {
        query += ` AND t.transactionid = ?`;
        queryParams.push(filterId);
      }

      // Apply Date Range filter if provided
      if (startDate && endDate) {
        query += ` AND t.trandate BETWEEN ? AND ?`;
        queryParams.push(startDate, `${endDate} 23:59:59`);
      } else if (startDate) {
        query += ` AND t.trandate >= ?`;
        queryParams.push(startDate);
      } else if (endDate) {
        query += ` AND t.trandate <= ?`;
        queryParams.push(`${endDate} 23:59:59`);
      }

      query += ` ORDER BY t.trandate DESC`;

      const [filteredData] = await db.query(query, queryParams);
      res.json(filteredData);
    } catch (error) {
      console.error('Error fetching filtered incoming transactions:', error);
      res.status(500).json([]);
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
    try {
      // Your SQL query joining transaction, transaction_detail, and item
      const [reportData] = await db.query(`
        SELECT t.transactionid, DATE_FORMAT(t.trandate, '%Y-%m-%d') AS trandate,
               i.itemname, IFNULL(DATE_FORMAT(i.expdate, '%Y-%m-%d'), 'N/A') AS expdate,
               td.tranqty, s.storename, c.categoryname
        FROM transaction t
        JOIN transaction_detail td ON t.transactionid = td.transactionid
        JOIN item i ON td.itemid = i.itemid
        JOIN category c ON i.categoryid=c.categoryid
        JOIN store s ON s.storeid= c.storeid
        WHERE t.tranname = 'OUT' AND t.userid = ?
        ORDER BY t.trandate DESC
      `, [req.session.user.userid]);
  
      res.render('reportlist/reportout', { user: req.session.user, reportData });
    } catch (error) {
      console.error('Error fetching incoming transactions:', error);
      res.render('reportlist/reportout', { user: req.session.user, reportData: [] });
    }
});

router.post('/reportlist/reportout/filter', async (req, res) => {
    const { filterId, startDate, endDate } = req.body;
    const userid = req.session.user.userid;
  
    try {
      let query = `
        SELECT t.transactionid, DATE_FORMAT(t.trandate, '%Y-%m-%d') AS trandate,
               i.itemname, IFNULL(DATE_FORMAT(i.expdate, '%Y-%m-%d'), 'N/A') AS expdate,
               td.tranqty, s.storename, c.categoryname
        FROM transaction t
        JOIN transaction_detail td ON t.transactionid = td.transactionid
        JOIN item i ON td.itemid = i.itemid
        JOIN category c ON i.categoryid = c.categoryid
        JOIN store s ON s.storeid = c.storeid
        WHERE t.tranname = 'OUT' AND t.userid = ?
      `;

      let queryParams = [userid];

      // Apply Transaction ID filter if provided
      if (filterId) {
        query += ` AND t.transactionid = ?`;
        queryParams.push(filterId);
      }

      // Apply Date Range filter if provided
      if (startDate && endDate) {
        query += ` AND t.trandate BETWEEN ? AND ?`;
        queryParams.push(startDate, `${endDate} 23:59:59`);
      } else if (startDate) {
        query += ` AND t.trandate >= ?`;
        queryParams.push(startDate);
      } else if (endDate) {
        query += ` AND t.trandate <= ?`;
        queryParams.push(`${endDate} 23:59:59`);
      }

      query += ` ORDER BY t.trandate DESC`;

      const [filteredData] = await db.query(query, queryParams);
      res.json(filteredData);
    } catch (error) {
      console.error('Error fetching filtered incoming transactions:', error);
      res.status(500).json([]);
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
    try {
      // Your SQL query joining transaction, transaction_detail, and item
      const [reportData] = await db.query(`
        SELECT t.transactionid, DATE_FORMAT(t.trandate, '%Y-%m-%d') AS trandate,
               i.itemname, IFNULL(DATE_FORMAT(i.expdate, '%Y-%m-%d'), 'N/A') AS expdate,
               td.tranqty,  s1.storename AS sourceStore, c1.categoryname AS sourceCategory, 
                s2.storename AS targetStore, c2.categoryname AS targetCategory
        FROM transaction t
            LEFT JOIN transaction_detail td ON t.transactionid = td.transactionid
            LEFT JOIN item i ON td.itemid = i.itemid
            LEFT JOIN category c1 ON t.sourceid = c1.categoryid OR i.categoryid = c1.categoryid
            LEFT JOIN store s1 ON c1.storeid = s1.storeid
            LEFT JOIN category c2 ON t.targetid = c2.categoryid
            LEFT JOIN store s2 ON c2.storeid = s2.storeid
            LEFT JOIN user u ON s1.userid = u.userid
        WHERE t.tranname = 'TRAN' AND t.userid = ?
        ORDER BY t.trandate DESC
      `, [req.session.user.userid]);
  
      res.render('reportlist/reporttransfer', { user: req.session.user, reportData });
    } catch (error) {
      console.error('Error fetching incoming transactions:', error);
      res.render('reportlist/reporttransfer', { user: req.session.user, reportData: [] });
    }
});

router.post('/reportlist/reporttransfer/filter', async (req, res) => {
    const { filterId, startDate, endDate } = req.body;
    const userid = req.session.user.userid;
    try {
      let query = `
        SELECT t.transactionid, DATE_FORMAT(t.trandate, '%Y-%m-%d') AS trandate,
               i.itemname, IFNULL(DATE_FORMAT(i.expdate, '%Y-%m-%d'), 'N/A') AS expdate,
               td.tranqty,  s1.storename AS sourceStore, c1.categoryname AS sourceCategory, 
                s2.storename AS targetStore, c2.categoryname AS targetCategory
        FROM transaction t
            LEFT JOIN transaction_detail td ON t.transactionid = td.transactionid
            LEFT JOIN item i ON td.itemid = i.itemid
            LEFT JOIN category c1 ON t.sourceid = c1.categoryid OR i.categoryid = c1.categoryid
            LEFT JOIN store s1 ON c1.storeid = s1.storeid
            LEFT JOIN category c2 ON t.targetid = c2.categoryid
            LEFT JOIN store s2 ON c2.storeid = s2.storeid
            LEFT JOIN user u ON s1.userid = u.userid
        WHERE t.tranname = 'TRAN' AND t.userid = ?
      `;

      let queryParams = [userid];

      // Apply Transaction ID filter if provided
      if (filterId) {
        query += ` AND t.transactionid = ?`;
        queryParams.push(filterId);
      }

      // Apply Date Range filter if provided
      if (startDate && endDate) {
        query += ` AND t.trandate >= ? AND t.trandate <=?`;
        queryParams.push(startDate, `${endDate} 23:59:59`);
      } else if (startDate) {
        query += ` AND t.trandate >= ?`;
        queryParams.push(startDate);
      } else if (endDate) {
        query += ` AND t.trandate <= ?`;
        queryParams.push(`${endDate} 23:59:59`);
      }

      query += ` ORDER BY t.trandate DESC`;

      const [filteredData] = await db.query(query, queryParams);
      res.json(filteredData);
    } catch (error) {
      console.error('Error fetching filtered incoming transactions:', error);
      res.status(500).json([]);
    }
});

module.exports = router;