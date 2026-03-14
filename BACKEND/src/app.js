import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { CORS_ORIGIN } from './config/env.js';
import router from "./routes/index.js";
import notFound from "./common/middlewares/notFound.middleware.js";
import errorHandler from "./common/middlewares/error.middleware.js";
import { xssMiddleware } from './common/middlewares/xss.middleware.js';
import mongoSanitize from 'express-mongo-sanitize';


const app = express()

// Trust proxy is required for rate limiting when behind a proxy (like Nginx, Heroku, or some cloud providers)
// validation error: The 'X-Forwarded-For' header is set but the Express 'trust proxy' setting is false
app.set('trust proxy', 1);

app.use(helmet())
app.use(cors({
    origin: CORS_ORIGIN === "*" ? true : CORS_ORIGIN.split(",").map((s) => s.trim()),
    credentials: true,
}))     

app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'))
// Parse JSON bodies with limit
app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// NoSQL Injection Prevention - Strip MongoDB operators
app.use(mongoSanitize())

// XSS Protection - Sanitize request data
app.use(xssMiddleware)

app.use('/', router)

app.use(notFound)
app.use(errorHandler)

export default app