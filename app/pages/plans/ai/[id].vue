<script setup lang="ts">
import { z } from 'zod'
import { aiActionLabels } from '~/domain/ai'

const id = z.uuid().safeParse(useRoute().params.id)
if (!id.success) throw createError({ statusCode: 404, statusMessage: 'Nie znaleziono konsultacji' })
useHead({ title: 'Odpowiedź AI · Siłka' })
const { request, source, response, selections, proposal, busy, loading, error, message, confirm, prompt, targets, changes, load, validate, cancelPreview, previewProgression, accept, copy } = useAiConsultation(id.data)
const catalogName = (value: string | null) => (request.value?.context.catalog.find(item => item.id === value)?.name ?? value) || 'Brak'
const resultAnalysis = computed(() => request.value?.response?.action === 'analyze_history' ? request.value.response.payload : response.value?.action === 'analyze_history' ? response.value.payload : null)
onBeforeRouteLeave(() => !source.value || request.value?.applied || window.confirm('Odpowiedź nie została zatwierdzona. Opuścić podgląd? Prompt pozostanie na koncie, wklejony tekst zostanie odrzucony.'))
</script>

<template>
  <div>
    <NuxtLink
      to="/plans/ai"
      class="mb-4 inline-flex min-h-11 items-center text-sm text-secondary"
    >← Konsultacje</NuxtLink>
    <UiPageHeading
      :title="request ? aiActionLabels[request.action] : 'Konsultacja'"
      description="Odpowiedź AI staje się propozycją. Ty decydujesz, co zapisać."
    />
    <p
      v-if="loading"
      role="status"
      class="text-secondary"
    >
      Odczytywanie konsultacji…
    </p>
    <p
      v-if="error"
      role="alert"
      class="mb-5 text-sm text-red-300"
    >
      {{ error }}
    </p>
    <UiBaseButton
      v-if="!request && !loading"
      variant="secondary"
      @click="load"
    >
      Spróbuj ponownie
    </UiBaseButton>
    <template v-if="request">
      <div
        v-if="request.applied"
        class="ledger-section mb-8 space-y-4"
      >
        <p role="status">
          {{ message || 'Ta konsultacja została zatwierdzona.' }}
        </p>
        <NuxtLink
          v-if="request.result?.planId"
          :to="`/plans/${request.result.planId}`"
          class="button-primary"
        >Otwórz zapisany plan</NuxtLink>
        <NuxtLink
          to="/plans/ai"
          class="button-secondary"
        >Nowa konsultacja</NuxtLink>
      </div>
      <template v-else>
        <section class="ledger-section mb-8">
          <div class="flex flex-wrap items-center justify-between gap-4">
            <h2 class="section-label">
              01 · Prompt do skopiowania
            </h2><UiBaseButton
              :disabled="busy"
              @click="copy"
            >
              Kopiuj prompt
            </UiBaseButton>
          </div>
          <p class="mt-3 text-sm leading-relaxed text-secondary">
            Historia: {{ request.context.history.length }} zakończonych sesji. Katalog: {{ request.context.catalog.length }} ćwiczeń. Wklej prompt do wybranego AI, a otrzymany JSON przenieś poniżej.
          </p>
          <details class="mt-3">
            <summary class="flex min-h-11 cursor-pointer items-center text-sm underline underline-offset-4">
              Zobacz cały prompt
            </summary><textarea
              :value="prompt"
              readonly
              class="field mt-3 py-3"
              rows="10"
              aria-label="Prompt konsultacji AI"
            />
          </details>
        </section>
        <section class="ledger-section mb-8">
          <h2 class="section-label">
            02 · Odpowiedź do sprawdzenia
          </h2>
          <label class="mt-4 block text-sm">Wklej JSON z AI<textarea
            v-model="source"
            class="field mt-2 py-3"
            rows="8"
            :disabled="busy"
            placeholder="Sam JSON, bez bloków Markdown"
          /></label>
          <UiBaseButton
            class="mt-4"
            :busy="busy"
            :disabled="!source.trim()"
            @click="validate"
          >
            Sprawdź odpowiedź
          </UiBaseButton>
        </section>
      </template>
      <section
        v-if="response || resultAnalysis"
        class="ledger-section space-y-5"
      >
        <h2 class="section-label">
          {{ request.applied ? 'Zachowana analiza' : '03 · Podgląd propozycji' }}
        </h2>
        <template v-if="resultAnalysis">
          <p class="max-w-3xl leading-relaxed whitespace-pre-wrap">
            {{ resultAnalysis.summary }}
          </p>
          <h3
            v-if="resultAnalysis.observations.length"
            class="font-semibold"
          >
            Obserwacje
          </h3><ul class="list-inside list-disc space-y-3 text-sm leading-relaxed text-secondary">
            <li
              v-for="(item, index) in resultAnalysis.observations"
              :key="index"
            >
              {{ item }}
            </li>
          </ul>
          <h3
            v-if="resultAnalysis.recommendations.length"
            class="font-semibold"
          >
            Propozycje
          </h3><ul class="list-inside list-disc space-y-3 text-sm leading-relaxed text-secondary">
            <li
              v-for="(item, index) in resultAnalysis.recommendations"
              :key="index"
            >
              {{ item }}
            </li>
          </ul>
          <p class="text-sm text-secondary">
            Treść pochodzi z AI. Zachowanie analizy nie zmienia planu ani historii.
          </p>
        </template>
        <template v-if="response?.action === 'suggest_progression' && !request.applied">
          <p class="text-sm text-secondary">
            Dla każdej propozycji możesz wybrać jedną serię planu. Pozostaw „Nie stosuj”, aby pominąć sugestię. Zapis zmieni tylko wskazane ciężary.
          </p>
          <div
            v-for="(suggestion, index) in response.payload.suggestions"
            :key="index"
            class="space-y-3 border-t border-white/15 pt-5"
          >
            <h3 class="text-xl font-semibold">
              {{ catalogName(suggestion.exerciseId) }} · {{ String(suggestion.suggestedWeightKg).replace('.', ',') }} kg
            </h3>
            <p class="text-sm leading-relaxed text-secondary">
              {{ suggestion.reason }}
            </p>
            <label class="block text-sm">Seria dla propozycji {{ index + 1 }}<select
              v-model="selections[index]"
              class="field mt-2"
              :disabled="busy"
            ><option :value="undefined">Nie stosuj</option><option
              v-for="target in targets.filter(item => item.exerciseId === suggestion.exerciseId)"
              :key="target.value"
              :value="target.value"
            >{{ target.label }}</option></select></label>
          </div>
          <UiBaseButton
            variant="secondary"
            @click="previewProgression"
          >
            Pokaż zmiany ciężarów
          </UiBaseButton>
        </template>
        <template v-if="proposal && !request.applied">
          <p class="text-sm leading-relaxed text-secondary">
            {{ response?.action === 'create_plan' ? 'Powstanie nowy plan. Nie zostanie automatycznie ustawiony jako aktywny.' : response?.action === 'replace_plan' ? 'Zastąpisz cały plan, również opis i notatki. Zapisane treningi pozostaną bez zmian.' : 'Zmienią się wyłącznie poniższe ciężary planu.' }} Porównanie według pozycji w planie.
          </p>
          <h3 class="text-2xl font-bold">
            {{ proposal.name }}
          </h3>
          <p
            v-if="!changes.length"
            class="text-sm text-secondary"
          >
            Propozycja jest identyczna z zapisanym planem.
          </p>
          <ul class="divide-y divide-white/15">
            <li
              v-for="(change, index) in changes"
              :key="index"
              class="py-4 text-sm"
            >
              <p class="font-semibold">
                {{ change.label }}
              </p><div class="mt-2 grid gap-2 text-secondary sm:grid-cols-2">
                <p><span class="mr-2">Było:</span>{{ catalogName(change.before) }}</p><p class="text-primary">
                  <span class="mr-2 text-secondary">Propozycja:</span>{{ catalogName(change.after) }}
                </p>
              </div>
            </li>
          </ul>
        </template>
        <div
          v-if="!request.applied"
          class="flex flex-wrap gap-3 border-t border-white/15 pt-5"
        >
          <UiBaseButton
            :disabled="busy || (!proposal && response?.action !== 'analyze_history')"
            @click="confirm = true"
          >
            {{ response?.action === 'analyze_history' ? 'Zachowaj analizę' : 'Zatwierdź propozycję' }}
          </UiBaseButton>
          <UiBaseButton
            variant="secondary"
            :disabled="busy"
            @click="cancelPreview"
          >
            Anuluj podgląd
          </UiBaseButton>
        </div>
      </section>
      <p
        v-if="message && !request.applied"
        role="status"
        class="mt-5 text-sm text-secondary"
      >
        {{ message }}
      </p>
    </template>
    <UiDialog
      v-if="confirm"
      title="Zapisać zatwierdzoną propozycję?"
      :busy="busy"
      @close="confirm = false"
    >
      <p class="mb-5 text-sm leading-relaxed text-secondary">
        {{ response?.action === 'analyze_history' ? 'Zachowasz analizę na swoim koncie. Plan i historia nie zmienią się.' : 'Zapis obejmie propozycję z podglądu. Przy zmianie planu od przygotowania promptu operacja zostanie odrzucona.' }}
      </p>
      <p
        v-if="error"
        role="alert"
        class="mb-5 text-sm text-red-300"
      >
        {{ error }}
      </p><UiBaseButton
        :busy="busy"
        @click="accept"
      >
        Potwierdź zapis
      </UiBaseButton>
    </UiDialog>
  </div>
</template>
