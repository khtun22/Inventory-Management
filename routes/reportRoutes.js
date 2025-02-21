const express = require('express');
const router = express.Router();
const db = require('../models/db');

router.get('/report', async (req, res) => {
    const userid = req.session.user.userid; 
    try {
        const [rows] = await db.query('SELECT storeid, storename FROM store WHERE userid = ?', [req.session.user.userid]);
        

        res.render('report', { 
            user: req.session.user, 
            stores: rows, // Pass the stores to the page
            userid: req.session.user.userid 
        });
    } catch (error) {
        console.error('Error fetching stores or transaction ID:', error);
        res.render('report', { 
            user: req.session.user, 
            stores: [], 
            userid: req.session.user.userid 
        });
    }
});


module.exports = router;