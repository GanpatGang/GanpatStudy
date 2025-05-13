const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../config/database');

// Get all users
router.get('/users', async (req, res) => {
    db.all(`SELECT id, username, email, role, created_at, last_login, is_active 
            FROM users`, [], (err, users) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(users);
    });
});

// Create new user
router.post('/users', async (req, res) => {
    const { username, password, email, role } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        db.run(`INSERT INTO users (username, password, email, role) 
                VALUES (?, ?, ?, ?)`,
            [username, hashedPassword, email, role],
            function(err) {
                if (err) {
                    return res.status(400).json({ error: 'Username or email already exists' });
                }
                res.status(201).json({ id: this.lastID, username, email, role });
            });
    } catch (err) {
        res.status(500).json({ error: 'Error creating user' });
    }
});

// Update user
router.put('/users/:id', async (req, res) => {
    const { username, email, role, is_active } = req.body;
    const userId = req.params.id;
    
    db.run(`UPDATE users 
            SET username = ?, email = ?, role = ?, is_active = ?
            WHERE id = ?`,
        [username, email, role, is_active, userId],
        function(err) {
            if (err) {
                return res.status(500).json({ error: 'Error updating user' });
            }
            if (this.changes === 0) {
                return res.status(404).json({ error: 'User not found' });
            }
            res.json({ message: 'User updated successfully' });
        });
});

// Delete user
router.delete('/users/:id', (req, res) => {
    const userId = req.params.id;
    
    db.run('DELETE FROM users WHERE id = ?', [userId], function(err) {
        if (err) {
            return res.status(500).json({ error: 'Error deleting user' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({ message: 'User deleted successfully' });
    });
});

// Get login history
router.get('/login-history', (req, res) => {
    const query = `
        SELECT 
            lh.id,
            u.username,
            lh.login_timestamp,
            lh.ip_address,
            lh.user_agent,
            lh.status
        FROM login_history lh
        LEFT JOIN users u ON lh.user_id = u.id
        ORDER BY lh.login_timestamp DESC
        LIMIT 100
    `;

    db.all(query, [], (err, history) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(history);
    });
});

// Login endpoint
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const ip_address = req.ip;
    const user_agent = req.get('User-Agent');

    try {
        // Get user
        db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }

            let loginStatus = 'failed';
            let userId = null;

            if (user) {
                const passwordMatch = await bcrypt.compare(password, user.password);
                if (passwordMatch) {
                    loginStatus = 'success';
                    userId = user.id;

                    // Update last login time
                    db.run('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);
                }
            }

            // Record login attempt
            db.run(`INSERT INTO login_history (user_id, ip_address, user_agent, status) 
                    VALUES (?, ?, ?, ?)`,
                [userId, ip_address, user_agent, loginStatus],
                function(err) {
                    if (err) {
                        console.error('Error recording login history:', err);
                    }
                });

            if (loginStatus === 'success') {
                res.json({
                    success: true,
                    user: {
                        id: user.id,
                        username: user.username,
                        role: user.role,
                        email: user.email
                    }
                });
            } else {
                res.status(401).json({ error: 'Invalid credentials' });
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router; 