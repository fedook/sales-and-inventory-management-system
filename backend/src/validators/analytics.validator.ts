import { z } from 'zod'

function isCalendarDate(value: string): boolean {
  const [yearText, monthText, dayText] = value.split('-')
  const year = Number(yearText)
  const month = Number(monthText)
  const day = Number(dayText)
  const date = new Date(Date.UTC(year, month - 1, day))

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  )
}

const dateOnlySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use the YYYY-MM-DD format.')
  .refine(isCalendarDate, 'Enter a valid calendar date.')
  .optional()

export const analyticsQuerySchema = z
  .object({
    from: dateOnlySchema,
    to: dateOnlySchema,
  })
  .superRefine((query, ctx) => {
    if (query.from && query.to && query.from > query.to) {
      ctx.addIssue({
        code: 'custom',
        message: 'The start date cannot be after the end date.',
        path: ['from'],
      })
    }
  })

export const forecastQuerySchema = z.object({
  months: z.coerce.number().int().min(3).max(12).default(6),
})

export type AnalyticsQuery = z.infer<typeof analyticsQuerySchema>
export type ForecastQuery = z.infer<typeof forecastQuerySchema>
