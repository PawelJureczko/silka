<script setup lang="ts">
const paths = {
  home: ['m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z'],
  plan: ['M8 4H5a1 1 0 0 0-1 1v15a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V5a1 1 0 0 0-1-1h-3', 'M8 2h8v4H8z', 'M8 11h8m-8 5h5'],
  progress: ['M4 3v17h17', 'm7 14 4-4 4 2 5-7'],
  user: ['M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0', 'M4 21v-2a8 8 0 0 1 16 0v2'],
  dumbbell: ['M6 5v14M3 8v8m15-11v14m3-11v8M6 12h12'],
  arrow: ['M4 12h16m-6-6 6 6-6 6'],
  check: ['m5 12 4 4L19 6'],
  shield: ['m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6Z', 'm8 12 3 3 5-6'],
  logout: ['M9 4H4v16h5m0-8h12m-4-4 4 4-4 4'],
  eye: ['M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12', 'M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0'],
  clock: ['M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0', 'M12 7v5l3 2'],
} as const
defineProps<{ name: keyof typeof paths }>()
</script>

<template>
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.7"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    class="size-5 shrink-0"
  >
    <path
      v-for="path in paths[name]"
      :key="path"
      :d="path"
    />
  </svg>
</template>
