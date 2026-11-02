import { Router } from 'express';
import {
  categories,
  create,
  getById,
  list,
  remove,
  update,
} from '../controllers/product.controller.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';
import {
  validateBody,
  validateParams,
  validateQuery,
} from '../middleware/validate.middleware.js';
import { idParamSchema } from '../validators/common.validator.js';
import {
  productInputSchema,
  productQuerySchema,
} from '../validators/product.validator.js';

export const productsRouter = Router();

// Viewing is open to every signed-in user.
productsRouter.use(authenticate);

productsRouter.get('/', validateQuery(productQuerySchema), list);

// Must be declared before "/:id" so "categories" is not read as an ID.
productsRouter.get('/categories', categories);

productsRouter.get('/:id', validateParams(idParamSchema), getById);

// Staff record day-to-day catalogue data; deleting is an admin action.
productsRouter.post('/', validateBody(productInputSchema), create);

productsRouter.put(
  '/:id',
  validateParams(idParamSchema),
  validateBody(productInputSchema),
  update,
);

productsRouter.delete(
  '/:id',
  requireRole('admin'),
  validateParams(idParamSchema),
  remove,
);
