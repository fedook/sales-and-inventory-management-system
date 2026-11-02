import type { RequestHandler } from 'express';
import { getAuthenticatedUser } from '../middleware/auth.middleware.js';
import * as inventoryService from '../services/inventory.service.js';
import type {
  MovementQueryInput,
  RestockInput,
  StockQueryInput,
} from '../validators/inventory.validator.js';

export const stock: RequestHandler = async (req, res) => {
  const query = req.validatedQuery as StockQueryInput;
  const result = await inventoryService.listStock(query);

  res.status(200).json({ success: true, data: result });
};

export const movements: RequestHandler = async (req, res) => {
  const query = req.validatedQuery as MovementQueryInput;
  const result = await inventoryService.listMovements(query);

  res.status(200).json({ success: true, data: result });
};

export const alerts: RequestHandler = async (_req, res) => {
  const result = await inventoryService.getLowStockAlerts();

  res.status(200).json({ success: true, data: result });
};

export const restock: RequestHandler = async (req, res) => {
  const user = getAuthenticatedUser(req);
  const product = await inventoryService.restockProduct(
    req.body as RestockInput,
    user.id,
  );

  res.status(200).json({
    success: true,
    message: `Stock updated for "${product.name}".`,
    data: { product },
  });
};
