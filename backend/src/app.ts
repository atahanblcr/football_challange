// src/app.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env';
import { errorHandlerMiddleware } from './middleware/error-handler.middleware';
import { startAllJobs } from './jobs';
import authRouter from './modules/auth/auth.router';
import usersRouter from './modules/users/users.router';
import searchRouter from './modules/search/search.router';

const app = express();

// Güvenlik middleware'leri
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') ?? '*',
  credentials: true,
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10kb' }));

// Route'lar
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/users', usersRouter);
app.use('/api/v1/search', searchRouter);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Merkezi hata yakalayıcı — her zaman en sonda
app.use(errorHandlerMiddleware);

if (require.main === module) {
  const PORT = env.PORT;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} in ${env.NODE_ENV} mode`);
    startAllJobs();
  });
}

export default app;
