import { Router } from 'express';
import {
  getById,
  list,
  remove,
  updateRole,
} from '../controllers/user.controller.js';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';
import { validateBody, validateParams } from '../middleware/validate.middleware.js';
import { idParamSchema, updateRoleSchema } from '../validators/auth.validator.js';

/**
 * Every route in this router requires a signed-in ADMIN.
 * Applying the middleware at router level keeps each route declaration short.
 */
export const usersRouter = Router();

usersRouter.use(authenticate, requireRole('admin'));

usersRouter.get('/', list);
usersRouter.get('/:id', validateParams(idParamSchema), getById);
usersRouter.patch(
  '/:id/role',
  validateParams(idParamSchema),
  validateBody(updateRoleSchema),
  updateRole,
);
usersRouter.delete('/:id', validateParams(idParamSchema), remove);
