import { Router } from 'express';
import {
  create,
  getById,
  list,
  remove,
  update,
} from '../controllers/supplier.controller.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';
import {
  validateBody,
  validateParams,
  validateQuery,
} from '../middleware/validate.middleware.js';
import { idParamSchema } from '../validators/common.validator.js';
import {
  supplierInputSchema,
  supplierQuerySchema,
} from '../validators/supplier.validator.js';

export const suppliersRouter = Router();

suppliersRouter.use(authenticate);

suppliersRouter.get('/', validateQuery(supplierQuerySchema), list);

suppliersRouter.get('/:id', validateParams(idParamSchema), getById);

suppliersRouter.post('/', validateBody(supplierInputSchema), create);

suppliersRouter.put(
  '/:id',
  validateParams(idParamSchema),
  validateBody(supplierInputSchema),
  update,
);

suppliersRouter.delete(
  '/:id',
  requireRole('admin'),
  validateParams(idParamSchema),
  remove,
);
