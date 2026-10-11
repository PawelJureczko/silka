<script setup lang="ts">
import type { PlanExport } from '#shared/schemas/plans'
import type { CatalogExercise } from '~/services/plans'
import { fetchExercisesByIds, savePlan } from '~/services/plans'
import { parsePlanExport, mapImportedPlan } from '~/domain/plans'

const client = usePlanClient()
const text = ref('')
const source = ref<PlanExport | null>(null)
const targets = ref<Record<string, CatalogExercise>>({})
const error = ref('')
const pending = ref(false)
const pickerId = ref<string | null>(null)
const id = crypto.randomUUID()
let attempt: {
  id: string
  payload: string
} | null = null
const missing = computed(() => source.value?.exercises.filter(exercise => !targets.value[exercise.id]).length ?? 0)
const conventions: Record<string, string> = { total: 'kg łącznie', per_hand: 'kg na rękę', bodyweight: 'masa ciała', assistance: 'kg asysty' }
async function readFile(event: Event) {
  const file = event.target instanceof HTMLInputElement ? event.target.files?.[0] : undefined
  if (!file)
    return
  if (file.size > 256 * 1024) {
    error.value = 'Plik przekracza limit 256 KiB.'
    return
  }
  try {
    text.value = await file.text()
    source.value = null
    error.value = ''
  }
  catch {
    error.value = 'Nie udało się odczytać pliku.'
  }
}
async function preview() {
  error.value = ''
  source.value = null
  pending.value = true
  try {
    const parsed = parsePlanExport(text.value)
    const available = await fetchExercisesByIds(client, parsed.exercises.map(exercise => exercise.id))
    targets.value = {}
    for (const descriptor of parsed.exercises) {
      const match = available.find(exercise => exercise.id === descriptor.id && exercise.load_mode === descriptor.loadMode && exercise.weight_convention === descriptor.weightConvention)
      if (match)
        targets.value[descriptor.id] = match
    }
    source.value = parsed
  }
  catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'Nie udało się przygotować importu.'
  }
  finally {
    pending.value = false
  }
}
function choose(exercise: CatalogExercise) {
  const descriptor = source.value?.exercises.find(item => item.id === pickerId.value)
  if (!descriptor)
    return
  if (exercise.load_mode !== descriptor.loadMode || exercise.weight_convention !== descriptor.weightConvention) {
    error.value = 'Wybierz ćwiczenie z takim samym rodzajem obciążenia i sposobem zapisu ciężaru. Dzięki temu kilogramy zachowają znaczenie.'
    return
  }
  targets.value[descriptor.id] = exercise
  error.value = ''
  pickerId.value = null
}
async function approve() {
  if (!source.value || missing.value || pending.value)
    return
  pending.value = true
  error.value = ''
  try {
    const mapping = Object.fromEntries(Object.entries(targets.value).map(([key, exercise]) => [key, exercise.id]))
    const plan = mapImportedPlan(source.value, mapping)
    const payload = JSON.stringify(plan)
    if (attempt?.payload !== payload)
      attempt = { id: crypto.randomUUID(), payload }
    await savePlan(client, id, null, attempt.id, plan)
    await navigateTo(`/plans/${id}`)
  }
  catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'Nie udało się zaimportować kopii.'
  }
  finally {
    pending.value = false
  }
}
</script>

<template>
  <div class="space-y-5">
    <section
      v-if="!source"
      class="panel space-y-4 p-5 sm:p-7"
    >
      <label class="block text-sm font-medium">Wklej JSON eksportu<textarea
        v-model="text"
        class="field mt-2 py-3 font-mono text-xs"
        rows="9"
        placeholder="{&quot;format&quot;:&quot;silka-plan&quot;,&quot;schemaVersion&quot;:1,…}"
      /></label><label class="block text-sm text-secondary">Albo wybierz plik JSON<input
        class="mt-2 block min-h-12 w-full text-sm file:mr-3 file:min-h-11 file:rounded-xl file:border-0 file:bg-interactive file:px-3 file:text-primary"
        type="file"
        accept=".json,application/json"
        @change="readFile"
      /></label><UiBaseButton
        :busy="pending"
        :disabled="!text.trim()"
        @click="preview"
      >
        Sprawdź i pokaż podgląd
      </UiBaseButton>
    </section>
    <template v-else>
      <section class="panel p-5 sm:p-7">
        <p class="eyebrow mb-3">
          Podgląd nowej kopii
        </p><h2 class="text-2xl font-semibold break-words">
          {{ source.plan.name }}
        </h2><p
          v-if="source.plan.description"
          class="mt-3 text-sm whitespace-pre-wrap text-secondary"
        >
          {{ source.plan.description }}
        </p><div
          v-for="(workout, wi) in source.plan.workouts"
          :key="wi"
          class="mt-5 border-t border-white/10 pt-4"
        >
          <h3 class="font-semibold">
            {{ wi + 1 }}. {{ workout.name }}
          </h3><ul class="mt-2 space-y-3 text-sm text-secondary">
            <li
              v-for="(exercise, ei) in workout.exercises"
              :key="ei"
            >
              <p>{{ source.exercises.find(item => item.id === exercise.exerciseId)?.name }} · odpoczynek {{ exercise.restSeconds }} s</p><p
                v-for="(set, si) in exercise.sets"
                :key="si"
                class="mt-1 pl-3"
              >
                {{ si + 1 }}. {{ set.setType === 'warmup' ? 'Rozgrzewka' : 'Robocza' }} · {{ set.repsMin }}–{{ set.repsMax }} powt. · {{ set.targetWeightKg === null ? 'bez ustalonego ciężaru' : `${set.targetWeightKg} kg` }}
              </p><p
                v-if="exercise.notes"
                class="mt-1 pl-3 whitespace-pre-wrap"
              >
                {{ exercise.notes }}
              </p>
            </li>
          </ul>
        </div>
      </section>
      <section class="panel space-y-4 p-5 sm:p-7">
        <h2 class="text-lg font-semibold">
          Dopasuj ćwiczenia
        </h2><p class="text-sm leading-relaxed text-secondary">
          Ćwiczenia własne drugiej osoby wymagają wyboru odpowiednika lub dodania ćwiczenia do Twojego katalogu. Zachowaj ten sam sposób liczenia ciężaru.
        </p><div
          v-for="exercise in source.exercises"
          :key="exercise.id"
          class="rounded-2xl bg-background p-4"
        >
          <p class="font-medium">
            {{ exercise.name }}
          </p><p class="mt-1 text-xs text-secondary">
            {{ exercise.equipment }} · {{ conventions[exercise.weightConvention] }} · krok {{ exercise.weightIncrementKg }} kg
          </p><p
            class="mt-2 text-sm"
            :class="targets[exercise.id] ? 'text-accent' : 'text-secondary'"
          >
            {{ targets[exercise.id]?.name ?? 'Wybierz odpowiednik' }}
          </p><button
            type="button"
            class="mt-2 min-h-11 text-sm font-semibold text-accent"
            :disabled="pending"
            @click="pickerId = exercise.id"
          >
            {{ targets[exercise.id] ? 'Zmień wybór' : 'Wybierz ćwiczenie' }}
          </button>
        </div>
      </section>
      <p class="text-sm leading-relaxed text-secondary">
        Zatwierdzenie utworzy nowy plan „{{ source.plan.name.slice(0, 91) }} — kopia” na Twoim koncie. Nie zmieni istniejących planów ani aktywnego przypisania.
      </p><div class="flex flex-wrap gap-3">
        <UiBaseButton
          :busy="pending"
          :disabled="missing > 0"
          @click="approve"
        >
          Zatwierdź import kopii
        </UiBaseButton><UiBaseButton
          variant="secondary"
          :disabled="pending"
          @click="source = null"
        >
          Anuluj import
        </UiBaseButton>
      </div>
    </template>
    <p
      v-if="error"
      role="alert"
      class="rounded-2xl bg-red-400/8 p-4 text-sm text-red-300"
    >
      {{ error }}
    </p>
    <UiDialog
      v-if="pickerId"
      title="Wybierz odpowiednik"
      @close="pickerId = null"
    >
      <p
        v-if="error"
        role="alert"
        class="mb-4 text-sm text-red-300"
      >
        {{ error }}
      </p><PlansExercisePicker
        @select="choose"
        @close="pickerId = null"
      />
    </UiDialog>
  </div>
</template>
