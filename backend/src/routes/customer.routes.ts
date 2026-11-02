import { Router } from 'express';
import {
  create,
  getById,
  list,
  purchases,
  remove,
  update,
} from '../controllers/customer.controller.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';
import {
  validateBody,
  validateParams,
  validateQuery,
} from '../middleware/validate.middleware.js';
import { idParamSchema } from '../validators/common.validator.js';
import {
  customerInputSchema,
  customerQuerySchema,
} from '../validators/customer.validator.js';

export const customersRouter = Router();

customersRouter.use(authenticate);

customersRouter.get('/', validateQuery(customerQuerySchema), list);

customersRouter.get('/:id', validateParams(idParamSchema), getById);

// Real purchase history built from the sales tables.
customersRouter.get(
  '/:id/purchases',
  validateParams(idParamSchema),
  purchases,
);

customersRouter.post('/', validateBody(customerInputSchema), create);

customersRouter.put(
  '/:id',
  validateParams(idParamSchema),
  validateBody(customerInputSchema),
  update,
);

customersRouter.delete(
  '/:id',
  requireRole('admin'),
  validateParams(idParamSchema),
  remove,
);
