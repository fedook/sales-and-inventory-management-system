import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';
import { validateQuery } from '../middleware/validate.middleware.js';
import * as analyticsController from '../controllers/analytics.controller.js';
import { analyticsQuerySchema, forecastQuerySchema } from '../validators/analytics.validator.js';

export const analyticsRouter = Router();
analyticsRouter.use(authenticate, requireRole('admin'));
analyticsRouter.get('/overview', validateQuery(analyticsQuerySchema), analyticsController.overview);
analyticsRouter.get('/sales-trend', validateQuery(analyticsQuerySchema), analyticsController.salesTrend);
analyticsRouter.get('/top-products', validateQuery(analyticsQuerySchema), analyticsController.topProducts);
analyticsRouter.get('/lowest-products', validateQuery(analyticsQuerySchema), analyticsController.lowestProducts);
analyticsRouter.get('/category-performance', validateQuery(analyticsQuerySchema), analyticsController.categoryPerformance);
analyticsRouter.get('/inventory-summary', analyticsController.inventorySummary);
analyticsRouter.get('/forecast', validateQuery(forecastQuerySchema), analyticsController.forecast);
analyticsRouter.get('/recommendations', analyticsController.recommendations);
