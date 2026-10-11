<script setup lang="ts">
import { planSchema } from '#shared/schemas/plans'
import type { PlanInput } from '#shared/schemas/plans'
import type { CatalogExercise } from '~/services/plans'
import { moveItem, newSet, newWorkout } from '~/domain/plans'

const model = defineModel<PlanInput>({ required: true })
const props = defineProps<{
  catalog: CatalogExercise[]
  pending: boolean
  error?: string
}>()
const emit = defineEmits<{
  save: [
        plan: PlanInput,
  ]
  catalogAdd: [
        exercise: CatalogExercise,
  ]
}>()
const validation = ref('')
const pickerWorkout = ref<number | null>(null)
const weekdays = ['Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota', 'Niedziela']
function exerciseInfo(id: string) {
  return props.catalog.find(exercise => exercise.id === id)
}
function addExercise(exercise: CatalogExercise) {
  const workout = pickerWorkout.value === null ? undefined : model.value.workouts[pickerWorkout.value]
  if (workout && workout.exercises.length < 20) {
    workout.exercises.push({ exerciseId: exercise.id, restSeconds: 120, notes: '', sets: [newSet(), newSet(), newSet()] })
    emit('catalogAdd', exercise)
  }
  pickerWorkout.value = null
}
function submit() {
  const result = planSchema.safeParse(model.value)
  if (!result.success) {
    const issue = result.error.issues[0]
    const path = issue?.path ?? []
    const labels: Record<string, string> = { workouts: 'trening', exercises: 'ćwiczenie', sets: 'seria', name: 'nazwa', description: 'opis', weekday: 'dzień', restSeconds: 'odpoczynek', notes: 'notatki', repsMin: 'minimum powtórzeń', repsMax: 'maksimum powtórzeń', targetWeightKg: 'ciężar', exerciseId: 'wybór ćwiczenia' }
    const location = path.map(part => typeof part === 'number' ? part + 1 : labels[String(part)] ?? String(part)).join(' › ')
    validation.value = `${location ? `${location}: ` : ''}${issue?.code === 'custom' ? issue.message : 'Sprawdź wartość. Wymagane są nazwy, 1–7 treningów, 1–20 ćwiczeń i serii, 1–100 powtórzeń, odpoczynek 0–900 s i ciężar 0–1000 kg (do dwóch miejsc po przecinku).'}`
    return
  }
  validation.value = ''
  emit('save', result.data)
}
</script>

<template>
  <form
    class="space-y-5"
    @submit.prevent="submit"
  >
    <fieldset
      :disabled="pending"
      class="space-y-5"
    >
      <section class="panel space-y-4 p-5 sm:p-7">
        <label class="block text-sm font-medium">Nazwa planu<input
          v-model="model.name"
          class="field mt-2"
          maxlength="100"
          placeholder="Np. Góra / dół"
          required
        /></label>
        <label class="block text-sm font-medium">Opis <span class="font-normal text-secondary">(opcjonalnie)</span><textarea
          v-model="model.description"
          class="field mt-2 py-3"
          maxlength="2000"
          rows="2"
          placeholder="Twój cel i rytm tygodnia"
        /></label>
      </section>
      <details
        v-for="(workout, wi) in model.workouts"
        :key="wi"
        :open="wi === 0"
        class="panel p-5 sm:p-7"
      >
        <summary class="min-h-11 cursor-pointer text-lg font-semibold">
          {{ wi + 1 }}. {{ workout.name || 'Nowy trening' }} <span class="text-sm font-normal text-secondary">· {{ workout.exercises.length }} ćw.</span>
        </summary>
        <div class="mt-4 space-y-5">
          <div class="flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              class="button-secondary min-w-11 px-3"
              :aria-label="`Przenieś trening ${wi + 1} w górę`"
              :disabled="wi === 0"
              @click="moveItem(model.workouts, wi, -1)"
            >
              ↑
            </button><button
              type="button"
              class="button-secondary min-w-11 px-3"
              :aria-label="`Przenieś trening ${wi + 1} w dół`"
              :disabled="wi === model.workouts.length - 1"
              @click="moveItem(model.workouts, wi, 1)"
            >
              ↓
            </button><button
              type="button"
              class="min-h-11 px-2 text-sm text-secondary"
              :disabled="model.workouts.length === 1"
              @click="model.workouts.splice(wi, 1)"
            >
              Usuń trening
            </button>
          </div>
          <label class="block text-sm">Nazwa treningu<input
            v-model="workout.name"
            class="field mt-2"
            :aria-label="`Nazwa treningu ${wi + 1}`"
            maxlength="100"
            placeholder="Np. Góra A"
            required
          /></label>
          <label class="block text-sm">Dzień tygodnia<select
            v-model="workout.weekday"
            class="field mt-2"
            :aria-label="`Dzień treningu ${wi + 1}`"
          ><option :value="null">Bez stałego dnia</option><option
            v-for="(day, i) in weekdays"
            :key="day"
            :value="i + 1"
          >{{ day }}</option></select></label>
          <article
            v-for="(exercise, ei) in workout.exercises"
            :key="ei"
            class="space-y-4 rounded-2xl border border-white/10 bg-background p-3 sm:p-5"
          >
            <div class="flex items-start justify-between gap-2">
              <div>
                <h3 class="font-semibold">
                  {{ ei + 1 }}. {{ exerciseInfo(exercise.exerciseId)?.name ?? 'Ćwiczenie niedostępne' }}
                </h3><p class="mt-1 text-xs text-secondary">
                  {{ exerciseInfo(exercise.exerciseId)?.equipment }}
                </p>
              </div><button
                type="button"
                class="min-h-11 min-w-11 text-secondary"
                :aria-label="`Usuń ćwiczenie ${ei + 1} z treningu ${wi + 1}`"
                @click="workout.exercises.splice(ei, 1)"
              >
                ×
              </button>
            </div>
            <div class="flex items-center justify-between gap-2">
              <label class="text-xs text-secondary">Odpoczynek (s)<input
                v-model.number="exercise.restSeconds"
                class="field mt-1 max-w-28 px-3"
                type="number"
                inputmode="numeric"
                min="0"
                max="900"
                required
                :aria-label="`Odpoczynek po ćwiczeniu ${ei + 1}`"
              /></label><div class="flex gap-2">
                <button
                  type="button"
                  class="button-secondary min-w-11 px-3"
                  :aria-label="`Przenieś ćwiczenie ${ei + 1} w górę`"
                  :disabled="ei === 0"
                  @click="moveItem(workout.exercises, ei, -1)"
                >
                  ↑
                </button><button
                  type="button"
                  class="button-secondary min-w-11 px-3"
                  :aria-label="`Przenieś ćwiczenie ${ei + 1} w dół`"
                  :disabled="ei === workout.exercises.length - 1"
                  @click="moveItem(workout.exercises, ei, 1)"
                >
                  ↓
                </button>
              </div>
            </div>
            <p class="text-xs text-secondary">
              {{ exerciseInfo(exercise.exerciseId)?.weight_convention === 'per_hand' ? 'Podawaj ciężar jednej hantli / na rękę.' : exerciseInfo(exercise.exerciseId)?.weight_convention === 'assistance' ? 'Podawaj kilogramy asysty. Mniejsza asysta oznacza trudniejszą serię.' : exerciseInfo(exercise.exerciseId)?.weight_convention === 'bodyweight' ? 'Masa ciała. Dodatkowy ciężar jest opcjonalny.' : 'Podawaj łączny ciężar, wraz ze sztangą.' }} Puste pole = cel jeszcze nieustalony.
            </p>
            <PlansSetEditor
              v-for="(set, si) in exercise.sets"
              :key="si"
              :model-value="set"
              :index="si"
              :count="exercise.sets.length"
              :convention="exerciseInfo(exercise.exerciseId)?.weight_convention ?? 'total'"
              :can-remove="exercise.sets.length > 1"
              @update:model-value="exercise.sets[si] = $event"
              @remove="exercise.sets.splice(si, 1)"
              @move="moveItem(exercise.sets, si, $event)"
            />
            <button
              type="button"
              class="min-h-12 text-sm font-semibold text-accent disabled:opacity-40"
              :disabled="exercise.sets.length >= 20"
              @click="exercise.sets.push(newSet())"
            >
              + Dodaj serię
            </button>
            <label class="block text-xs text-secondary">Notatki do ćwiczenia<textarea
              v-model="exercise.notes"
              class="field mt-2 py-3 text-sm"
              maxlength="2000"
              rows="2"
              :aria-label="`Notatki do ćwiczenia ${ei + 1}`"
            /></label>
          </article>
          <button
            type="button"
            class="button-secondary w-full"
            :disabled="workout.exercises.length >= 20"
            @click="pickerWorkout = wi"
          >
            + Dodaj ćwiczenie
          </button>
        </div>
      </details>
      <button
        type="button"
        class="button-secondary w-full"
        :disabled="model.workouts.length >= 7"
        @click="model.workouts.push(newWorkout())"
      >
        + Dodaj trening
      </button>
    </fieldset>
    <p
      v-if="validation || error"
      role="alert"
      class="rounded-2xl border border-red-400/20 bg-red-400/8 p-4 text-sm text-red-300"
    >
      {{ validation || error }}
    </p>
    <div class="sticky bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-10 rounded-2xl border border-white/10 bg-background/95 p-3 backdrop-blur">
      <UiBaseButton
        type="submit"
        class="w-full"
        :busy="pending"
      >
        {{ pending ? 'Zapisywanie…' : 'Zapisz plan' }}<UiAppIcon name="check" />
      </UiBaseButton>
    </div>
  </form>
  <UiDialog
    v-if="pickerWorkout !== null"
    title="Katalog ćwiczeń"
    @close="pickerWorkout = null"
  >
    <PlansExercisePicker
      @select="addExercise"
      @close="pickerWorkout = null"
    />
  </UiDialog>
</template>
