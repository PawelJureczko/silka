<script setup lang="ts">
import { planIntakeSchema } from '#shared/schemas/plan-intake'
import { buildPlanIntakeInstructions, emptyPlanIntake, intakeOptions } from '~/domain/plan-intake'

defineProps<{ busy: boolean, unavailable: boolean }>()
const emit = defineEmits<{ prepare: [instructions: string] }>()
const model = reactive(emptyPlanIntake())
const age = ref<number | string>('')
const errors = ref<Record<string, string>>({})
const form = useTemplateRef('form')
const weekdays = ['Pon', 'Wt', 'Śr', 'Czw', 'Pt', 'Sob', 'Nd']
function submit() {
  const parsed = planIntakeSchema.safeParse({ ...model, age: age.value === '' ? null : age.value })
  errors.value = {}
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const field = String(issue.path[0])
      errors.value[field] ??= field === 'equipment' ? 'Wybierz przynajmniej jeden rodzaj sprzętu.' : issue.message
    }
    nextTick(() => form.value?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus())
    return
  }
  emit('prepare', buildPlanIntakeInstructions(parsed.data))
}
</script>

<template>
  <form
    ref="form"
    class="min-w-0 space-y-8"
    :aria-busy="busy"
    @submit.prevent="submit"
  >
    <p class="text-sm leading-relaxed text-secondary">
      Wypełnij ankietę dla siebie. Przygotujemy prompt z odpowiedziami, dostępnymi ćwiczeniami i formatem odpowiedzi dla AI. Historia treningów nie zostanie dołączona.
    </p>
    <fieldset
      :disabled="busy"
      class="min-w-0 space-y-5 border-t border-white/15 pt-5"
    >
      <legend class="pr-4 font-semibold">
        01 · Cel i punkt wyjścia
      </legend>
      <label class="block text-sm">Na czym Ci zależy?<select
        v-model="model.goal"
        class="field mt-2"
      ><option
        v-for="(label, value) in intakeOptions.goal"
        :key="value"
        :value="value"
      >{{ label }}</option></select></label>
      <div class="grid gap-5 min-[600px]:grid-cols-2">
        <label class="block text-sm">Doświadczenie z treningiem siłowym<select
          v-model="model.experience"
          class="field mt-2"
        ><option
          v-for="(label, value) in intakeOptions.experience"
          :key="value"
          :value="value"
        >{{ label }}</option></select></label>
        <label class="block text-sm">Wiek <span class="text-secondary">(opcjonalnie, 18+)</span><input
          v-model.number="age"
          class="field mt-2"
          type="number"
          inputmode="numeric"
          min="18"
          max="100"
          step="1"
        /></label>
      </div>
      <label class="block text-sm">Przerwa i wcześniejszy staż <span class="text-secondary">(opcjonalnie)</span><input
        v-model="model.breakLength"
        class="field mt-2"
        maxlength="80"
        placeholder="Jak długo trenujesz lub ile trwała przerwa?"
      /></label>
      <label class="block text-sm">Ruch poza siłownią<select
        v-model="model.activity"
        class="field mt-2"
      ><option
        v-for="(label, value) in intakeOptions.activity"
        :key="value"
        :value="value"
      >{{ label }}</option></select></label>
    </fieldset>
    <fieldset
      :disabled="busy"
      class="min-w-0 space-y-5 border-t border-white/15 pt-5"
    >
      <legend class="pr-4 font-semibold">
        02 · Czas i sprzęt
      </legend>
      <div class="grid gap-5 min-[600px]:grid-cols-2">
        <label class="block text-sm">Treningi w tygodniu<select
          v-model="model.daysPerWeek"
          class="field mt-2"
        ><option
          v-for="day in 7"
          :key="day"
          :value="day"
        >{{ day }}</option></select></label>
        <label class="block text-sm">Cała sesja z rozgrzewką (min)<input
          v-model.number="model.minutes"
          class="field mt-2"
          type="number"
          inputmode="numeric"
          min="20"
          max="120"
          step="1"
          required
        /></label>
      </div>
      <fieldset class="min-w-0">
        <legend class="text-sm">
          Dni treningowe <span class="text-secondary">(opcjonalnie)</span>
        </legend>
        <p
          id="intake-days-help"
          class="mt-2 text-sm text-secondary"
        >
          Wybierz {{ model.daysPerWeek }} dni albo pozostaw elastyczny harmonogram.
        </p>
        <div class="mt-3 flex flex-wrap gap-2">
          <label
            v-for="(day, index) in weekdays"
            :key="day"
            class="flex min-h-12 min-w-12 cursor-pointer items-center gap-2 rounded-md border border-secondary/70 px-3 text-sm has-checked:border-accent has-checked:bg-interactive"
          >
            <input
              v-model="model.weekdays"
              type="checkbox"
              :value="index + 1"
              class="size-4 accent-accent"
              :aria-invalid="Boolean(errors.weekdays)"
              aria-describedby="intake-days-help intake-days-error"
            />{{ day }}
          </label>
        </div>
        <p
          id="intake-days-error"
          class="mt-2 text-sm text-red-300"
          :role="errors.weekdays ? 'alert' : undefined"
        >
          {{ errors.weekdays }}
        </p>
      </fieldset>
      <fieldset class="min-w-0">
        <legend class="text-sm">
          Z jakiego sprzętu możesz korzystać?
        </legend>
        <div class="mt-3 grid gap-2 min-[600px]:grid-cols-2">
          <label
            v-for="(label, value) in intakeOptions.equipment"
            :key="value"
            class="flex min-h-12 cursor-pointer items-center gap-3 rounded-md border border-secondary/70 px-3 has-checked:border-accent has-checked:bg-interactive"
          >
            <input
              v-model="model.equipment"
              type="checkbox"
              :value="value"
              class="size-4 shrink-0 accent-accent"
              :aria-invalid="Boolean(errors.equipment)"
              aria-describedby="intake-equipment-error"
            />{{ label }}
          </label>
        </div>
        <p
          id="intake-equipment-error"
          class="mt-2 text-sm text-red-300"
          :role="errors.equipment ? 'alert' : undefined"
        >
          {{ errors.equipment }}
        </p>
      </fieldset>
      <div class="grid gap-5 min-[600px]:grid-cols-2">
        <label class="block text-sm">Podział treningów<select
          v-model="model.structure"
          class="field mt-2"
        ><option
          v-for="(label, value) in intakeOptions.structure"
          :key="value"
          :value="value"
        >{{ label }}</option></select></label>
        <label class="block text-sm">Plan na ile tygodni?<select
          v-model="model.weeks"
          class="field mt-2"
        ><option
          v-for="weeks in [4, 6, 8, 12]"
          :key="weeks"
          :value="weeks"
        >{{ weeks }}</option></select></label>
      </div>
    </fieldset>
    <fieldset
      :disabled="busy"
      class="min-w-0 space-y-5 border-t border-white/15 pt-5"
    >
      <legend class="pr-4 font-semibold">
        03 · Ograniczenia i regeneracja
      </legend>
      <label class="block text-sm">Czy są ograniczenia, które trzeba uwzględnić?<select
        v-model="model.limitations"
        class="field mt-2"
      ><option
        v-for="(label, value) in intakeOptions.limitations"
        :key="value"
        :value="value"
      >{{ label }}</option></select></label>
      <label
        v-if="model.limitations !== 'none'"
        class="block text-sm"
      >Czego nie wykonywać lub co dostosować?<textarea
        v-model="model.limitationDetails"
        class="field mt-2 py-3"
        rows="3"
        maxlength="240"
        :required="model.limitations === 'yes'"
        :aria-invalid="Boolean(errors.limitationDetails)"
        aria-describedby="intake-limitations-help intake-limitations-error"
        placeholder="Opisz ograniczenia ruchu lub zalecenia, bez szczegółowej dokumentacji medycznej."
      /></label>
      <p
        id="intake-limitations-error"
        class="text-sm text-red-300"
        :role="errors.limitationDetails ? 'alert' : undefined"
      >
        {{ errors.limitationDetails }}
      </p>
      <p
        id="intake-limitations-help"
        class="text-sm leading-relaxed text-secondary"
      >
        AI nie oceni, czy możesz trenować z bólem lub po urazie. Jeśli nie wiesz, jakie ruchy są dla Ciebie odpowiednie, ustal je z lekarzem lub fizjoterapeutą przed realizacją planu.
      </p>
      <label class="block text-sm">Jak wygląda Twoja regeneracja?<select
        v-model="model.recovery"
        class="field mt-2"
      ><option
        v-for="(label, value) in intakeOptions.recovery"
        :key="value"
        :value="value"
      >{{ label }}</option></select></label>
    </fieldset>
    <fieldset
      :disabled="busy"
      class="min-w-0 space-y-5 border-t border-white/15 pt-5"
    >
      <legend class="pr-4 font-semibold">
        04 · Twoje preferencje
      </legend>
      <label class="block text-sm">Ćwiczenia lub partie, które chcesz uwzględnić <span class="text-secondary">(opcjonalnie)</span><textarea
        v-model="model.preferred"
        class="field mt-2 py-3"
        rows="2"
        maxlength="180"
      /></label>
      <label class="block text-sm">Ćwiczenia, których chcesz unikać <span class="text-secondary">(opcjonalnie)</span><textarea
        v-model="model.avoided"
        class="field mt-2 py-3"
        rows="2"
        maxlength="180"
      /></label>
      <label class="block text-sm">Co jeszcze pomoże dobrać plan? <span class="text-secondary">(opcjonalnie)</span><textarea
        v-model="model.notes"
        class="field mt-2 py-3"
        rows="3"
        maxlength="200"
        placeholder="Inne sporty, dostępność konkretnych maszyn, oczekiwania…"
      /></label>
    </fieldset>
    <div class="space-y-4 border-t border-white/15 pt-5">
      <p class="text-sm leading-relaxed text-secondary">
        „Przygotuj prompt” zapisze odpowiedzi na Twoim koncie jako prywatną konsultację. Zobaczysz cały tekst przed skopiowaniem do wybranego AI, również informacje o ograniczeniach. Nie podawaj danych, których nie chcesz mu przekazać. Plan zapiszesz dopiero po sprawdzeniu i zatwierdzeniu odpowiedzi.
      </p>
      <p
        v-if="Object.keys(errors).length"
        role="alert"
        class="text-sm text-red-300"
      >
        Sprawdź zaznaczone pola ankiety.
      </p>
      <UiBaseButton
        type="submit"
        :busy="busy"
        :disabled="unavailable"
        class="w-full min-[600px]:w-auto"
      >
        {{ busy ? 'Przygotowywanie promptu…' : 'Przygotuj prompt z ankiety' }}
      </UiBaseButton>
    </div>
  </form>
</template>
