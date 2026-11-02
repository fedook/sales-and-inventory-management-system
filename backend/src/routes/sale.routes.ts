import { Router } from 'express';
import { create, getById, list } from '../controllers/sale.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import {
  validateBody,
  validateParams,
  validateQuery,
} from '../middleware/validate.middleware.js';
import { idParamSchema } from '../validators/common.validator.js';
import { saleInputSchema, saleQuerySchema } from '../validators/sale.validator.js';

export const salesRouter = Router();

salesRouter.use(authenticate);

salesRouter.get('/', validateQuery(saleQuerySchema), list);

salesRouter.get('/:id', validateParams(idParamSchema), getById);

// Any signed-in user can record a sale; stock is checked inside a transaction.
salesRouter.post('/', validateBody(saleInputSchema), create);
