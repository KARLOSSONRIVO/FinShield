import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { PORT, CORS_ORIGIN } from './config/env.js';
import apiRoutes from "./routes/index.js";
import notFound from "./common/middlewares/notFound.middleware.js";
import errorHandler from "./common/middlewares/error.middleware.js";


const app = express();

app.use(helmet());
app.use(cors({
    origin: CORS_ORIGIN === "*" ? true : CORS_ORIGIN.split(",").map((s) => s.trim()),
    credentials: true,
}))

app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

app.use('/', apiRoutes);

app.use(notFound);
app.use(errorHandler);  

export default app;