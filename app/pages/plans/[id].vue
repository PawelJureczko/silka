<script setup lang="ts">
const route = useRoute()
const id = computed(() => String(route.params.id))
</script>

<template>
  <PlansEditor
    :key="id"
    :plan-id="id"
  />
</template>
