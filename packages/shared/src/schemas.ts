import { z } from 'zod';

export const UserPayloadSchema = z.object({
  fullName: z.string().min(2, { message: "Full name must be at least 2 characters." }),
  email: z.string().email({ message: "Invalid email format." }),
  metabolicProfile: z.object({
    targetKcal: z.number(),
    protein: z.number(),
    carbs: z.number(),
    fats: z.number()
  })
});

export type UserPayload = z.infer<typeof UserPayloadSchema>;
