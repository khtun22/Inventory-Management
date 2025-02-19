const express = require('express');
const router = express.Router();
const db = require('../models/db');

// Get user profile data
router.get('/profile', async (req, res) => {
    const userId = req.session.user.userid;
    try {
        const [user] = await db.query(
            'SELECT username, email, phoneno, alerttime, password FROM user WHERE userid = ?',
            [userId]
        );

        if (user.length === 0) {
            return res.status(404).send('User not found.');
        }

        res.render('profile', { user: user[0], userid: userId });
    } catch (error) {
        console.error('❌ Error fetching profile:', error);
        res.status(500).send('Error fetching profile.');
    }
});

// Update user profile
router.post('/profile/update', async (req, res) => {
    const { username, email, phoneno, password, alerttime } = req.body;
    const userId = req.session.user.userid;


    try {
        // Check if username or email already exists (excluding current user)
        const [existingUsers] = await db.query(
            'SELECT userid FROM user WHERE (username = ? OR email = ?) AND userid != ?',
            [username, email, userId]
        );

        if (existingUsers.length > 0) {
            console.warn('⚠ Username or Email already exists:', username, email);
            return res.status(400).json({ error: 'Username or email already exists.' });
        }

        let query;
        let params;

        if (password) {
            query = `UPDATE user SET username = ?, email = ?, phoneno = ?, password = ?, alerttime = ? WHERE userid = ?`;
            params = [username, email, phoneno, password, alerttime, userId];
        } else {
            query = `UPDATE user SET username = ?, email = ?, phoneno = ?, alerttime = ? WHERE userid = ?`;
            params = [username, email, phoneno, alerttime, userId];
        }


        await db.query(query, params);

        res.status(200).send('Profile updated successfully.');
    } catch (error) {
        res.status(500).send('An error occurred while updating the profile.');
    }
});

module.exports = router;
