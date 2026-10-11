<script setup lang="ts">
import type { ExerciseProgress } from '#shared/schemas/progress'

const props = defineProps<{
  points: ExerciseProgress['points']
  metric: 'weight' | 'reps' | 'volume'
  unit: string
  timezone: string
}>()
const id = useId()
const values = computed(() => props.points.flatMap((point) => {
  const value = props.metric === 'reps' ? point.reps : props.metric === 'volume' ? point.volumeKg : point.weightKg
  return value === null ? [] : [{ ...point, value }]
}))
const ceiling = computed(() => Math.max(1, Math.ceil(Math.max(...values.value.map(point => point.value), 0) * 1.1)))
const geometry = computed(() => {
  const start = Date.parse(values.value[0]?.startedAt ?? '')
  const end = Date.parse(values.value.at(-1)?.startedAt ?? '')
  return values.value.map((point, index, list) => ({ ...point,
    x: 44 + (end > start ? (Date.parse(point.startedAt) - start) / (end - start) : list.length > 1 ? index / (list.length - 1) : 0.5) * 300,
    y: 168 - (point.value / ceiling.value) * 148,
  }))
})
const line = computed(() => geometry.value.map(point => `${point.x},${point.y}`).join(' '))
function number(value: number) {
  return new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 2 }).format(value)
}
function date(value: string) {
  return new Intl.DateTimeFormat('pl-PL', { day: 'numeric', month: 'short', timeZone: props.timezone }).format(new Date(value))
}
</script>

<template>
  <div>
    <p
      v-if="!values.length"
      class="py-8 text-sm text-secondary"
    >
      Brak danych dla tego wykresu.
    </p>
    <template v-else>
      <svg
        viewBox="0 0 360 200"
        class="mt-5 w-full overflow-visible"
        role="img"
        :aria-labelledby="`${id}-title ${id}-description`"
      >
        <title :id="`${id}-title`">Progresja — {{ unit }}</title>
        <desc :id="`${id}-description`">Liczba sesji: {{ values.length }}. Pierwsza wartość {{ number(values[0]!.value) }}, ostatnia {{ number(values.at(-1)!.value) }} {{ unit }}. Szczegóły pod wykresem.</desc>
        <g
          v-for="fraction in [0, 0.5, 1]"
          :key="fraction"
        >
          <line
            x1="44"
            x2="344"
            :y1="168 - fraction * 148"
            :y2="168 - fraction * 148"
            stroke="currentColor"
            class="text-interactive"
          />
          <text
            x="36"
            :y="172 - fraction * 148"
            text-anchor="end"
            fill="currentColor"
            class="text-secondary"
            font-size="10"
          >{{ number(ceiling * fraction) }}</text>
        </g>
        <polyline
          v-if="geometry.length > 1"
          :points="line"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="text-accent"
        />
        <circle
          v-for="point in geometry"
          :key="point.sessionId"
          :cx="point.x"
          :cy="point.y"
          r="3.5"
          fill="currentColor"
          class="text-accent"
        />
        <text
          x="44"
          y="191"
          fill="currentColor"
          class="text-secondary"
          font-size="10"
        >{{ date(values[0]!.startedAt) }}</text>
        <text
          x="344"
          y="191"
          text-anchor="end"
          fill="currentColor"
          class="text-secondary"
          font-size="10"
        >{{ date(values.at(-1)!.startedAt) }}</text>
      </svg>
      <p class="mt-3 text-sm text-secondary">
        Ostatnio: <span class="font-medium text-primary">{{ number(values.at(-1)!.value) }} {{ unit }}</span> · sesje: {{ values.length }}
      </p>
      <details class="mt-4 border-t border-white/10 pt-3 text-sm">
        <summary class="flex min-h-11 cursor-pointer items-center text-primary underline decoration-secondary underline-offset-4">
          Wyniki sesji
        </summary>
        <ul class="divide-y divide-white/10">
          <li
            v-for="point in [...values].reverse()"
            :key="point.sessionId"
          >
            <NuxtLink
              :to="`/workouts/${point.sessionId}`"
              class="flex min-h-12 items-center justify-between gap-3 py-2"
            ><span>{{ date(point.startedAt) }}</span><span class="tabular-nums">{{ number(point.value) }} {{ unit }} <span aria-hidden="true">→</span></span></NuxtLink>
          </li>
        </ul>
      </details>
    </template>
  </div>
</template>
