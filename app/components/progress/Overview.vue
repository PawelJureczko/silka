<script setup lang="ts">
import type { ProgressOverview } from '#shared/schemas/progress'
import { regularity } from '~/domain/progress'

const props = defineProps<{
  overview: ProgressOverview
  target: number
}>()
const consistency = computed(() => regularity(props.overview.weeks, props.target))
const max = computed(() => Math.max(props.target, ...props.overview.weeks.map(week => week.count)))
</script>

<template>
  <div class="ledger-section space-y-7">
    <div class="grid grid-cols-2 gap-5">
      <section>
        <p class="text-xs text-secondary">
          Zakończone · łącznie
        </p><p class="ledger-number mt-3 text-5xl">
          {{ overview.completedCount }}
        </p>
      </section>
      <section>
        <p class="text-xs text-secondary">
          Aktywne tygodnie
        </p><p class="ledger-number mt-3 text-5xl">
          {{ consistency.activeWeeks }}<span class="text-base text-secondary"> / 12</span>
        </p>
      </section>
    </div>
    <section class="border-t border-white/15 pt-5">
      <div class="flex items-start justify-between gap-3">
        <h2 class="section-label">
          Regularność
        </h2><NuxtLink
          to="/profile"
          class="inline-flex min-h-11 items-center text-sm text-primary underline decoration-secondary underline-offset-4"
        >Cel: {{ target }} / tydz.</NuxtLink>
      </div>
      <p class="mt-1 text-sm text-secondary">
        {{ consistency.targetWeeks }} z 12 tygodni z osiągniętym celem.
      </p>
      <div
        class="mt-5 grid h-24 grid-cols-12 items-end gap-1.5"
        aria-hidden="true"
      >
        <div
          v-for="week in overview.weeks"
          :key="week.startsOn"
          class="relative flex h-full flex-col justify-end"
        >
          <span class="mb-2 text-center text-[10px] tabular-nums text-secondary">{{ week.count }}</span><span
            class="min-h-1 rounded-t-sm"
            :class="week.count >= target ? 'bg-accent' : week.count ? 'bg-secondary' : 'bg-interactive'"
            :style="{ height: `${Math.max(4, week.count / max * 80)}px` }"
          />
        </div>
      </div>
      <div class="mt-3 flex justify-between text-xs text-secondary">
        <span>11 tygodni temu</span><span>Ten tydzień</span>
      </div>
      <details class="mt-4 text-sm">
        <summary class="flex min-h-11 cursor-pointer items-center text-primary underline decoration-secondary underline-offset-4">
          Tygodnie w liczbach
        </summary><ul class="space-y-2 text-secondary">
          <li
            v-for="week in overview.weeks"
            :key="week.startsOn"
          >
            Od {{ week.startsOn }}: treningi {{ week.count }}{{ week.count >= target ? ' · cel osiągnięty' : '' }}
          </li>
        </ul>
      </details>
      <p class="mt-3 text-xs leading-relaxed text-secondary">
        Seria aktywności: {{ consistency.streak >= 12 ? 'co najmniej 12' : consistency.streak }} tyg. Bieżący tydzień bez treningu nie przerywa serii przed jego końcem.
      </p>
    </section>
  </div>
</template>
