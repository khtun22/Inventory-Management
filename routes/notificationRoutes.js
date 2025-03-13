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
// Check alert conditions and trigger notifications
async function checkAndSendNotifications() {
    try {
        // Get all users who have alerttime set
        const [users] = await db.query("SELECT userid, alerttime FROM user WHERE alerttime IS NOT NULL");

        const now = new Date();
        const currentTime = now.toTimeString().split(' ')[0]; // Format HH:MM:SS

        for (const user of users) {
            if (user.alerttime.slice(0, 5) === currentTime.slice(0, 5)) { // Match HH:MM
                const [alert] = await db.query(
                    `SELECT COUNT(i.itemid) AS alertCount
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
                    )`, [user.userid]
                );

                if (alert[0].alertCount > 0) {
                    const message = `You have ${alert[0].alertCount} stock alerts.`;

                    // Check if an unread notification exists, update it
                    const [existingNotification] = await db.query(
                        "SELECT id FROM notifications WHERE userid = ? AND is_read = FALSE",
                        [user.userid]
                    );

                    if (existingNotification.length > 0) {
                        await db.query(
                            "UPDATE notifications SET message = ? WHERE id = ?",
                            [message, existingNotification[0].id]
                        );
                    } else {
                        // Insert a new notification
                        await db.query(
                            "INSERT INTO notifications (userid, message) VALUES (?, ?)",
                            [user.userid, message]
                        );
                    }
                }
            }
        }
    } catch (error) {
        console.error("Error checking notifications:", error);
    }
}

// Run check every minute
setInterval(checkAndSendNotifications, 60000);

// API to fetch unread notifications
router.get('/notification/check', async (req, res) => {
    const userid = req.session.user.userid;
    try {
        const [notifications] = await db.query(
            "SELECT id, message FROM notifications WHERE userid = ? AND is_read = FALSE",
            [userid]
        );

        res.json({
            success: true,
            alertCount: notifications.length,
            message: notifications.length > 0 ? notifications[0].message : ""
        });
    } catch (error) {
        console.error("Error fetching notifications:", error);
        res.status(500).json({ success: false, message: "Error fetching notifications." });
    }
});

// Mark notifications as read
router.post('/notification/mark-as-read', async (req, res) => {
    const userid = req.session.user.userid;
    try {
        await db.query("UPDATE notifications SET is_read = TRUE WHERE userid = ?", [userid]);
        res.status(200).send("Notifications marked as read.");
    } catch (error) {
        console.error("Error marking notifications as read:", error);
        res.status(500).send("Failed to mark notifications as read.");
    }
});

module.exports = router;
