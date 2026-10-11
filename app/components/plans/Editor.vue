<script setup lang="ts">
import type { PlanInput } from '#shared/schemas/plans'
import type { CatalogExercise } from '~/services/plans'
import { fetchPlan, savePlan, buildPlanExport } from '~/services/plans'
import { copyPlanExport, downloadPlanExport, serializePlanExport } from '~/services/plan-transfer'
import { newPlan } from '~/domain/plans'

const props = defineProps<{
  planId?: string
}>()
const client = usePlanClient()
const { user } = useAuthState()
const model = ref<PlanInput>(newPlan())
const catalog = ref<CatalogExercise[]>([])
const id = ref(props.planId ?? crypto.randomUUID())
const revision = ref<number | null>(null)
const archived = ref(false)
const loading = ref(Boolean(props.planId))
const pending = ref(false)
const error = ref('')
const loaded = ref(!props.planId)
const savedSnapshot = ref(JSON.stringify(model.value))
const dirty = computed(() => JSON.stringify(model.value) !== savedSnapshot.value)
const saved = ref(false)
const exportText = ref('')
const exportMessage = ref('')
const discardDialog = ref(false)
let attempt: {
  id: string
  payload: string
} | null = null
const header = computed(() => props.planId ? 'Twój plan' : 'Nowy plan')
useHead({ title: () => `${header.value} — Siłka` })
async function load() {
  if (!props.planId)
    return
  loading.value = true
  error.value = ''
  try {
    const result = await fetchPlan(client, props.planId)
    model.value = result.plan
    catalog.value = result.exercises
    revision.value = result.revision
    archived.value = result.archived
    savedSnapshot.value = JSON.stringify(model.value)
    loaded.value = true
  }
  catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'Nie udało się pobrać planu.'
  }
  finally {
    loading.value = false
    discardDialog.value = false
  }
}
function addCatalog(exercise: CatalogExercise) {
  if (!catalog.value.some(item => item.id === exercise.id))
    catalog.value.push(exercise)
}
async function save(plan: PlanInput) {
  if (pending.value)
    return
  pending.value = true
  error.value = ''
  saved.value = false
  const payload = JSON.stringify(plan)
  if (attempt?.payload !== payload)
    attempt = { id: crypto.randomUUID(), payload }
  try {
    const result = await savePlan(client, id.value, revision.value, attempt.id, plan)
    revision.value = result.revision
    model.value = plan
    savedSnapshot.value = JSON.stringify(plan)
    attempt = null
    saved.value = true
    if (!props.planId)
      await navigateTo(`/plans/${id.value}`, { replace: true })
  }
  catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'Nie udało się zapisać planu.'
  }
  finally {
    pending.value = false
  }
}
function prepareExport() {
  try {
    exportText.value = serializePlanExport(buildPlanExport(model.value, catalog.value))
    exportMessage.value = ''
  }
  catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'Uzupełnij i zapisz plan przed eksportem.'
  }
}
async function copyExport() {
  exportMessage.value = await copyPlanExport(exportText.value) ? 'Skopiowano. Możesz przekazać kopię drugiej osobie.' : 'Schowek jest niedostępny. Pobierz plik lub skopiuj tekst ręcznie.'
}
function preventLeave(event: BeforeUnloadEvent) {
  if (dirty.value && user.value) {
    event.preventDefault()
    event.returnValue = ''
  }
}
onBeforeRouteLeave(() => !user.value || !dirty.value || window.confirm('Masz niezapisane zmiany w planie. Opuścić edytor i je odrzucić?'))
onMounted(() => {
  window.addEventListener('beforeunload', preventLeave)
  void load()
})
onBeforeUnmount(() => window.removeEventListener('beforeunload', preventLeave))
watch(() => user.value?.id, () => {
  model.value = newPlan()
  catalog.value = []
  savedSnapshot.value = JSON.stringify(model.value)
})
</script>

<template>
  <div>
    <NuxtLink
      to="/plans"
      class="mb-5 inline-flex min-h-11 items-center gap-2 text-sm text-secondary"
    >← Wszystkie plany</NuxtLink>
    <UiPageHeading
      eyebrow="Ułóż swój rytm"
      :title="header"
      description="Ćwiczenia, serie i odpoczynek. Dopasuj plan do siebie."
    />
    <p
      v-if="loading"
      role="status"
      class="panel p-6 text-secondary"
    >
      Pobieranie planu…
    </p>
    <div
      v-else-if="!loaded"
      class="panel space-y-4 p-6"
    >
      <p
        role="alert"
        class="text-red-300"
      >
        {{ error }}
      </p><UiBaseButton
        variant="secondary"
        @click="load"
      >
        Spróbuj ponownie
      </UiBaseButton>
    </div>
    <template v-else>
      <div
        v-if="archived"
        class="panel p-6"
      >
        <p>Ten plan jest w archiwum. Przywróć go na liście planów, aby go edytować.</p>
      </div>
      <template v-else>
        <div class="mb-4 flex flex-wrap items-center justify-between gap-3 text-sm">
          <p
            role="status"
            :class="dirty ? 'text-accent' : 'text-secondary'"
          >
            {{ dirty ? 'Niezapisane zmiany' : saved ? 'Plan zapisany na koncie' : 'Zmiany zapisujesz przyciskiem na dole' }}
          </p><div
            v-if="planId"
            class="flex flex-wrap gap-3"
          >
            <button
              type="button"
              class="min-h-11 font-medium text-secondary"
              :disabled="pending"
              @click="discardDialog = true"
            >
              Odśwież dane
            </button><NuxtLink
              :to="`/plans/ai?plan=${id}`"
              class="inline-flex min-h-11 items-center text-secondary"
              :aria-disabled="dirty || pending"
              @click="(dirty || pending) && $event.preventDefault()"
            >Skonsultuj plan z AI</NuxtLink><button
              type="button"
              class="min-h-11 font-medium text-accent disabled:opacity-40"
              :disabled="dirty || pending"
              @click="prepareExport"
            >
              Eksportuj kopię
            </button>
          </div>
        </div>
        <PlansPlanForm
          v-model="model"
          :catalog="catalog"
          :pending="pending"
          :error="error"
          @save="save"
          @catalog-add="addCatalog"
        />
      </template>
    </template>
    <UiDialog
      v-if="discardDialog"
      title="Odczytać zapisany plan?"
      :busy="loading"
      @close="discardDialog = false"
    >
      <p class="mb-5 leading-relaxed text-secondary">
        {{ dirty ? 'Twoje niezapisane zmiany zostaną odrzucone. Pobierz dane, jeśli chcesz rozpocząć edycję od aktualnej wersji.' : 'Pobierz najnowszą wersję planu z konta.' }}
      </p><UiBaseButton
        :busy="loading"
        @click="load"
      >
        {{ dirty ? 'Odrzuć zmiany i odczytaj plan' : 'Odczytaj plan' }}
      </UiBaseButton>
    </UiDialog>
    <UiDialog
      v-if="exportText"
      title="Przekaż kopię planu"
      @close="exportText = ''"
    >
      <p class="mb-4 text-sm leading-relaxed text-secondary">
        Eksport zawiera plan, notatki i opisy użytych ćwiczeń. Nie zawiera konta ani historii treningów. Odbiorca utworzy własną kopię.
      </p><textarea
        :value="exportText"
        readonly
        class="field mb-4 py-3 font-mono text-xs"
        rows="9"
        aria-label="JSON eksportu planu"
      /><div class="flex flex-wrap gap-3">
        <UiBaseButton @click="copyExport">
          Kopiuj JSON
        </UiBaseButton><UiBaseButton
          variant="secondary"
          @click="downloadPlanExport(exportText)"
        >
          Pobierz plik
        </UiBaseButton>
      </div><p
        v-if="exportMessage"
        role="status"
        class="mt-4 text-sm text-secondary"
      >
        {{ exportMessage }}
      </p>
    </UiDialog>
  </div>
</template>
