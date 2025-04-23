import React, { useState, useEffect } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import Logs from './Logs';

const socket = io();

function Main({ setLoggedIn }) {
    const [targetUsername, setTargetUsername] = useState('');
    const [type, setType] = useState('followers');
    const [message, setMessage] = useState('');
    const [count, setCount] = useState(10);
    const [delay, setDelay] = useState(60);
    const [logs, setLogs] = useState([]);
    const [isRunning, setIsRunning] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        socket.on('log', (log) => {
            setLogs((prev) => [...prev, log]);
        });
        socket.on('status', (status) => {
            if (status === 'busy') {
                setError('Bot is currently in use by another user');
            }
        });
        return () => {
            socket.off('log');
            socket.off('status');
        };
    }, []);

    const handleStart = async () => {
        if (!targetUsername || !message || count <= 0 || delay < 0) {
            setError('All fields are required with valid values');
            return;
        }
        setError('');
        setIsRunning(true);
        try {
            await axios.post('/start', { targetUsername, type, message, count, delay });
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to start bot');
            setIsRunning(false);
        }
    };

    const handleStop = async () => {
        try {
            await axios.post('/stop');
            setIsRunning(false);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to stop bot');
        }
    };

    const handleLogout = () => {
        setLoggedIn(false);
        socket.disconnect();
    };

    return (
        <div className="main-container">
            <h2>Instagram Mass DM Bot</h2>
            <button onClick={handleLogout} className="logout-btn">Logout</button>
            <div className="input-group">
                <input
                    type="text"
                    value={targetUsername}
                    onChange={(e) => setTargetUsername(e.target.value)}
                    placeholder="Target Username"
                    disabled={isRunning}
                />
                <select value={type} onChange={(e) => setType(e.target.value)} disabled={isRunning}>
                    <option value="followers">Followers</option>
                    <option value="following">Following</option>
                </select>
                <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Message to send"
                    disabled={isRunning}
                />
                <input
                    type="number"
                    value={count}
                    onChange={(e) => setCount(parseInt(e.target.value) || 0)}
                    placeholder="Number of accounts"
                    min="1"
                    disabled={isRunning}
                />
                <input
                    type="number"
                    value={delay}
                    onChange={(e) => setDelay(parseInt(e.target.value) || 0)}
                    placeholder="Delay (seconds)"
                    min="0"
                    disabled={isRunning}
                />
                <button onClick={handleStart} disabled={isRunning}>Start</button>
                <button onClick={handleStop} disabled={!isRunning}>Stop</button>
            </div>
            {error && <p className="error">{error}</p>}
            <Logs logs={logs} />
        </div>
    );
}

export default Main;
