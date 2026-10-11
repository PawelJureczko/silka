<script setup lang="ts">
import { preferencesSchema } from '#shared/schemas/profile'

useHead({ title: 'Profil — Siłka' })
const { user, logout, pending } = useAuth()
const editor = await useProfileEditor()
const { form, editing, saving, error: saveError, success, edit, save } = editor
const { data: profile, status, error, refresh } = editor.profile
const logoutError = ref<string | null>(null)
const target = computed(() => preferencesSchema.parse(profile.value?.preferences ?? {}).weeklyTarget)
const timezones = computed(() => [...new Set(['Europe/Warsaw', 'UTC', form.timezone, ...Intl.supportedValuesOf('timeZone')])])
async function submitLogout() {
  logoutError.value = await logout()
}
onBeforeRouteLeave(() => !editing.value || (!saving.value && window.confirm('Odrzucić niezapisane zmiany profilu?')))
</script>

<template>
  <div>
    <UiPageHeading
      title="Twoje tempo."
      description="Ustaw cel i rytm swojego tygodnia."
    />
    <p
      v-if="status === 'pending'"
      role="status"
      class="mb-5 text-secondary"
    >
      Odczytywanie profilu…
    </p>
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
      class="max-w-2xl"
      aria-labelledby="account-title"
    >
      <div class="flex items-center gap-4">
        <div class="min-w-0">
          <h2
            id="account-title"
            class="text-2xl font-bold tracking-tight"
          >
            {{ profile?.display_name ?? 'Twoje konto' }}
          </h2><p class="mt-1 text-sm break-all text-secondary">
            {{ user?.email }}
          </p>
        </div>
      </div>
      <template v-if="profile && !editing">
        <dl class="mt-7 divide-y divide-white/8 border-t border-white/8">
          <div class="py-5">
            <dt class="text-sm text-secondary">
              Cel treningowy
            </dt><dd class="mt-1 font-medium whitespace-pre-wrap">
              {{ profile.training_goal || 'Jeszcze nie ustawiony' }}
            </dd>
          </div><div class="py-5">
            <dt class="text-sm text-secondary">
              Cel tygodnia
            </dt><dd class="mt-1 font-medium">
              {{ target }} / tydzień
            </dd>
          </div><div class="py-5">
            <dt class="text-sm text-secondary">
              Strefa czasowa
            </dt><dd class="mt-1 font-medium">
              {{ profile.timezone }}
            </dd>
          </div>
        </dl>
        <UiBaseButton
          variant="secondary"
          @click="edit"
        >
          Edytuj profil
        </UiBaseButton>
      </template>
      <form
        v-if="editing"
        class="mt-6 space-y-4"
        @submit.prevent="save"
      >
        <fieldset
          class="space-y-4"
          :disabled="saving"
        >
          <label class="block text-sm text-secondary">Nazwa<input
            v-model="form.displayName"
            class="field mt-2"
            required
            maxlength="100"
            autocomplete="nickname"
          /></label><label class="block text-sm text-secondary">Cel treningowy<textarea
            v-model="form.trainingGoal"
            class="field mt-2 min-h-28 resize-y"
            maxlength="2000"
            placeholder="Co chcesz osiągnąć?"
          /></label><label class="block text-sm text-secondary">Treningi w tygodniu<select
            v-model="form.weeklyTarget"
            class="field mt-2"
          ><option
            v-for="count in 7"
            :key="count"
            :value="count"
          >{{ count }}</option></select></label><label class="block text-sm text-secondary">Strefa czasowa<select
            v-model="form.timezone"
            class="field mt-2"
          ><option
            v-for="zone in timezones"
            :key="zone"
            :value="zone"
          >{{ zone }}</option></select></label>
        </fieldset>
        <p
          v-if="saveError"
          role="alert"
          class="text-sm text-red-300"
        >
          {{ saveError }}
        </p><div class="flex flex-wrap gap-3">
          <UiBaseButton
            type="submit"
            :busy="saving"
          >
            Zapisz profil
          </UiBaseButton><UiBaseButton
            variant="secondary"
            :disabled="saving"
            @click="editing = false"
          >
            Anuluj
          </UiBaseButton>
        </div>
      </form>
    </section>
    <p
      v-if="success"
      role="status"
      class="mt-4 text-sm text-accent"
    >
      {{ success }}
    </p>
    <p class="my-7 max-w-md border-t border-white/15 pt-5 text-sm leading-relaxed text-secondary">
      Plany i historia należą do tego konta. Przekazanie komuś kopii planu nie udostępnia Twoich wyników.
    </p>
    <p
      v-if="logoutError"
      role="alert"
      class="mb-4 text-sm text-red-300"
    >
      {{ logoutError }}
    </p><UiBaseButton
      variant="secondary"
      class="w-full sm:w-auto"
      :busy="pending"
      :disabled="editing || saving"
      @click="submitLogout"
    >
      <UiAppIcon name="logout" />{{ pending ? 'Wylogowanie…' : 'Wyloguj się' }}
    </UiBaseButton>
  </div>
</template>
