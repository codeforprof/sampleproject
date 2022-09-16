import { Route, Routes, useNavigate } from 'react-router-dom';
import React, { useEffect, useState } from 'react';
import './App.css';
import axios from 'axios';
import TextField from '@mui/material/TextField';
import { Button } from '@mui/material';

function loginAccount(credentials) {
  return axios
      .post('http://localhost:3008/api/login', {
          username: credentials.username,
          password: credentials.password,
          headers: {
              Accept: 'application/json',
          },
      })
      .then((resp) => ({ data: resp.data, error: false }))
      .catch((err) => ({
          data: err && err.response ? JSON.stringify(err.response.data) : '',
          error: true,
          status: err && err.response ? err.response.status : '',
      }));
}

function testRequest() {
  return axios
      .get('http://localhost:3008/api/test', {
          headers: {
              Accept: 'application/json',
          },
      })
      .then((resp) => ({ data: resp.data, error: false }))
      .catch((err) => ({
          data: err && err.response ? JSON.stringify(err.response.data) : '',
          error: true,
          status: err && err.response ? err.response.status : '',
      }));
}

const App = () => {
  let navigate = useNavigate();
  const [displayMsg, setDisplayMsg] = useState('');
  const [username, setUsername] = useState('test');
  const [password, setPassword] = useState('123');

  useEffect(() => {
    const isLoginPage = window.location.pathname === '/'
    let token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      if (isLoginPage) {
        navigate('/home');
      }
    } else {
      axios.defaults.headers.common['Authorization'] = '';
      if (!isLoginPage) {
        navigate('/');
      }
    }
   // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);


  return (
    <Routes>
        <Route
            path="/"
            exact
            element={
              <div style={{ padding: '64px' }}>
                <span style={{ margin: '16px' }}>
                  <label for="username">Name: </label>
                  <TextField
                    size="small"
                    type="text"
                    id="username"
                    name="username"
                    required
                    value={username}
                    onChange={e => {
                      setUsername(e.target.value)
                    }}
                  />
                </span>
                <span style={{ margin: '16px' }}>
                  <label for="password">Password: </label>
                  <TextField
                    size="small"
                    type="password"
                    id="password"
                    name="password"
                    required
                    value={password}
                    onChange={e => {
                      setPassword(e.target.value)
                    }}
                  />
                </span>
                <span style={{ margin: '16px' }}>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      loginAccount({
                        username: username,
                        password: password,
                      }).then(res => {
                        if (res.error) {
                          setDisplayMsg(JSON.parse(res.data).message);
                        } else {
                          localStorage.setItem('token', res.data.token);
                          axios.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
                          setDisplayMsg('');
                          navigate('/home');
                        }
                      })
                    }}
                  >
                    Login
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      testRequest({
                        username: username,
                        password: password,
                      }).then(res => {
                        setDisplayMsg(JSON.parse(res.data).message);
                      })
                    }}
                  >
                    Test request
                  </Button>
                </span>
                <span style={{ margin: '16px' }}>
                  {displayMsg !== '' &&
                    displayMsg
                  }
                </span>
              </div>
            }
        />
        <Route
            path="/home"
            exact
            element={
              <div style={{ padding: '64px' }}>
                <h1>Welcome to home page</h1>
                <Button
                    variant="outlined"
                    onClick={() => {
                      localStorage.removeItem('token');
                      axios.defaults.headers.common['Authorization'] = '';
                      setDisplayMsg('');
                      navigate('/');
                    }}
                  >
                    Logout
                </Button>
                <Button
                    variant="outlined"
                    onClick={() => {
                      testRequest({
                        username: username,
                        password: password,
                      }).then(res => {
                        console.log(res);
                        setDisplayMsg(res.data.message);
                      })
                    }}
                  >
                    Test request
                </Button>
                <span style={{ margin: '16px' }}>
                  {displayMsg !== '' &&
                    displayMsg
                  }
                </span>
              </div>
            }
        />
    </Routes>
  );
};

export default App;
