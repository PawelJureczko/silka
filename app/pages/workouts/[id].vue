<script setup lang="ts">
const route = useRoute()
const id = computed(() => String(route.params.id))
definePageMeta({ layout: false })
</script>

<template>
  <WorkoutSession
    :id="id"
    :key="id"
  />
</template>
