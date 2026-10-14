<script setup lang="ts">
import type { WorkoutSet } from '#shared/schemas/workouts'
import { finishWorkout, workoutSummary } from '~/domain/workouts'
import { downloadPlanExport } from '~/services/plan-transfer'

const props = defineProps<{
  id: string
}>()
const profile = useProfile()
const { session, local, deleted, loading, pageError, error, storageError, syncing, saving, deleting, update, sync, load, cancelStart, remove } = useWorkoutPage(props.id)
const invalid = ref<Record<string, boolean>>({})
const finishDialog = ref<'completed' | 'abandoned' | null>(null)
const discardDialog = ref(false)
const cancelDialog = ref(false)
const deleteDialog = ref(false)
const focusMode = ref(true)
const immersive = computed(() => session.value?.status === 'active' && focusMode.value)
const editable = computed(() => session.value?.status === 'active' && Boolean(local.value) && !local.value?.conflict && !storageError.value && !loading.value && !deleting.value)
const invalidCount = computed(() => Object.values(invalid.value).filter(Boolean).length)
const summary = computed(() => session.value ? workoutSummary(session.value) : null)
const saveLabel = computed(() => storageError.value ? 'Brak lokalnego zapisu' : saving.value ? 'Zapisywanie lokalnie…' : local.value?.conflict ? 'Konflikt · szkic zachowany lokalnie' : local.value?.start ? 'Oczekuje na rozpoczęcie na koncie' : !session.value ? 'Brak odczytanego treningu' : local.value?.queue.length ? syncing.value ? 'Zapisano lokalnie · synchronizacja…' : 'Zapisano lokalnie · oczekuje na synchronizację' : 'Zapisano na koncie')
function change(exerciseId: string, next: WorkoutSet) {
  void update((value) => {
    const exercise = value.exercises.find(item => item.id === exerciseId)
    const index = exercise?.sets.findIndex(set => set.id === next.id) ?? -1
    if (!exercise || index < 0)
      return
    const wasCompleted = exercise.sets[index]?.status === 'completed'
    exercise.sets[index] = next
    if (next.status === 'completed' && !wasCompleted)
      value.restEndsAt = exercise.restSeconds && value.exercises.some(item => item.sets.some(set => set.status === 'pending')) ? new Date(Date.now() + exercise.restSeconds * 1000).toISOString() : null
  })
}
function addSet(exerciseId: string) {
  void update((value) => {
    const exercise = value.exercises.find(item => item.id === exerciseId)
    if (!exercise || exercise.sets.length >= 40)
      return
    exercise.sets.push({ id: crypto.randomUUID(), setType: 'working', plannedRepsMin: null, plannedRepsMax: null, plannedWeightKg: null, reps: null, weightKg: null, status: 'pending', completedAt: null })
  })
}
async function finish() {
  if (!finishDialog.value)
    return
  const status = finishDialog.value
  if (await update(value => Object.assign(value, finishWorkout(value, status))))
    finishDialog.value = null
}
async function discard() {
  await load(true)
  discardDialog.value = false
}
function exportDraft() {
  if (local.value)
    downloadPlanExport(JSON.stringify({ format: 'silka-workout-recovery', schemaVersion: 1, session: local.value.session }, null, 2), 'silka-workout-recovery.json')
}
function previous(exerciseId: string, position: number, setType: string) {
  return local.value?.previous.find(item => item.workoutExerciseId === exerciseId)?.sets.find(set => set.position === position && set.setType === setType)
}
function timer(extend: boolean) {
  void update((value) => {
    value.restEndsAt = extend ? new Date(Math.max(Date.now(), Date.parse(value.restEndsAt ?? '') || 0) + 30000).toISOString() : null
  })
}
async function cancel() {
  await cancelStart()
  cancelDialog.value = false
  await navigateTo('/')
}
async function confirmDelete() {
  if (!session.value || !await remove(props.id, session.value.revision))
    return
  deleteDialog.value = false
  clearNuxtData(key => key.startsWith('progress-') || key.startsWith('workout-dashboard:'))
  await navigateTo('/progress')
}
const sessionDate = computed(() => session.value ? new Intl.DateTimeFormat('pl-PL', { dateStyle: 'long', timeStyle: 'short', timeZone: profile.data.value?.timezone ?? 'Europe/Warsaw' }).format(new Date(session.value.startedAt)) : '')
useHead({ title: () => `${session.value?.workoutName ?? 'Trening'} — Siłka` })
</script>

<template>
  <NuxtLayout :name="immersive ? 'workout' : 'default'">
    <div>
      <NuxtLink
        to="/"
        class="mb-4 inline-flex min-h-11 items-center text-sm text-secondary"
      >← Start</NuxtLink>
      <UiPageHeading
        v-if="!immersive"
        :eyebrow="session?.planName ?? 'Twoja sesja'"
        :title="session?.workoutName ?? 'Trening'"
      />
      <p
        v-if="loading"
        role="status"
        class="mb-5 text-secondary"
      >
        Otwieranie treningu…
      </p>
      <div
        v-if="!deleted"
        class="mb-6 space-y-3 border-b border-white/15 pb-5"
      >
        <p
          role="status"
          class="text-sm"
          :class="local?.queue.length || local?.conflict ? 'text-accent' : 'text-secondary'"
        >
          {{ saveLabel }}
        </p>
        <p
          v-if="storageError || error || pageError"
          role="alert"
          class="text-sm text-red-300"
        >
          {{ storageError || error || pageError }}
        </p>
        <div class="flex flex-wrap gap-2">
          <UiBaseButton
            v-if="local?.queue.length || local?.start"
            variant="secondary"
            :busy="syncing"
            :disabled="Boolean(local?.conflict)"
            @click="sync"
          >
            Ponów synchronizację
          </UiBaseButton>
          <UiBaseButton
            v-if="!session && !local?.start"
            variant="secondary"
            :busy="loading"
            @click="load()"
          >
            Spróbuj ponownie
          </UiBaseButton>
          <UiBaseButton
            v-if="local?.conflict"
            variant="secondary"
            @click="exportDraft"
          >
            Pobierz szkic wyników
          </UiBaseButton>
          <UiBaseButton
            v-if="local?.conflict && session"
            variant="secondary"
            :disabled="syncing"
            @click="discardDialog = true"
          >
            Odczytaj wersję z konta
          </UiBaseButton>
        </div>
      </div>
      <p
        v-if="deleted"
        role="status"
        class="mb-5 text-secondary"
      >
        Ten trening został trwale usunięty.
        <NuxtLink
          to="/progress"
          class="inline-flex min-h-11 items-center text-primary underline underline-offset-4"
        >Wróć do historii</NuxtLink>
      </p>
      <UiBaseButton
        v-if="local?.conflict && local.start"
        variant="secondary"
        :disabled="syncing"
        class="mb-5"
        @click="cancelDialog = true"
      >
        Anuluj próbę rozpoczęcia
      </UiBaseButton>
      <template v-if="session">
        <div
          v-if="!immersive"
          class="mb-5 flex flex-wrap items-center justify-between gap-3"
        >
          <p class="text-sm text-secondary">
            {{ sessionDate }}
          </p><UiBaseButton
            variant="secondary"
            :disabled="loading || saving > 0 || deleting"
            @click="deleteDialog = true"
          >
            Usuń ten trening
          </UiBaseButton>
        </div>
        <WorkoutRestTimer
          v-if="session.status === 'active' && !immersive"
          :ends-at="session.restEndsAt"
          :disabled="!editable || saving > 0"
          @stop="timer(false)"
          @extend="timer(true)"
        />
        <WorkoutFocus
          v-if="immersive"
          :session="session"
          :previous="local?.previous ?? []"
          :editable="editable"
          :busy="saving > 0 || invalidCount > 0"
          @change="change"
          @validity="(id, value) => invalid[id] = value"
          @stop="timer(false)"
          @extend="timer(true)"
          @finish="finishDialog = 'completed'"
          @list="focusMode = false"
        />
        <UiBaseButton
          v-if="session.status === 'active' && !immersive"
          variant="secondary"
          class="mb-5"
          :disabled="saving > 0 || invalidCount > 0"
          @click="focusMode = true"
        >
          Wróć do bieżącej serii
        </UiBaseButton>
        <section
          v-if="session.status !== 'active'"
          class="panel mb-5 p-6"
        >
          <p class="eyebrow">
            {{ session.status === 'completed' ? 'Trening zakończony' : 'Trening porzucony' }}
          </p><h2 class="mt-3 text-2xl font-semibold">
            {{ summary?.completed }} wykonanych serii
          </h2><p class="mt-2 text-sm text-secondary">
            {{ summary?.minutes }} min · {{ summary?.skipped }} pominiętych serii
          </p>
          <p
            v-if="local?.queue.length"
            class="mt-4 text-sm text-accent"
          >
            Podsumowanie jest zapisane lokalnie. Zakończenie na koncie wymaga synchronizacji.
          </p>
        </section>
        <div
          v-if="!immersive"
          class="space-y-9"
        >
          <section
            v-for="(exercise, ei) in session.exercises"
            :key="exercise.id"
            class="ledger-section space-y-4"
          >
            <div class="flex items-start gap-4">
              <span
                class="ledger-number text-5xl text-secondary"
                aria-hidden="true"
              >{{ String(ei + 1).padStart(2, '0') }}</span>
              <div class="min-w-0">
                <p class="eyebrow">
                  Ćwiczenie {{ ei + 1 }} z {{ session.exercises.length }}
                </p><h2 class="mt-2 text-2xl font-bold tracking-tight">
                  {{ exercise.name }}
                </h2><p class="mt-2 text-sm text-secondary">
                  {{ exercise.equipment }} · {{ ({ total: 'kg łącznie', per_hand: 'kg na rękę', bodyweight: 'masa ciała + dodatkowe kg', assistance: 'kg asysty' })[exercise.weightConvention] }}
                </p>
              </div>
            </div>
            <p
              v-if="exercise.notes"
              class="text-sm whitespace-pre-wrap text-secondary"
            >
              {{ exercise.notes }}
            </p>
            <LazyWorkoutSuggestion
              v-if="editable"
              :exercise="exercise"
              :started-at="session.startedAt"
              :session-id="session.id"
              :disabled="saving > 0 || invalidCount > 0"
            />
            <p
              v-if="!local?.previous.some(item => item.workoutExerciseId === exercise.id) && session.status === 'active'"
              class="text-xs text-secondary"
            >
              Poprzedni wynik niedostępny.
            </p>
            <WorkoutSetRow
              v-for="(set, si) in exercise.sets"
              :key="set.id"
              :set="set"
              :index="si"
              :convention="exercise.weightConvention"
              :bodyweight="exercise.loadMode === 'bodyweight'"
              :disabled="!editable"
              :busy="saving > 0"
              :previous="previous(exercise.id, si, set.setType)"
              @change="change(exercise.id, $event)"
              @validity="invalid[set.id] = $event"
            />
            <UiBaseButton
              v-if="editable"
              variant="secondary"
              class="w-full"
              :disabled="saving > 0 || exercise.sets.length >= 40 || invalidCount > 0"
              @click="addSet(exercise.id)"
            >
              + Dodaj serię
            </UiBaseButton>
          </section>
        </div>
        <div
          v-if="session.status === 'active' && !immersive"
          class="mt-8 flex flex-wrap gap-3 border-t border-white/15 bg-background pt-5"
        >
          <UiBaseButton
            class="grow"
            :disabled="!editable || saving > 0 || invalidCount > 0"
            @click="finishDialog = 'completed'"
          >
            Zakończ trening
          </UiBaseButton><UiBaseButton
            variant="secondary"
            :disabled="!editable || saving > 0 || invalidCount > 0"
            @click="finishDialog = 'abandoned'"
          >
            Porzuć
          </UiBaseButton>
        </div>
      </template>
      <UiDialog
        v-if="deleteDialog && session"
        title="Trwale usunąć trening?"
        :busy="deleting"
        @close="deleteDialog = false"
      >
        <p class="font-semibold">
          {{ session.workoutName }}
        </p><p class="mt-1 text-sm text-secondary">
          {{ sessionDate }} · {{ summary?.completed }} wykonanych serii
        </p><p class="mt-5 leading-relaxed text-secondary">
          Usuniesz tę sesję i wszystkie jej serie z historii. Przestanie być uwzględniana w statystykach, rekordach i kolejnych sugestiach ciężaru. Planu treningowego to nie zmieni. Tej operacji nie można cofnąć.
        </p><p
          v-if="local?.queue.length || local?.conflict"
          class="mt-3 text-sm text-accent"
        >
          Usunięcie odrzuci również lokalny szkic i niewysłane zmiany tego treningu.
        </p><p
          v-if="error"
          role="alert"
          class="mt-4 text-sm text-red-300"
        >
          {{ error }}
        </p><div class="mt-6 flex flex-wrap gap-3">
          <UiBaseButton
            variant="secondary"
            :disabled="deleting"
            @click="deleteDialog = false"
          >
            Anuluj
          </UiBaseButton><UiBaseButton
            variant="secondary"
            class="border-red-300/50 text-red-300"
            :busy="deleting"
            @click="confirmDelete"
          >
            {{ deleting ? 'Usuwanie…' : 'Usuń trwale' }}
          </UiBaseButton>
        </div>
      </UiDialog>
      <UiDialog
        v-if="finishDialog"
        :title="finishDialog === 'completed' ? 'Zakończyć trening?' : 'Porzucić trening?'"
        :busy="saving > 0"
        @close="finishDialog = null"
      >
        <p class="mb-5 leading-relaxed text-secondary">
          {{ finishDialog === 'completed' ? 'Pozostałe serie zostaną oznaczone jako pominięte. Wyniki trafią do podsumowania; po zakończeniu nie można ich edytować.' : 'Wyniki pozostaną w porzuconej sesji, ale nie będą uwzględniane w postępach.' }} Zapis na koncie nastąpi po wysłaniu wcześniejszych zmian.
        </p><UiBaseButton
          :busy="saving > 0"
          @click="finish"
        >
          {{ finishDialog === 'completed' ? 'Zakończ i podsumuj' : 'Potwierdź porzucenie' }}
        </UiBaseButton>
        <p
          v-if="error"
          role="alert"
          class="mt-4 text-red-300"
        >
          {{ error }}
        </p>
      </UiDialog>
      <UiDialog
        v-if="cancelDialog"
        title="Anulować próbę rozpoczęcia?"
        @close="cancelDialog = false"
      >
        <p class="mb-5 text-secondary">
          Plan lub ćwiczenia są niedostępne, plan zmienił się albo na koncie trwa już inny trening. Ta próba nie utworzyła sesji. Wróć na Start i odczytaj aktualne dane.
        </p><UiBaseButton @click="cancel">
          Anuluj próbę i wróć na Start
        </UiBaseButton>
      </UiDialog>
      <UiDialog
        v-if="discardDialog"
        title="Odrzucić lokalne zmiany?"
        :busy="loading"
        @close="discardDialog = false"
      >
        <p class="mb-5 text-secondary">
          Najpierw możesz pobrać szkic wyników. Odczyt wersji z konta zastąpi lokalny szkic i kolejkę zmian; nie połączy ich automatycznie.
        </p><UiBaseButton
          :busy="loading"
          @click="discard"
        >
          Odrzuć szkic i odczytaj konto
        </UiBaseButton>
      </UiDialog>
    </div>
  </NuxtLayout>
</template>
