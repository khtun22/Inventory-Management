const express = require('express');
const router = express.Router();
const db = require('../models/db');

router.get('/alert', async (req, res) => {
    const userid = req.session.user.userid; 
    try {
        const [rows] = await db.query('SELECT storeid, storename FROM store WHERE userid = ?', [req.session.user.userid]);
        

        res.render('alert', { 
            user: req.session.user, 
            stores: rows, // Pass the stores to the page
            userid: req.session.user.userid 
        });
    } catch (error) {
        console.error('Error fetching stores or transaction ID:', error);
        res.render('out', { 
            user: req.session.user, 
            stores: [], 
            userid: req.session.user.userid 
        });
    }
});
router.post('/alert/updateItem', async (req, res) => {
    const { itemId, alertQty, alertCon, expDate, alertDate } = req.body;

    if (!itemId) {
        return res.status(400).send('Item ID is required.');
    }

    try {
        // Update item data in the item table
        await db.query(
            `UPDATE item 
             SET alertqty = ?, alertcon = ?, expdate = ?, alertdate = ?
             WHERE itemid = ?`,
            [alertQty, alertCon, expDate, alertDate, itemId]
        );

        res.status(200).send('Item updated successfully.');
    } catch (error) {
        console.error('Error updating item:', error);
        res.status(500).send('Failed to update item.');
    }
});


module.exports = router;