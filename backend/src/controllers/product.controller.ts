import type { RequestHandler } from 'express';
import { getAuthenticatedUser } from '../middleware/auth.middleware.js';
import * as productService from '../services/product.service.js';
import type {
  ProductInput,
  ProductQueryInput,
} from '../validators/product.validator.js';

export const list: RequestHandler = async (req, res) => {
  const query = req.validatedQuery as ProductQueryInput;
  const result = await productService.listProducts(query);

  res.status(200).json({ success: true, data: result });
};

export const categories: RequestHandler = async (_req, res) => {
  const categories = await productService.listCategories();

  res.status(200).json({ success: true, data: { categories } });
};

export const getById: RequestHandler = async (req, res) => {
  const product = await productService.getProductById(Number(req.params.id));

  res.status(200).json({ success: true, data: { product } });
};

export const create: RequestHandler = async (req, res) => {
  const user = getAuthenticatedUser(req);
  const product = await productService.createProduct(
    req.body as ProductInput,
    user.id,
  );

  res.status(201).json({
    success: true,
    message: 'Product created successfully.',
    data: { product },
  });
};

export const update: RequestHandler = async (req, res) => {
  const user = getAuthenticatedUser(req);
  const product = await productService.updateProduct(
    Number(req.params.id),
    req.body as ProductInput,
    user.id,
  );

  res.status(200).json({
    success: true,
    message: 'Product updated successfully.',
    data: { product },
  });
};

export const remove: RequestHandler = async (req, res) => {
  await productService.deleteProduct(Number(req.params.id));

  res.status(200).json({
    success: true,
    message: 'Product deleted successfully.',
  });
};
