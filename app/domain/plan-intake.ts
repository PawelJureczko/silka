import { z } from 'zod'
import { planIntakeSchema } from '../../shared/schemas/plan-intake.ts'
import type { PlanIntake } from '../../shared/schemas/plan-intake.ts'

export const intakeOptions = {
  goal: { return: 'Powrót po przerwie', muscle: 'Budowa mięśni', strength: 'Zwiększenie siły', fitness: 'Sprawność i regularność', fat_loss: 'Trening podczas redukcji masy ciała' },
  experience: { new: 'Zaczynam od zera', returning: 'Wracam po przerwie', regular: 'Trenuję regularnie' },
  activity: { low: 'Głównie siedzę, mało ruchu', moderate: 'Spacery lub lekka aktywność', high: 'Praca fizyczna lub inne regularne treningi' },
  equipment: { dumbbells: 'Hantle', barbell: 'Sztanga', machines: 'Maszyny', cables: 'Wyciągi', bodyweight: 'Masa ciała', pullup_bar: 'Drążek / poręcze', bands: 'Gumy', bench: 'Ławka' },
  structure: { auto: 'Dobierz do celu i czasu', fbw: 'FBW (całe ciało)', split: 'Podział na partie / góra–dół' },
  limitations: { none: 'Nie znam ograniczeń', yes: 'Mam ból, uraz lub zalecenia', unsure: 'Nie wiem, co jest dla mnie odpowiednie' },
  recovery: { good: 'Zwykle wysypiam się i mam czas na odpoczynek', average: 'Bywa różnie', limited: 'Mało snu, dużo stresu lub trudna regeneracja' },
} as const

export function emptyPlanIntake(): PlanIntake {
  return { goal: 'return', age: null, experience: 'returning', breakLength: '', activity: 'low', daysPerWeek: 3, weekdays: [], minutes: 60, weeks: 4, equipment: [], structure: 'auto', limitations: 'unsure', limitationDetails: '', preferred: '', avoided: '', recovery: 'average', notes: '' }
}

export function buildPlanIntakeInstructions(input: unknown): string {
  const value = planIntakeSchema.parse(input)
  const lines = [
    'Ankieta do nowego planu (bez historii treningowej):',
    `Cel: ${intakeOptions.goal[value.goal]}. Wiek: ${value.age ?? 'nie podano'}.`,
    `Staż: ${intakeOptions.experience[value.experience]}. Przerwa: ${value.breakLength || 'nie podano'}.`,
    `Aktywność poza siłownią: ${intakeOptions.activity[value.activity]}.`,
    `Treningi/tydzień: ${value.daysPerWeek}. Dni (1=pon): ${value.weekdays.length ? [...value.weekdays].sort().join(', ') : 'elastyczne'}. Czas całej sesji z rozgrzewką: ${value.minutes} min. Plan na ${value.weeks} tygodni.`,
    `Dostępny sprzęt: ${value.equipment.map(item => intakeOptions.equipment[item]).join(', ')}. Podział: ${intakeOptions.structure[value.structure]}.`,
    `Ograniczenia: ${intakeOptions.limitations[value.limitations]}. ${value.limitations === 'none' ? '' : value.limitationDetails}`,
    `Chcę uwzględnić: ${value.preferred || 'bez preferencji'}. Unikam: ${value.avoided || 'nie podano'}.`,
    `Regeneracja: ${intakeOptions.recovery[value.recovery]}. Dodatkowe informacje: ${value.notes || 'brak'}.`,
  ]
  return z.string().max(2000).parse(lines.join('\n'))
}
