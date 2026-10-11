import { z } from 'zod'

export const profileInputSchema = z.strictObject({
  displayName: z.string().trim().min(1, 'Podaj nazwę.').max(100, 'Nazwa może mieć najwyżej 100 znaków.'),
  trainingGoal: z.string().max(2000, 'Cel może mieć najwyżej 2000 znaków.'),
  timezone: z.string().max(100).refine((value) => {
    try {
      new Intl.DateTimeFormat('pl-PL', { timeZone: value })
      return true
    }
    catch {
      return false
    }
  }, 'Wybierz poprawną strefę czasową.'),
  weeklyTarget: z.number().int().min(1).max(7),
})
export const preferencesSchema = z.object({ weeklyTarget: z.number().int().min(1).max(7).catch(3) }).passthrough()
export type ProfileInput = z.infer<typeof profileInputSchema>
