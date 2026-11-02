import type { RequestHandler } from 'express';
import * as analyticsService from '../services/analytics.service.js';
import type { AnalyticsQuery, ForecastQuery } from '../validators/analytics.validator.js';

export const overview: RequestHandler = async (req, res) => {
  const data = await analyticsService.getOverview(req.validatedQuery as AnalyticsQuery);
  res.status(200).json({ success: true, data });
};
export const salesTrend: RequestHandler = async (req, res) => {
  const data = await analyticsService.getSalesTrend(req.validatedQuery as AnalyticsQuery);
  res.status(200).json({ success: true, data });
};
export const topProducts: RequestHandler = async (req, res) => {
  const data = await analyticsService.getTopProducts(req.validatedQuery as AnalyticsQuery);
  res.status(200).json({ success: true, data });
};
export const lowestProducts: RequestHandler = async (req, res) => {
  const data = await analyticsService.getLowestProducts(req.validatedQuery as AnalyticsQuery);
  res.status(200).json({ success: true, data });
};
export const categoryPerformance: RequestHandler = async (req, res) => {
  const data = await analyticsService.getCategoryPerformance(req.validatedQuery as AnalyticsQuery);
  res.status(200).json({ success: true, data });
};
export const inventorySummary: RequestHandler = async (_req, res) => {
  const data = await analyticsService.getInventorySummary();
  res.status(200).json({ success: true, data });
};
export const forecast: RequestHandler = async (req, res) => {
  const query = req.validatedQuery as ForecastQuery;
  const [revenue, productDemand] = await Promise.all([
    analyticsService.getForecast(query.months),
    analyticsService.getDemandForecast(),
  ]);
  res.status(200).json({ success: true, data: { revenue, productDemand } });
};
export const recommendations: RequestHandler = async (_req, res) => {
  const data = await analyticsService.getRecommendations();
  res.status(200).json({ success: true, data });
};
