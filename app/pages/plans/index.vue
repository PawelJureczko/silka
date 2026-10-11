<script setup lang="ts">
useHead({ title: 'Plany — Siłka' })
const { data, status, error, refresh, archived, page, busy, actionError, planPageSize, activate, archive } = await usePlans()
const archiveTarget = ref<{ id: string, name: string, revision: number } | null>(null)
async function confirmArchive() {
  if (!archiveTarget.value) return
  await archive(archiveTarget.value.id, archiveTarget.value.revision, true)
  archiveTarget.value = null
}
</script>

<template>
  <div>
    <UiPageHeading
      eyebrow="Twój rytm tygodnia"
      title="Plany treningowe"
      description="Ułóż swój plan. Zmieniaj go wtedy, kiedy potrzebujesz."
    />
    <div class="mb-6 flex flex-wrap gap-3">
      <NuxtLink
        to="/plans/new"
        class="button-primary"
      >+ Nowy plan</NuxtLink><NuxtLink
        to="/plans/import"
        class="button-secondary"
      >Importuj kopię</NuxtLink><NuxtLink
        to="/plans/catalog"
        class="inline-flex min-h-12 items-center px-2 text-sm font-medium text-secondary"
      >Katalog ćwiczeń →</NuxtLink>
    </div>
    <div
      class="mb-5 flex gap-2"
      role="group"
      aria-label="Zakres planów"
    >
      <button
        type="button"
        class="min-h-11 rounded-xl px-4 text-sm"
        :class="!archived ? 'bg-accent/10 text-accent' : 'text-secondary'"
        :aria-pressed="!archived"
        @click="archived = false"
      >
        Moje plany
      </button><button
        type="button"
        class="min-h-11 rounded-xl px-4 text-sm"
        :class="archived ? 'bg-accent/10 text-accent' : 'text-secondary'"
        :aria-pressed="archived"
        @click="archived = true"
      >
        Archiwum
      </button>
    </div>
    <div
      v-if="error"
      class="panel space-y-4 p-6"
    >
      <p
        role="alert"
        class="text-red-300"
      >
        Nie udało się pobrać planów.
      </p><UiBaseButton
        variant="secondary"
        :busy="status === 'pending'"
        @click="refresh()"
      >
        Spróbuj ponownie
      </UiBaseButton>
    </div>
    <p
      v-else-if="status === 'pending'"
      role="status"
      class="panel p-6 text-secondary"
    >
      Pobieranie planów…
    </p>
    <template v-else>
      <UiEmptyState
        v-if="!data?.plans.length"
        kind="plan"
        :title="archived ? 'Archiwum jest puste' : 'Pierwszy krok: Twój plan'"
        :description="archived ? 'Plany możesz archiwizować i przywracać. Historia treningów pozostaje bez zmian.' : 'Dodaj treningi, ćwiczenia i serie albo zaimportuj kopię od drugiej osoby.'"
      />
      <div
        v-else
        class="grid gap-4 sm:grid-cols-2"
      >
        <article
          v-for="plan in data.plans"
          :key="plan.id"
          class="panel flex flex-col p-5 sm:p-6"
        >
          <div class="mb-5 flex items-center justify-between">
            <UiAppIcon
              name="plan"
              class="text-accent"
            /><span
              v-if="plan.id === data.activeId"
              class="rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent"
            >Aktywny plan</span>
          </div>
          <h2 class="text-xl font-semibold break-words">
            {{ plan.name }}
          </h2><p
            v-if="plan.description"
            class="mt-2 line-clamp-3 text-sm leading-relaxed break-words text-secondary"
          >
            {{ plan.description }}
          </p>
          <div class="mt-auto flex flex-wrap gap-2 pt-6">
            <template v-if="!archived">
              <NuxtLink
                :to="`/plans/${plan.id}`"
                class="button-secondary"
              >Edytuj</NuxtLink><UiBaseButton
                v-if="plan.id !== data.activeId"
                :disabled="busy"
                @click="activate(plan.id)"
              >
                Ustaw aktywny
              </UiBaseButton><button
                type="button"
                class="min-h-12 px-2 text-sm text-secondary"
                :disabled="busy"
                @click="archiveTarget = plan"
              >
                Archiwizuj
              </button>
            </template><UiBaseButton
              v-else
              variant="secondary"
              :disabled="busy"
              @click="archive(plan.id, plan.revision, false)"
            >
              Przywróć plan
            </UiBaseButton>
          </div>
        </article>
      </div>
      <div class="mt-5 flex flex-wrap items-center gap-3">
        <UiBaseButton
          v-if="page > 0"
          variant="secondary"
          @click="page--"
        >
          Poprzednia strona
        </UiBaseButton><UiBaseButton
          v-if="data?.plans.length === planPageSize"
          variant="secondary"
          @click="page++"
        >
          Następna strona
        </UiBaseButton>
      </div>
    </template>
    <p
      v-if="actionError"
      role="alert"
      class="mt-4 rounded-2xl bg-red-400/8 p-4 text-sm text-red-300"
    >
      {{ actionError }}
    </p>
    <UiDialog
      v-if="archiveTarget"
      title="Zarchiwizować plan?"
      :busy="busy"
      @close="archiveTarget = null"
    >
      <p class="mb-5 leading-relaxed text-secondary">
        „{{ archiveTarget.name }}” trafi do archiwum i przestanie być aktywny. Możesz go przywrócić; zapisane treningi pozostaną bez zmian.
      </p><UiBaseButton
        :busy="busy"
        @click="confirmArchive"
      >
        Archiwizuj plan
      </UiBaseButton>
    </UiDialog>
  </div>
</template>
