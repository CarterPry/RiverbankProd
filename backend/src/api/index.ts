// backend/src/api/index.ts
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { config } from '../config';
import { logger } from '../utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { authMiddleware } from './middleware/authMiddleware';
import { rateLimitMiddleware } from './middleware/rateLimitMiddleware';
import { requestLogger } from './middleware/requestLogger';
import { healthRouter } from './routes/healthRoutes';
import { workflowRouter } from './routes/workflowRoutes';
import { authRouter } from './routes/authRoutes';
import { monitoringRouter } from './routes/monitoringRoutes';
import { prometheusMiddleware } from './middleware/prometheusMiddleware';

// Create Express app
const app = express();
const server = createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: config.CORS_ORIGIN,
    credentials: true,
  },
});

// Apply security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: true,
}));

// CORS configuration
app.use(cors({
  origin: config.CORS_ORIGIN,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
app.use(requestLogger);

// Prometheus metrics
if (config.PROMETHEUS_ENABLED) {
  app.use(prometheusMiddleware);
}

// Rate limiting
app.use(rateLimitMiddleware);

// Health check routes (no auth required)
app.use('/health', healthRouter);

// API routes
app.use('/api/auth', authRouter);
app.use('/api/workflows', authMiddleware, workflowRouter);
app.use('/api/monitoring', authMiddleware, monitoringRouter);

// Socket.IO namespace for real-time updates
io.use((socket, next) => {
  // Implement socket authentication
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('Authentication required'));
  }
  // Verify token here
  next();
});

io.on('connection', (socket) => {
  logger.info('Client connected', { socketId: socket.id });

  socket.on('subscribe:workflow', (workflowId: string) => {
    socket.join(`workflow:${workflowId}`);
  });

  socket.on('unsubscribe:workflow', (workflowId: string) => {
    socket.leave(`workflow:${workflowId}`);
  });

  socket.on('disconnect', () => {
    logger.info('Client disconnected', { socketId: socket.id });
  });
});

// Export socket.io instance for use in other modules
export { io };

// Error handling middleware (must be last)
app.use(errorHandler);

// Start the server
const PORT = config.PORT || 3000;
const HOST = config.HOST || '0.0.0.0';

server.listen(PORT, HOST, () => {
  logger.info(`API server listening on ${HOST}:${PORT}`);
  logger.info(`Environment: ${config.NODE_ENV}`);
  
  if (config.NODE_ENV === 'development') {
    logger.info(`Health check: http://localhost:${PORT}/health`);
    logger.info(`API docs: http://localhost:${PORT}/api-docs`);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Application specific logging, throwing an error, or other logic here
});

export default app; 