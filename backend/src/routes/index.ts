import { Router } from 'express';
import { authRouter } from './auth.routes.js';
import { analyticsRouter } from './analytics.routes.js';
import { customersRouter } from './customer.routes.js';
import { healthRouter } from './health.routes.js';
import { inventoryRouter } from './inventory.routes.js';
import { productsRouter } from './product.routes.js';
import { salesRouter } from './sale.routes.js';
import { suppliersRouter } from './supplier.routes.js';
import { usersRouter } from './user.routes.js';

/**
 * Every module gets its own router file under src/routes.
 * They are mounted here so app.ts stays small and readable.
 */
export const apiRouter = Router();

apiRouter.use('/health', healthRouter);
apiRouter.use('/analytics', analyticsRouter);
apiRouter.use('/auth', authRouter);
apiRouter.use('/users', usersRouter);
apiRouter.use('/products', productsRouter);
apiRouter.use('/customers', customersRouter);
apiRouter.use('/suppliers', suppliersRouter);
apiRouter.use('/sales', salesRouter);
apiRouter.use('/inventory', inventoryRouter);
