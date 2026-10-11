<script setup lang="ts">
definePageMeta({ layout: false })
useHead({ title: 'Zaloguj się — Siłka' })
const { login, pending, configured } = useAuth()
const email = ref('')
const password = ref('')
const showPassword = ref(false)
const errorMessage = ref<string | null>(null)

async function submit() {
  errorMessage.value = null
  try {
    errorMessage.value = await login(email.value, password.value)
  }
  finally {
    password.value = ''
    showPassword.value = false
  }
}
</script>

<template>
  <main class="mx-auto flex min-h-dvh max-w-5xl flex-col px-6 pt-[max(2rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))] sm:px-8">
    <UiAppBrand />
    <div class="grid flex-1 items-center gap-8 py-8 sm:gap-12 lg:grid-cols-2 lg:py-16">
      <div>
        <h1 class="text-[clamp(2.7rem,7vw,4.4rem)] leading-[1.05] font-bold tracking-[-0.045em]">
          Każda seria.<br /><span class="text-accent">Zapisana.</span>
        </h1>
        <p class="mt-5 max-w-sm leading-relaxed text-secondary">
          Plany, ciężary i powtórzenia. Twój dziennik na kolejny trening.
        </p>
      </div>
      <section
        class="panel w-full p-6 sm:p-8"
        aria-labelledby="login-title"
      >
        <h2
          id="login-title"
          class="text-2xl font-semibold tracking-tight"
        >
          Zaloguj się
        </h2>
        <form
          class="mt-7 space-y-5"
          :aria-busy="pending"
          @submit.prevent="submit"
        >
          <div>
            <label
              for="email"
              class="mb-2 block text-sm font-medium"
            >Adres e-mail</label>
            <input
              id="email"
              v-model="email"
              class="field"
              type="email"
              name="email"
              autocomplete="username"
              inputmode="email"
              autocapitalize="none"
              spellcheck="false"
              required
              :disabled="pending"
              placeholder="twoj@email.pl"
              :aria-describedby="errorMessage ? 'login-error' : undefined"
            />
          </div>
          <div>
            <label
              for="password"
              class="mb-2 block text-sm font-medium"
            >Hasło</label>
            <div class="relative">
              <input
                id="password"
                v-model="password"
                class="field pr-14"
                :type="showPassword ? 'text' : 'password'"
                name="password"
                autocomplete="current-password"
                required
                :disabled="pending"
                placeholder="Twoje hasło"
                :aria-describedby="errorMessage ? 'login-error' : undefined"
              />
              <button
                type="button"
                class="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-md text-secondary hover:text-primary"
                :aria-label="showPassword ? 'Ukryj hasło' : 'Pokaż hasło'"
                :aria-pressed="showPassword"
                :disabled="pending"
                @click="showPassword = !showPassword"
              >
                <UiAppIcon name="eye" />
              </button>
            </div>
          </div>
          <p
            v-if="errorMessage"
            id="login-error"
            role="alert"
            class="rounded-xl border border-red-400/20 bg-red-400/8 p-3 text-sm text-red-300"
          >
            {{ errorMessage }}
          </p>
          <p
            v-if="!configured"
            role="status"
            class="text-sm leading-relaxed text-secondary"
          >
            Logowanie jest chwilowo niedostępne. Spróbuj ponownie później.
          </p>
          <UiBaseButton
            type="submit"
            class="w-full"
            :busy="pending"
            :disabled="!configured"
          >
            {{ pending ? 'Logowanie…' : 'Zaloguj się' }}
          </UiBaseButton>
        </form>
        <p class="mt-6 text-center text-xs leading-relaxed text-secondary">
          Prywatna przestrzeń. Dostęp tylko dla zaproszonych osób.
        </p>
      </section>
    </div>
  </main>
</template>
