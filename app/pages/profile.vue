<script setup lang="ts">
useHead({ title: 'Profil — Siłka' })
const { user, logout, pending } = useAuth()
const { data: profile, status, error, refresh } = await useProfile()
const logoutError = ref<string | null>(null)
async function submitLogout() {
  logoutError.value = await logout()
}
</script>

<template>
  <div>
    <UiPageHeading
      eyebrow="Twoja przestrzeń"
      title="Profil"
      description="Twoje konto. Twoje cele. Twoje tempo."
    />
    <div
      v-if="error"
      role="alert"
      class="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-400/20 bg-red-400/8 p-4 text-sm"
    >
      <p>Nie udało się pobrać profilu.</p><UiBaseButton
        variant="secondary"
        :busy="status === 'pending'"
        @click="refresh()"
      >
        Spróbuj ponownie
      </UiBaseButton>
    </div>
    <section
      class="panel p-6 sm:p-8"
      aria-labelledby="account-title"
    >
      <div class="flex items-center gap-4">
        <span class="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-accent/10 text-accent"><UiAppIcon
          name="user"
          class="size-7"
        /></span><div class="min-w-0">
          <h2
            id="account-title"
            class="text-xl font-semibold"
          >
            {{ profile?.display_name ?? 'Twoje konto' }}
          </h2><p class="mt-1 text-sm break-all text-secondary">
            {{ user?.email }}
          </p>
        </div>
      </div>
      <dl class="mt-7 divide-y divide-white/8 border-t border-white/8">
        <div class="py-5">
          <dt class="text-sm text-secondary">
            Cel treningowy
          </dt><dd class="mt-1 font-medium">
            {{ profile?.training_goal || 'Jeszcze nie ustawiony' }}
          </dd>
        </div>
        <div class="py-5">
          <dt class="text-sm text-secondary">
            Strefa czasowa
          </dt><dd class="mt-1 font-medium">
            {{ profile?.timezone ?? '—' }}
          </dd>
        </div>
      </dl>
    </section>
    <div class="my-5 flex gap-3 rounded-2xl border border-accent/15 bg-accent/5 p-5">
      <UiAppIcon
        name="shield"
        class="mt-0.5 text-accent"
      /><div>
        <h2 class="text-sm font-semibold">
          Tylko Twoje dane
        </h2><p class="mt-1 text-sm leading-relaxed text-secondary">
          Każde konto ma własną historię i własne plany. Druga osoba nie ma do nich dostępu.
        </p>
      </div>
    </div>
    <p
      v-if="logoutError"
      role="alert"
      class="mb-4 text-sm text-red-300"
    >
      {{ logoutError }}
    </p>
    <UiBaseButton
      variant="secondary"
      class="w-full sm:w-auto"
      :busy="pending"
      @click="submitLogout"
    >
      <UiAppIcon name="logout" />{{ pending ? 'Wylogowanie…' : 'Wyloguj się' }}
    </UiBaseButton>
  </div>
</template>
