const express = require('express')
const jwt = require('jsonwebtoken')
const passport = require('passport')
const cors = require('cors')
const { Pool } = require('pg')
const LocalStrategy = require('passport-local').Strategy

const POOL = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'postgres',
    password: 'postgres',
    port: 5432,
})

passport.use(new LocalStrategy(
    {
        usernameField: 'username',
        passwordField: 'password',
        passReqToCallback: true
    },
    async (req, username, password, done) => {
        try {
            const data = await POOL.query(`SELECT * FROM account WHERE username = '${username}' AND password = '${password}'`)
            if (data.rowCount > 0) {
                done(null,
                    {
                        username: data.rows[0].username,
                    }
                )
            } else {
                console.log(`Failed to authenticate user.`);
                done('Incorrect username and/or password', false)
            }
        } catch (e) {
            console.log(`Exception when connecting to database: ${e}`);
            done(`Failed to login, please try again later.`, false)
        }
    }
))

const app = express()

app.use(express.json())
app.use(passport.initialize())
app.use(cors())

// Sign a jwt token
const signToken = (payload) => {
    return jwt.sign({
        sub: payload.username,
        iss: 'issuer',
        iat: (new Date()).getTime() / 1000,
    }, 'secretkey')
}

app.post('/api/login',
// passport middleware to perform login authentication
(req, resp, next) => {
    passport.authenticate('local',
        (err, user, info) => {
            if (null != err) {
                resp.status(401)
                resp.type('application/json')
                resp.json({ message: err })
                return
            }
            if (!user) {
                resp.status(401);
                resp.type('application/json');
                resp.json({ info });
                return;
                }
            req.user = user
            next()
        }
    )(req, resp, next)
}, (req, resp) => {
    const userInfo = req.body;
    const token = signToken(userInfo)
    resp.status(200)
    resp.type('application/json')
    resp.json({message: 'Logged successful.', token, username: userInfo.username})
    return
})

// Authorize user for protected requests
app.use((req, resp, next) => {
    const auth = req.get('Authorization')
    if (auth == null || auth == '') {
        resp.status(401)
        resp.type('application/json')
        resp.json({message: 'Missing Authorization Header.'})
        return
    }
    const terms = auth.split(' ')
    if ((terms.length != 2) || (terms[0] != 'Bearer')) {
        resp.status(401)
        resp.json({message: 'Incorrect Authorization'})
        return
    }
    const token = terms[1]
    jwt.verify(token, 'secretkey', (err, decoded) => {
        if (err) {
            resp.status(401)
            resp.type('application/json')
            resp.json({message: 'Incorrect Token: ' + err})
        } else {
            req.token = decoded
            next()
        }
    })})

// Put protected requests below

app.get('/api/test', (req, resp) => {
    resp.status(200)
    resp.type('application/json')
    resp.json({ message: 'Request success!' })
    return
})

app.listen(3008, () => {
    console.info(`Application is listening PORT 3008.`)
})