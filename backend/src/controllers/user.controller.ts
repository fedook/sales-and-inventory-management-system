import type { Request, RequestHandler } from 'express';
import { getAuthenticatedUser } from '../middleware/auth.middleware.js';
import * as authService from '../services/auth.service.js';
import * as userService from '../services/user.service.js';
import type { UpdateRoleInput } from '../validators/auth.validator.js';

/** Route parameters arrive as strings; Zod has already checked the format. */
function getId(req: Request): number {
  return Number(req.params.id);
}

export const list: RequestHandler = async (_req, res) => {
  const users = await userService.listUsers();

  res.status(200).json({
    success: true,
    data: { users },
  });
};

export const getById: RequestHandler = async (req, res) => {
  const user = await authService.getUserById(getId(req));

  res.status(200).json({
    success: true,
    data: { user },
  });
};

export const updateRole: RequestHandler = async (req, res) => {
  const { role } = req.body as UpdateRoleInput;
  const user = await userService.updateUserRole(getId(req), role);

  res.status(200).json({
    success: true,
    message: 'Role updated successfully.',
    data: { user },
  });
};

export const remove: RequestHandler = async (req, res) => {
  const currentUser = getAuthenticatedUser(req);

  await userService.deleteUser(getId(req), currentUser.id);

  res.status(200).json({
    success: true,
    message: 'User deleted successfully.',
  });
};
