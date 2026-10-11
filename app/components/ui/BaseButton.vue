<script setup lang="ts">
withDefaults(defineProps<{
  variant?: 'primary' | 'secondary'
  type?: 'button' | 'submit'
  busy?: boolean
  disabled?: boolean
}>(), { variant: 'primary', type: 'button', busy: false, disabled: false })
</script>

<template>
  <button
    :type="type"
    :class="variant === 'primary' ? 'button-primary' : 'button-secondary'"
    :disabled="disabled || busy"
    :aria-busy="busy"
  >
    <slot />
  </button>
</template>
