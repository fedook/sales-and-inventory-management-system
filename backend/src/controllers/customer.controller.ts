import type { RequestHandler } from 'express';
import * as customerService from '../services/customer.service.js';
import type {
  CustomerInput,
  CustomerQueryInput,
} from '../validators/customer.validator.js';

export const list: RequestHandler = async (req, res) => {
  const query = req.validatedQuery as CustomerQueryInput;
  const result = await customerService.listCustomers(query);

  res.status(200).json({ success: true, data: result });
};

export const getById: RequestHandler = async (req, res) => {
  const customer = await customerService.getCustomerById(Number(req.params.id));

  res.status(200).json({ success: true, data: { customer } });
};

export const purchases: RequestHandler = async (req, res) => {
  const result = await customerService.getCustomerPurchases(
    Number(req.params.id),
  );

  res.status(200).json({ success: true, data: result });
};

export const create: RequestHandler = async (req, res) => {
  const customer = await customerService.createCustomer(
    req.body as CustomerInput,
  );

  res.status(201).json({
    success: true,
    message: 'Customer created successfully.',
    data: { customer },
  });
};

export const update: RequestHandler = async (req, res) => {
  const customer = await customerService.updateCustomer(
    Number(req.params.id),
    req.body as CustomerInput,
  );

  res.status(200).json({
    success: true,
    message: 'Customer updated successfully.',
    data: { customer },
  });
};

export const remove: RequestHandler = async (req, res) => {
  await customerService.deleteCustomer(Number(req.params.id));

  res.status(200).json({
    success: true,
    message: 'Customer deleted successfully.',
  });
};
