<script setup lang="ts">
defineProps<{ title: string, busy?: boolean }>()
const emit = defineEmits<{ close: [] }>()
const dialog = useTemplateRef<HTMLDialogElement>('dialog')
const titleId = useId()
onMounted(() => dialog.value?.showModal())
</script>

<template>
  <Teleport to="body">
    <dialog
      ref="dialog"
      class="m-auto max-h-[90dvh] w-[calc(100%-1rem)] max-w-xl overflow-y-auto overscroll-contain rounded-3xl border border-white/10 bg-surface p-5 text-primary backdrop:bg-black/75 sm:p-7"
      :aria-labelledby="titleId"
      @cancel.prevent="!busy && emit('close')"
    >
      <div class="mb-5 flex items-center justify-between gap-3">
        <h2
          :id="titleId"
          class="text-xl font-semibold"
        >
          {{ title }}
        </h2><button
          type="button"
          class="button-secondary min-w-12 px-3"
          aria-label="Zamknij okno"
          :disabled="busy"
          @click="emit('close')"
        >
          ×
        </button>
      </div>
      <slot />
    </dialog>
  </Teleport>
</template>
