// src/app.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env';
import { redis } from './config/redis';
import { initFirebase } from './config/firebase';
import { errorHandlerMiddleware } from './middleware/error-handler.middleware';
import { startAllJobs } from './jobs';
import authRouter from './modules/auth/auth.router';
import usersRouter from './modules/users/users.router';
import searchRouter from './modules/search/search.router';
import questionsRouter from './modules/questions/questions.router';
import sessionsRouter from './modules/sessions/sessions.router';
import leaderboardRouter from './modules/leaderboard/leaderboard.router';
import { adminRouter } from './modules/admin/admin.router';
import { appConfigRouter } from './modules/app-config/app-config.router';

const app = express();

app.set('trust proxy', 1);

// Güvenlik middleware'leri
app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = env.ALLOWED_ORIGINS?.split(',') ?? [];
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS: İzin verilmeyen kaynak'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-session'],
  exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining'],
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10kb' }));

// Route'lar
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/users', usersRouter);
app.use('/api/v1/search', searchRouter);
app.use('/api/v1/questions', questionsRouter);
app.use('/api/v1/sessions', sessionsRouter);
app.use('/api/v1/leaderboard', leaderboardRouter);
app.use('/api/v1/app', appConfigRouter);

// Admin Route'ları (Ayrı prefix)
app.use('/api/admin', adminRouter);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Merkezi hata yakalayıcı — her zaman en sonda
app.use(errorHandlerMiddleware);

if (require.main === module) {
  const PORT = env.PORT;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} in ${env.NODE_ENV} mode`);
    initFirebase();
    startAllJobs();
  });
}

export default app;
