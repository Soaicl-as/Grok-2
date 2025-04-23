import React, { useState } from 'react';
import Login from './components/Login';
import Main from './components/Main';
import './App.css';

function App() {
    const [loggedIn, setLoggedIn] = useState(false);

    return (
        <div className="App">
            {loggedIn ? <Main setLoggedIn={setLoggedIn} /> : <Login setLoggedIn={setLoggedIn} />}
        </div>
    );
}

export default App;
