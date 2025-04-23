const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const instagram = require('./instagram');
const logger = require('./logger');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let currentSocket = null;
let isRunning = false;

logger.setIo(io);

app.use(express.static(path.join(__dirname, '../frontend/build')));
app.use(express.json());

app.post('/login', async (req, res) => {
    if (currentSocket === null) {
        return res.status(400).json({ error: 'No active client connection' });
    }
    const { username, password } = req.body;
    try {
        await instagram.login(username, password);
        logger.log('Login successful');
        res.json({ success: true });
    } catch (error) {
        logger.log(`Login failed: ${error.message}`);
        res.status(400).json({ error: error.message });
    }
});

app.post('/start', async (req, res) => {
    if (isRunning) {
        logger.log('Bot is already running');
        return res.status(400).json({ error: 'Bot is already running' });
    }
    isRunning = true;
    const { targetUsername, type, message, count, delay } = req.body;
    if (!targetUsername || !message || count <= 0 || delay < 0) {
        isRunning = false;
        logger.log('Invalid input parameters');
        return res.status(400).json({ error: 'Invalid input parameters' });
    }
    try {
        logger.log(`Starting bot for ${targetUsername} (${type})`);
        const userId = await instagram.getUserId(targetUsername);
        let users = type === 'followers' ? await instagram.getFollowers(userId) : await instagram.getFollowing(userId);
        const targetUsers = users.slice(0, Math.min(count, users.length));
        logger.log(`Found ${users.length} ${type}, messaging ${targetUsers.length} users`);
        
        for (const user of targetUsers) {
            if (!isRunning) {
                logger.log('Bot stopped by user');
                break;
            }
            try {
                await instagram.sendDM(user.pk, message);
                logger.log(`Sent message to ${user.username}`);
            } catch (error) {
                logger.log(`Failed to send message to ${user.username}: ${error.message}`);
            }
            if (targetUsers.indexOf(user) < targetUsers.length - 1) {
                await new Promise(resolve => setTimeout(resolve, delay * 1000));
            }
        }
        logger.log('Bot completed');
    } catch (error) {
        logger.log(`Error: ${error.message}`);
        res.status(500).json({ error: error.message });
    } finally {
        isRunning = false;
    }
    res.json({ success: true });
});

app.post('/stop', (req, res) => {
    if (isRunning) {
        isRunning = false;
        logger.log('Bot stopped');
        res.json({ success: true });
    } else {
        res.status(400).json({ error: 'Bot is not running' });
    }
});

io.on('connection', (socket) => {
    if (currentSocket === null) {
        currentSocket = socket;
        socket.emit('status', 'ready');
        logger.log('New client connected');
    } else {
        socket.emit('status', 'busy');
        socket.disconnect();
        logger.log('Additional connection rejected: bot in use');
    }
    socket.on('disconnect', () => {
        if (currentSocket === socket) {
            currentSocket = null;
            isRunning = false;
            logger.log('Client disconnected');
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
