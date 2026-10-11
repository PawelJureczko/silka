import { z } from 'zod'

export const signInSchema = z.object({
  email: z.string().trim().pipe(z.email('Podaj poprawny adres e-mail.')),
  password: z.string().min(1, 'Podaj hasło.'),
})

export type SignInCredentials = z.infer<typeof signInSchema>
