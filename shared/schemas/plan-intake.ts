import { z } from 'zod'

export const planIntakeSchema = z.strictObject({
  goal: z.enum(['return', 'muscle', 'strength', 'fitness', 'fat_loss']),
  age: z.number().int().min(18).max(100).nullable(),
  experience: z.enum(['new', 'returning', 'regular']),
  breakLength: z.string().trim().max(80),
  activity: z.enum(['low', 'moderate', 'high']),
  daysPerWeek: z.number().int().min(1).max(7),
  weekdays: z.array(z.number().int().min(1).max(7)).max(7),
  minutes: z.number().int().min(20).max(120),
  weeks: z.number().int().min(4).max(12),
  equipment: z.array(z.enum(['dumbbells', 'barbell', 'machines', 'cables', 'bodyweight', 'pullup_bar', 'bands', 'bench'])).min(1).max(8),
  structure: z.enum(['auto', 'fbw', 'split']),
  limitations: z.enum(['none', 'yes', 'unsure']),
  limitationDetails: z.string().trim().max(240),
  preferred: z.string().trim().max(180),
  avoided: z.string().trim().max(180),
  recovery: z.enum(['good', 'average', 'limited']),
  notes: z.string().trim().max(200),
}).superRefine((value, ctx) => {
  if (new Set(value.weekdays).size !== value.weekdays.length || (value.weekdays.length > 0 && value.weekdays.length !== value.daysPerWeek))
    ctx.addIssue({ code: 'custom', path: ['weekdays'], message: 'Wybierz tyle dni, ile treningów w tygodniu, albo pozostaw dni bez wyboru.' })
  if (new Set(value.equipment).size !== value.equipment.length)
    ctx.addIssue({ code: 'custom', path: ['equipment'], message: 'Sprzęt nie może się powtarzać.' })
  if (value.limitations === 'yes' && !value.limitationDetails)
    ctx.addIssue({ code: 'custom', path: ['limitationDetails'], message: 'Opisz ograniczenia, które trzeba uwzględnić.' })
})

export type PlanIntake = z.infer<typeof planIntakeSchema>
