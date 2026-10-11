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
    <div class="grid flex-1 items-center gap-10 py-12 sm:gap-16 lg:grid-cols-2 lg:py-20">
      <div>
        <span class="mb-6 inline-flex items-center gap-2 rounded-full border border-accent/15 bg-accent/8 px-3 py-2 text-xs font-medium text-accent"><span class="size-1.5 rounded-full bg-accent" /> Twoja przestrzeń do treningu</span>
        <h1 class="text-[clamp(2.7rem,7vw,4.4rem)] leading-[1.05] font-bold tracking-[-0.045em]">
          Twój trening.<br /><span class="text-accent">Twoje tempo.</span>
        </h1>
        <p class="mt-6 max-w-sm text-lg leading-relaxed text-secondary">
          Mniej rozpraszaczy. Więcej miejsca na to, co naprawdę robisz dla siebie.
        </p>
        <div class="mt-8 hidden items-center gap-3 text-sm text-secondary lg:flex">
          <UiAppIcon
            name="shield"
            class="text-accent"
          /> Twoje plany i wyniki zostają Twoje.
        </div>
      </div>
      <section
        class="panel w-full p-6 sm:p-8"
        aria-labelledby="login-title"
      >
        <p class="eyebrow mb-3">
          Dobrze Cię widzieć
        </p>
        <h2
          id="login-title"
          class="text-2xl font-semibold tracking-tight"
        >
          Wracamy do treningu?
        </h2>
        <p class="mt-2 text-sm leading-relaxed text-secondary">
          Zaloguj się na swoje konto.
        </p>
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
                class="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-2xl text-secondary hover:text-primary"
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
            {{ pending ? 'Logowanie…' : 'Zaloguj się' }}<UiAppIcon
              v-if="!pending"
              name="arrow"
            />
          </UiBaseButton>
        </form>
        <p class="mt-6 text-center text-xs leading-relaxed text-secondary">
          Prywatna przestrzeń. Dostęp tylko dla zaproszonych osób.
        </p>
      </section>
    </div>
    <p class="text-xs text-secondary">
      Małe kroki. Konkretny progres.
    </p>
  </main>
</template>
