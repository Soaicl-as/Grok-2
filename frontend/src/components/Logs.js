import React from 'react';

function Logs({ logs }) {
    return (
        <div className="logs-container">
            <h3>Live Logs</h3>
            <div className="logs">
                {logs.map((log, index) => (
                    <p key={index}>{log}</p>
                ))}
            </div>
        </div>
    );
}

export default Logs;
