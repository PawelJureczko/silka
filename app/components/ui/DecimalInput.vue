<script setup lang="ts">
import { parseDecimal } from '~/domain/plans'

const model = defineModel<number | null>({ required: true })
defineProps<{ id?: string, label: string, placeholder?: string, disabled?: boolean }>()
const text = ref(model.value === null ? '' : String(model.value).replace('.', ','))
watch(model, (value) => {
  if (!Number.isNaN(value) && parseDecimal(text.value) !== value) text.value = value === null ? '' : String(value).replace('.', ',')
})
function input(event: Event) {
  if (!(event.target instanceof HTMLInputElement)) return
  text.value = event.target.value
  model.value = parseDecimal(text.value)
}
</script>

<template>
  <input
    :id="id"
    class="field tabular-nums"
    type="text"
    inputmode="decimal"
    :aria-label="label"
    :aria-invalid="Number.isNaN(model)"
    :value="text"
    :placeholder="placeholder ?? '—'"
    :disabled="disabled"
    @input="input"
  />
</template>
