const express = require('express');
const router = express.Router();
const db = require('../models/db');

// Fetch notifications
router.get('/check', async (req, res) => {
    const userid = req.session.user.userid;

    try {
        // Get the user's alert time in HH:MM format
        const [user] = await db.query(`SELECT TIME_FORMAT(alerttime, '%H:%i') AS alerttime FROM user WHERE userid = ?`, [userid]);

        if (!user.length) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const alerttime = user[0].alerttime;
        
        // Get current time and allow ±1 min variation
        const now = new Date();
        const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
        
        const oneMinuteBefore = new Date(now.getTime() - 60000).toTimeString().slice(0, 5);
        const oneMinuteAfter = new Date(now.getTime() + 60000).toTimeString().slice(0, 5);

        console.log(`Checking alerts at ${currentTime}, User Alert Time: ${alerttime}`);
        
        // Allow ±1 min tolerance in case of time mismatch
        if ([currentTime, oneMinuteBefore, oneMinuteAfter].includes(alerttime)) {
            console.log("✅ Alert Time Matched!");

            // Check if there are stock alerts
            const [alertItems] = await db.query(`
                SELECT COUNT(i.itemid) AS alertCount
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
            `, [userid]);

            const alertCount = alertItems[0].alertCount;
            console.log(`🔴 Found ${alertCount} alert items.`);

            if (alertCount > 0) {
                // Check if the user already has unread notifications
                const [existingNotification] = await db.query(`
                    SELECT alertCount FROM notifications WHERE userid = ? AND isRead = FALSE
                `, [userid]);

                if (existingNotification.length > 0) {
                    // Update count if it's different
                    if (existingNotification[0].alertCount !== alertCount) {
                        await db.query(`UPDATE notifications SET alertCount = ?, lastUpdated = NOW() WHERE userid = ? AND isRead = FALSE`, [alertCount, userid]);
                        console.log("✅ Updated unread notification count.");
                    }
                } else {
                    // Insert new notification
                    await db.query(`INSERT INTO notifications (userid, alertCount) VALUES (?, ?)`, [userid, alertCount]);
                    console.log("✅ Inserted new notification.");
                }

                return res.json({ success: true, alertCount, message: `You have ${alertCount} stock or expired item alerts!` });
            }
        }

        console.log("❌ No alerts triggered.");
        res.json({ success: false, alertCount: 0, message: "No new alerts" });
    } catch (error) {
        console.error('Error checking notifications:', error);
        res.status(500).json({ success: false, message: "Error checking notifications" });
    }
});


// Mark notifications as read when the user views them
router.post('/mark-as-read', async (req, res) => {
    const userid = req.session.user.userid;

    try {
        await db.query(`UPDATE notifications SET isRead = TRUE WHERE userid = ?`, [userid]);
        res.json({ success: true });
    } catch (error) {
        console.error('Error marking notifications as read:', error);
        res.status(500).json({ success: false });
    }
});

module.exports = router;
