const express = require('express');
const router = express.Router();
const db = require('../models/db'); // Import the db module

router.get('/editHistory', (req, res) => {
    res.render('editHistory', { 
        user: req.session.user, 
        userid: req.session.user.userid // Ensure the correct field
    });
});

router.post('/editHistory/getTransactions', async (req, res) => {
    const { filter, startDate, endDate } = req.body;
    const userId = req.session.user.userid;
    
    try {
        // Base query
        let query = `
            SELECT 
                DISTINCT t.transactionid, t.tranname, t.trantotalqty, t.trandate, 
                s1.storename AS sourceStore, c1.categoryname AS sourceCategory, 
                s2.storename AS targetStore, c2.categoryname AS targetCategory
            FROM transaction t
            LEFT JOIN transaction_detail td ON t.transactionid = td.transactionid
            LEFT JOIN item i ON td.itemid = i.itemid
            LEFT JOIN category c1 ON t.sourceid = c1.categoryid OR i.categoryid = c1.categoryid
            LEFT JOIN store s1 ON c1.storeid = s1.storeid
            LEFT JOIN category c2 ON t.targetid = c2.categoryid
            LEFT JOIN store s2 ON c2.storeid = s2.storeid
            LEFT JOIN user u ON s1.userid = u.userid
            WHERE u.userid = ?
            
        `;
        const queryParams = [userId];

        // Apply filter
        if (filter !== 'ALL') {
            query += ` AND t.tranname = ?`;
            queryParams.push(filter);
        }

        // Apply date range
        if (startDate) {
            query += ` AND t.trandate >= ?`;
            queryParams.push(startDate);
        }
        if (endDate) {
            query += ` AND t.trandate <= ?`;
            queryParams.push(endDate);
        }
        query += ` ORDER BY t.trandate DESC;`;

        // Execute query
        const [results] = await db.query(query, queryParams);
        
        // Format results for the frontend
        const transactions = results.map(row => {
            const trandate = new Date(row.trandate);
            const formattedDate = `${trandate.getDate().toString().padStart(2, '0')}-${(trandate.getMonth() + 1)
                .toString()
                .padStart(2, '0')}-${trandate.getFullYear()} ${trandate
                .getHours()
                .toString()
                .padStart(2, '0')}:${trandate.getMinutes().toString().padStart(2, '0')}`;
            
            const sourceLocation =
            row.sourceStore && row.sourceCategory
                ? `${row.sourceStore}, ${row.sourceCategory}`
                : "None";
        
            const targetLocation =
                row.targetStore && row.targetCategory
                    ? `${row.targetStore}, ${row.targetCategory}`
                    : "None";        
            return {
                transactionid: row.transactionid,
                tranname: row.tranname,
                trantotalqty: row.trantotalqty,
                trandate: formattedDate, // New format
                sourceLocation,
                targetLocation,
            };
        });

        res.json(transactions);
    } catch (error) {
        console.error('Error fetching transactions:', error);
        res.status(500).send('An error occurred while fetching transactions.');
    }
});
router.post('/editHistorydetail/save', async (req, res) => {
    const { transactionId, tranName, editedItems, totalQty } = req.body;
    const userid = req.session.user.userid;
    try {
        // Start a Transaction
        await db.query('START TRANSACTION');

        // Loop through each edited item
        for (const item of editedItems) {
            const { itemId, editedQty, originalQty } = item;

            if (tranName === 'Incoming' || tranName === 'Outgoing') {
                // IN and OUT Transaction: Update itemqty and tranqty
                const [currentItem] = await db.query(
                    `SELECT itemqty FROM item WHERE itemid = ?`,
                    [itemId]
                );
                const currentQty = currentItem[0].itemqty;
                const newItemQty = editedQty - originalQty + currentQty;

                // Update item table
                await db.query(
                    `UPDATE item SET itemqty = ? WHERE itemid = ?`,
                    [newItemQty, itemId]
                );

                // Update transaction_detail table
                await db.query(
                    `UPDATE transaction_detail SET tranqty = ? WHERE transactionid = ? AND itemid = ?`,
                    [editedQty, transactionId, itemId]
                );

            } else if (tranName === 'Transfer') {
                // TRANSFER Transaction: Update itemqty for both source and target
                const [transferDetails] = await db.query(
                    `SELECT itemid, titemid FROM transaction_detail 
                     WHERE transactionid = ? AND itemid = ?`,
                    [transactionId, itemId]
                );

                if (transferDetails.length > 0) {
                    const sourceItemId = transferDetails[0].itemid;
                    const targetItemId = transferDetails[0].titemid;

                    // Update Source Item (itemid)
                    const [sourceItem] = await db.query(
                        `SELECT itemqty FROM item WHERE itemid = ?`,
                        [sourceItemId]
                    );
                    const sourceCurrentQty = sourceItem[0].itemqty;
                    const newSourceQty = editedQty - originalQty + sourceCurrentQty;

                    await db.query(
                        `UPDATE item SET itemqty = ? WHERE itemid = ?`,
                        [newSourceQty, sourceItemId]
                    );

                    // Update Target Item (titemid)
                    const [targetItem] = await db.query(
                        `SELECT itemqty FROM item WHERE itemid = ?`,
                        [targetItemId]
                    );
                    const targetCurrentQty = targetItem[0].itemqty;
                    const newTargetQty = editedQty - originalQty + targetCurrentQty;

                    await db.query(
                        `UPDATE item SET itemqty = ? WHERE itemid = ?`,
                        [newTargetQty, targetItemId]
                    );

                    // Update transaction_detail table for both itemid and titemid
                    await db.query(
                        `UPDATE transaction_detail 
                         SET tranqty = ? 
                         WHERE transactionid = ? AND itemid = ?`,
                        [editedQty, transactionId, sourceItemId]
                    );
                    
                }
            }
        }
        await db.query(
            `UPDATE transaction SET trantotalqty = trantotalqty + ? WHERE transactionid = ?`,
            [totalQty, transactionId]
        );

        // Commit the Transaction
        await db.query('COMMIT');
        res.status(200).send('Transaction updated successfully.');
    } catch (error) {
        await db.query('ROLLBACK');
        console.error('Error updating transaction:', error);
        res.status(500).send('An error occurred while updating the transaction.');
    }
});

router.post('/editHistorydetail', async (req, res) => {
    const { transactionid } = req.body;
    const userid = req.session.user.userid;

    try {
        // 1️⃣ Get transaction data
        const [transactionResults] = await db.query(
            `SELECT transactionid, trandate, tranname, sourceid AS scategoryid, targetid AS tcategoryid 
             FROM transaction 
             WHERE transactionid = ? AND userid = ?`,
            [transactionid, userid]
        );

        if (transactionResults.length === 0) {
            return res.status(404).send('Transaction not found.');
        }

        let transaction = transactionResults[0];

        // Convert tranname to readable format
        const tranLabels = { 'IN': 'Incoming', 'OUT': 'Outgoing', 'TRAN': 'Transfer' };
        transaction.tranname = tranLabels[transaction.tranname] || transaction.tranname;

        // Format the date
        const trandate = new Date(transaction.trandate);
        transaction.trandate = `${trandate.getDate().toString().padStart(2, '0')}-${(trandate.getMonth() + 1)
            .toString()
            .padStart(2, '0')}-${trandate.getFullYear()}`;

        // 2️⃣ Get items related to the transaction
        const [items] = await db.query(
            `SELECT td.itemid, td.titemid, td.tranqty AS originalQty, 
                    i.itemname, i.expdate, i.itemqty AS itemqty, i.categoryid,
                    ti.itemqty AS titemqty
             FROM transaction_detail td
             JOIN item i ON td.itemid = i.itemid
             LEFT JOIN item ti ON td.titemid = ti.itemid
             WHERE td.transactionid = ?`,
            [transactionid]
        );

        items.forEach(item => {
            if (transaction.tranname === 'Incoming') {
                item.minAllow = Math.max(0, item.originalQty - item.itemqty);
                item.maxAllow = 10000;
            } else if (transaction.tranname === 'Outgoing') {
                item.minAllow = 0;
                item.maxAllow = item.originalQty + item.itemqty;
            } else if (transaction.tranname === 'Transfer') {
                // Transfer: Calculate based on itemqty and titemqty
                const { itemqty, titemqty, originalQty } = item;
                
                // minAllow: max(itemqty - titemqty, 0)
                item.minAllow = Math.max(item.originalQty - titemqty, 0);
                
                // maxAllow: itemqty + originalQty
                item.maxAllow = itemqty + originalQty;
            }
        });

        if (items.length === 0) {
            return res.status(404).send('No items found for this transaction.');
        }

        // 3️⃣ Get store and category details for IN and OUT using the first item's categoryid
        if (transaction.tranname === 'Incoming' || transaction.tranname === 'Outgoing') {
            const firstCategoryId = items[0].categoryid;
            const [categoryResults] = await db.query(
                `SELECT c.categoryname, s.storename 
                 FROM category c 
                 JOIN store s ON c.storeid = s.storeid 
                 WHERE c.categoryid = ?`,
                [firstCategoryId]
            );

            if (categoryResults.length > 0) {
                transaction.storeName = categoryResults[0].storename;
                transaction.categoryName = categoryResults[0].categoryname;
            }
        }

        // 4️⃣ Get store and category details for Transfer
        if (transaction.tranname === 'Transfer') {
            // From Store and Category
            const [fromCategoryResults] = await db.query(
                `SELECT c.categoryname, s.storename 
                 FROM category c 
                 JOIN store s ON c.storeid = s.storeid 
                 WHERE c.categoryid = ?`,
                [transaction.scategoryid]
            );
            if (fromCategoryResults.length > 0) {
                transaction.fromStore = fromCategoryResults[0].storename;
                transaction.fromCategory = fromCategoryResults[0].categoryname;
            }

            // To Store and Category
            const [toCategoryResults] = await db.query(
                `SELECT c.categoryname, s.storename 
                 FROM category c 
                 JOIN store s ON c.storeid = s.storeid 
                 WHERE c.categoryid = ?`,
                [transaction.tcategoryid]
            );
            if (toCategoryResults.length > 0) {
                transaction.toStore = toCategoryResults[0].storename;
                transaction.toCategory = toCategoryResults[0].categoryname;
            }
        }

        // Render editHistorydetail.ejs with transaction details
        res.render('editHistorydetail', { transaction, items, user: req.session.user });


    } catch (error) {
        console.error('Error fetching transaction details:', error);
        res.status(500).send('An error occurred while fetching transaction details.');
    }
});

    
router.get('/editName/getStores', async (req, res) => {
    const userId = req.session.user ? req.session.user.userid : null; // Check if session exists

    if (!userId) {
        return res.status(401).send('Unauthorized: User not logged in.');
    }

    try {
        const [stores] = await db.query(
            `SELECT storeid, storename 
             FROM store 
             WHERE userid = ?`, 
            [userId]
        );
        res.json(stores);
    } catch (error) {
        console.error('Error fetching stores:', error);
        res.status(500).send('Failed to fetch stores.');
    }
});
// Update Store Name
router.post('/editName/updateStore', async (req, res) => {
    const { storeId, newStoreName } = req.body;

    if (!storeId || !newStoreName) {
        return res.status(400).send('Store ID and new name are required.');
    }

    try {
        await db.query(
            `UPDATE store 
             SET storename = ? 
             WHERE storeid = ?`,
            [newStoreName, storeId]
        );
        res.status(200).send('Store name updated successfully.');
    } catch (error) {
        console.error('Error updating store name:', error);
        res.status(500).send('Failed to update store name.');
    }
});
router.get('/editName/getCategories/:storeId', async (req, res) => {
    const { storeId } = req.params;
    try {
        const [categories] = await db.query(
            `SELECT categoryid, categoryname 
             FROM category 
             WHERE storeid = ?`, 
            [storeId]
        );
        res.json(categories);
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).send('Failed to fetch categories.');
    }
});

// Get Items by Category
router.get('/editName/getItems/:categoryId', async (req, res) => {
    const { categoryId } = req.params;
    try {
        const [items] = await db.query(
            `SELECT itemid, itemname 
             FROM item 
             WHERE categoryid = ?`, 
            [categoryId]
        );
        res.json(items);
    } catch (error) {
        console.error('Error fetching items:', error);
        res.status(500).send('Failed to fetch items.');
    }
});

router.post('/editName/updateCategory', async (req, res) => {
    const { categoryId, newCategoryName } = req.body;

    if (!categoryId || !newCategoryName) {
        return res.status(400).send('Category ID and new name are required.');
    }

    try {
        await db.query(
            `UPDATE category 
             SET categoryname = ? 
             WHERE categoryid = ?`,
            [newCategoryName, categoryId]
        );
        res.status(200).send('Category name updated successfully.');
    } catch (error) {
        console.error('Error updating category name:', error);
        res.status(500).send('Failed to update category name.');
    }
});
router.post('/editName/updateItem', async (req, res) => {
    const { itemId, newItemName } = req.body;

    if (!itemId || !newItemName) {
        return res.status(400).send('Item ID and new name are required.');
    }

    try {
        await db.query(
            `UPDATE item 
             SET itemname = ? 
             WHERE itemid = ?`,
            [newItemName, itemId]
        );
        res.status(200).send('Item name updated successfully.');
    } catch (error) {
        console.error('Error updating item name:', error);
        res.status(500).send('Failed to update item name.');
    }
});

router.get('/editName', async (req, res) => {
    try {
            const [rows] = await db.query('SELECT storeid, storename FROM store WHERE userid = ?', [req.session.user.userid]);
            const userid = req.session.user.userid; 
            res.render('editName', { 
                stores: rows, // Pass the stores to the page
                user: req.session.user, 
                userid: req.session.user.userid 
            });
        } catch (error) {
            console.error('Error fetching stores or transaction ID:', error);
            res.render('editName', { 
                stores: [], 
                user: req.session.user, 
                userid: req.session.user.userid 
            });
        }
});
module.exports = router;