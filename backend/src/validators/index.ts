import { z } from "zod";

// --- Properties Schemas ---

export const createPropertySchema = z.object({
  name: z
    .string()
    .min(1, "Il nome è obbligatorio")
    .max(100, "Il nome è troppo lungo (max 100 char)"),
  address: z.string().max(255).optional().nullable(),
  notes: z.string().optional().nullable(),
  startDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Data di inizio non valida (usa YYYY-MM-DD)",
  }),
});

export const updatePropertySchema = createPropertySchema;

// --- Categories Schemas ---

export const createCategorySchema = z.object({
  name: z.string().min(1, "Il nome della categoria è obbligatorio").max(80),
  isRecurring: z.boolean().optional(),
  recurringAmount: z
    .number()
    .min(0, "L'importo non può essere negativo")
    .optional()
    .nullable(),
});

export const updateCategorySchema = z.object({
  name: z
    .string()
    .min(1, "Il nome della categoria non può essere vuoto")
    .max(80)
    .optional(),
  isRecurring: z.boolean().optional(),
  recurringAmount: z
    .number()
    .min(0, "L'importo non può essere negativo")
    .optional()
    .nullable(),
});

// --- Months Schemas ---

export const createMonthSchema = z.object({
  year: z.number().int().min(2000, "Anno non valido"),
  month: z.number().int().min(1, "Mese non valido").max(12, "Mese non valido"),
  agencyNetIncome: z
    .number()
    .or(
      z
        .string()
        .refine((val) => !isNaN(parseFloat(val)), "Deve essere un numero"),
    )
    .transform((val) => (typeof val === "string" ? parseFloat(val) : val)),
  notes: z.string().optional().nullable(),
});

export const updateMonthSchema = z.object({
  year: z.number().int().min(2000).optional(),
  month: z.number().int().min(1).max(12).optional(),
  agencyNetIncome: z
    .number()
    .or(z.string().refine((val) => !isNaN(parseFloat(val))))
    .transform((val) => (typeof val === "string" ? parseFloat(val) : val))
    .optional(),
  notes: z.string().optional().nullable(),
});

// --- Expenses Schemas ---

export const createExpenseSchema = z.object({
  categoryId: z.string().uuid("ID Categoria non valido").optional().nullable(),
  amount: z
    .number()
    .min(0, "L'importo della spesa non può essere negativo")
    .or(
      z
        .string()
        .refine(
          (val) => !isNaN(parseFloat(val)),
          "L'importo deve essere numerico",
        ),
    )
    .transform((val) => (typeof val === "string" ? parseFloat(val) : val)),
  description: z.string().max(255).optional().nullable(),
});

export const updateExpenseSchema = z.object({
  categoryId: z.string().uuid("ID Categoria non valido").optional().nullable(),
  amount: z
    .number()
    .min(0, "L'importo della spesa non può essere negativo")
    .or(z.string().refine((val) => !isNaN(parseFloat(val))))
    .transform((val) => (typeof val === "string" ? parseFloat(val) : val))
    .optional(),
  description: z.string().max(255).optional().nullable(),
});
