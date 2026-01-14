import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { CORS_ORIGIN } from './config/env.js';
import router from "./routes/index.js";
import notFound from "./common/middlewares/notFound.middleware.js";
import errorHandler from "./common/middlewares/error.middleware.js";


const app = express()

app.use(helmet())
app.use(cors({
    origin: CORS_ORIGIN === "*" ? true : CORS_ORIGIN.split(",").map((s) => s.trim()),
    credentials: true,
}))

app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'))

// Parse JSON bodies
app.use(express.json())

app.use('/', router)

app.use(notFound)
app.use(errorHandler)

export default app