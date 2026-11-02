import type { RequestHandler } from 'express';
import { getAuthenticatedUser } from '../middleware/auth.middleware.js';
import * as saleService from '../services/sale.service.js';
import type { SaleInput, SaleQueryInput } from '../validators/sale.validator.js';

export const list: RequestHandler = async (req, res) => {
  const query = req.validatedQuery as SaleQueryInput;
  const result = await saleService.listSales(query);

  res.status(200).json({ success: true, data: result });
};

export const getById: RequestHandler = async (req, res) => {
  const sale = await saleService.getSaleById(Number(req.params.id));

  res.status(200).json({ success: true, data: { sale } });
};

export const create: RequestHandler = async (req, res) => {
  const user = getAuthenticatedUser(req);
  const sale = await saleService.createSale(req.body as SaleInput, user.id);

  res.status(201).json({
    success: true,
    message: `Sale #${sale.id} recorded successfully.`,
    data: { sale },
  });
};
