import { z } from 'zod';

export const PdfRequestSchema = z.object({
	email: z.string().email("Invalid email format"),
	fullName: z.string().min(1, "Name is required"),
	tags: z.array(z.string().or(z.number())).optional(),
	identity: z.object({
		name: z.string().optional(),
		age: z.number().min(16).max(100).optional(),
		weightKg: z.number().min(30).max(300).optional(),
		heightCm: z.number().min(100).max(250).optional(),
		bodyFatPct: z.number().min(3).max(60).optional(),
		goal: z.string().optional(),
		bodyType: z.string().optional()
	}).passthrough().optional(),
	metabolicProfile: z.object({
		proteinGrams: z.number().nonnegative().optional(),
		carbsGrams: z.number().nonnegative().optional(),
		fatsGrams: z.number().nonnegative().optional()
	}).passthrough().optional(),
	meals: z.array(z.any()).optional(),
	intelligenceNotes: z.array(z.any()).optional(),
	explanation: z.string().optional(),
	personalizationScore: z.number().optional()
}).passthrough();

export type DeliveryPayload = z.infer<typeof PdfRequestSchema>;
