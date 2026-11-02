import type { RequestHandler } from 'express';
import * as supplierService from '../services/supplier.service.js';
import type {
  SupplierInput,
  SupplierQueryInput,
} from '../validators/supplier.validator.js';

export const list: RequestHandler = async (req, res) => {
  const query = req.validatedQuery as SupplierQueryInput;
  const result = await supplierService.listSuppliers(query);

  res.status(200).json({ success: true, data: result });
};

export const getById: RequestHandler = async (req, res) => {
  const supplier = await supplierService.getSupplierById(Number(req.params.id));

  res.status(200).json({ success: true, data: { supplier } });
};

export const create: RequestHandler = async (req, res) => {
  const supplier = await supplierService.createSupplier(
    req.body as SupplierInput,
  );

  res.status(201).json({
    success: true,
    message: 'Supplier created successfully.',
    data: { supplier },
  });
};

export const update: RequestHandler = async (req, res) => {
  const supplier = await supplierService.updateSupplier(
    Number(req.params.id),
    req.body as SupplierInput,
  );

  res.status(200).json({
    success: true,
    message: 'Supplier updated successfully.',
    data: { supplier },
  });
};

export const remove: RequestHandler = async (req, res) => {
  await supplierService.deleteSupplier(Number(req.params.id));

  res.status(200).json({
    success: true,
    message: 'Supplier deleted successfully.',
  });
};
