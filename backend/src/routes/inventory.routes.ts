import { Router } from 'express';
import {
  alerts,
  movements,
  restock,
  stock,
} from '../controllers/inventory.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import {
  validateBody,
  validateQuery,
} from '../middleware/validate.middleware.js';
import {
  movementQuerySchema,
  restockInputSchema,
  stockQuerySchema,
} from '../validators/inventory.validator.js';

export const inventoryRouter = Router();

inventoryRouter.use(authenticate);

inventoryRouter.get('/stock', validateQuery(stockQuerySchema), stock);

inventoryRouter.get('/movements', validateQuery(movementQuerySchema), movements);

inventoryRouter.get('/alerts', alerts);

// Staff receive deliveries and correct stock, so any signed-in user may restock.
inventoryRouter.post('/restock', validateBody(restockInputSchema), restock);
