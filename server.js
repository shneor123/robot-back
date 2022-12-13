const express = require('express')
const cors = require('cors')
const path = require('path')
const cookieParser = require('cookie-parser')

const app = express()
const http = require('http').createServer(app)

app.use(express.json())
app.use(cookieParser())
app.use(express.static('public'))

if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'public')))
} else {
    const corsOptions = {
        origin: [
            'http://127.0.0.1:8080',
            'http://localhost:8080',
            'http://127.0.0.1:3000',
            'http://localhost:3000'
        ],
        credentials: true
    }
    app.use(cors(corsOptions))
}

/* ROUTES */
const setupAsyncLocalStorage = require('./middlewares/setup.als.middleware')
app.all('*', setupAsyncLocalStorage)

const authRoutes = require('./api/auth/auth.routes')
const userRoutes = require('./api/user/user.routes')
const robotRoutes = require('./api/robot/robot.routes')
const reviewRoutes = require('./api/review/review.routes')
const { setupSocketAPI } = require('./services/socket.service')

app.use('/api/auth', authRoutes)
app.use('/api/user', userRoutes)
app.use('/api/robot', robotRoutes)
app.use('/api/review', reviewRoutes)
setupSocketAPI(http)

/* LAST FALLBACK */
app.get('/**', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'public', 'index.html'))
})

const PORT = process.env.PORT || 3030
http.listen(PORT, () => {
    console.log(`Server listening on ${PORT}`)
})