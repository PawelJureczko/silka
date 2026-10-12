<script setup lang="ts">
import { exerciseSchema } from '#shared/schemas/plans'
import type { ExerciseInput } from '#shared/schemas/plans'
import { createExercise } from '~/services/plans'
import type { CatalogExercise } from '~/services/plans'

const emit = defineEmits<{
  created: [
        exercise: CatalogExercise,
  ]
  cancel: [
  ]
}>()
const client = usePlanClient()
const form = reactive<ExerciseInput>({ name: '', equipment: '', muscleGroup: '', loadMode: 'external', weightConvention: 'total', weightIncrementKg: 2.5 })
const step = ref<number | null>(2.5)
const error = ref('')
const pending = ref(false)
let attempt: {
  id: string
  payload: string
} | null = null
watch(() => form.loadMode, (mode) => {
  form.weightConvention = mode === 'bodyweight' ? 'bodyweight' : mode === 'assisted' ? 'assistance' : 'total'
})
async function submit() {
  const result = exerciseSchema.safeParse({ ...form, weightIncrementKg: step.value })
  if (!result.success) {
    error.value = 'Uzupełnij nazwę, sprzęt i partię mięśniową. Krok ciężaru musi wynosić 0,01–100 kg, z najwyżej dwoma miejscami po przecinku.'
    return
  }
  pending.value = true
  error.value = ''
  const payload = JSON.stringify(result.data)
  if (attempt?.payload !== payload)
    attempt = { id: crypto.randomUUID(), payload }
  try {
    emit('created', await createExercise(client, result.data, attempt.id))
  }
  catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'Nie udało się dodać ćwiczenia.'
  }
  finally {
    pending.value = false
  }
}
</script>

<template>
  <form
    class="space-y-4"
    @submit.prevent="submit"
  >
    <h2 class="text-xl font-semibold">
      Nowe ćwiczenie
    </h2>
    <p class="text-sm text-secondary">
      Dodasz je do wspólnego katalogu wszystkich użytkowników Siłki. W nazwie nie wpisuj danych osobowych ani prywatnych notatek.
    </p>
    <fieldset
      :disabled="pending"
      class="space-y-4"
    >
      <label class="block text-sm">Nazwa<input
        v-model="form.name"
        class="field mt-2"
        maxlength="100"
        required
        placeholder="Np. Przysiad bułgarski"
      /></label>
      <div class="grid gap-4 sm:grid-cols-2">
        <label class="block text-sm">Sprzęt<input
          v-model="form.equipment"
          class="field mt-2"
          maxlength="100"
          required
          placeholder="Np. Hantle"
        /></label>
        <label class="block text-sm">Partia mięśniowa<input
          v-model="form.muscleGroup"
          class="field mt-2"
          maxlength="100"
          required
          placeholder="Np. Nogi"
        /></label>
      </div>
      <label class="block text-sm">Rodzaj obciążenia<select
        v-model="form.loadMode"
        class="field mt-2"
      ><option value="external">Ciężar zewnętrzny</option><option value="bodyweight">Masa ciała</option><option value="assisted">Asysta (mniej kg = trudniej)</option></select></label>
      <label
        v-if="form.loadMode === 'external'"
        class="block text-sm"
      >Zapis ciężaru<select
        v-model="form.weightConvention"
        class="field mt-2"
      ><option value="total">Łączny ciężar</option><option value="per_hand">Ciężar jednej hantli / na rękę</option></select></label>
      <label class="block text-sm">Krok zmiany ciężaru (kg)<UiDecimalInput
        v-model="step"
        label="Krok zmiany ciężaru w kilogramach"
        class="mt-2"
      /></label>
    </fieldset>
    <p
      v-if="error"
      role="alert"
      class="text-sm text-red-300"
    >
      {{ error }}
    </p>
    <div class="flex flex-wrap gap-3">
      <UiBaseButton
        type="submit"
        :busy="pending"
      >
        Dodaj do katalogu
      </UiBaseButton><UiBaseButton
        variant="secondary"
        :disabled="pending"
        @click="emit('cancel')"
      >
        Anuluj
      </UiBaseButton>
    </div>
  </form>
</template>
