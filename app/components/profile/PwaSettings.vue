<script setup lang="ts">
defineProps<{ editing: boolean }>()
const pwa = usePwaState()
const { $pwa } = useNuxtApp()
</script>

<template>
  <section
    class="my-9 max-w-2xl border-t border-white/15 pt-7"
    aria-labelledby="pwa-title"
  >
    <h2
      id="pwa-title"
      class="text-2xl font-bold tracking-tight"
    >
      Siłka na telefonie.
    </h2>
    <p
      v-if="pwa.installed"
      class="mt-3 text-sm text-accent"
    >
      Korzystasz z zainstalowanej aplikacji.
    </p>
    <template v-else>
      <p class="mt-3 text-sm leading-relaxed text-secondary">
        Na iPhonie otwórz Siłkę w Safari. W menu Udostępnij wybierz „Do ekranu początkowego”. Jeśli zobaczysz „Otwieraj jako aplikację”, pozostaw tę opcję włączoną.
      </p>
      <UiBaseButton
        v-if="pwa.installable"
        class="mt-4"
        :busy="pwa.busy"
        @click="$pwa.install()"
      >
        Zainstaluj Siłkę
      </UiBaseButton>
    </template>
    <div class="mt-6 border-t border-white/8 pt-5 text-sm leading-relaxed">
      <p
        v-if="pwa.readiness === 'checking'"
        role="status"
      >
        Przygotowywanie aplikacji do otwierania bez sieci…
      </p>
      <p v-else-if="pwa.readiness === 'ready'">
        Pliki aplikacji są zapisane na urządzeniu. Otwarty wcześniej trening możesz kontynuować bez sieci. Plany i historia wymagają połączenia.
      </p>
      <p
        v-else-if="pwa.readiness === 'development'"
        class="text-secondary"
      >
        Instalację i otwieranie bez sieci sprawdzisz w wersji produkcyjnej aplikacji.
      </p>
      <p
        v-else-if="pwa.readiness === 'unsupported'"
        class="text-secondary"
      >
        Ta przeglądarka nie obsługuje otwierania aplikacji bez sieci. Użyj aktualnego Safari pod adresem HTTPS.
      </p>
      <p
        v-else
        role="alert"
      >
        Nie udało się przygotować otwierania bez sieci. Połącz się z internetem i ponów próbę.
      </p>
      <p
        v-if="pwa.updateAvailable"
        class="mt-3 font-semibold text-accent"
      >
        Nowa wersja czeka na uruchomienie.
      </p>
      <div
        v-if="pwa.readiness === 'ready' || pwa.readiness === 'error'"
        class="mt-4 flex flex-wrap gap-3"
      >
        <UiBaseButton
          v-if="pwa.updateAvailable"
          :busy="pwa.busy"
          :disabled="editing"
          @click="$pwa.update()"
        >
          Uruchom nową wersję
        </UiBaseButton>
        <UiBaseButton
          variant="secondary"
          :busy="pwa.busy"
          :disabled="editing"
          @click="$pwa.check()"
        >
          {{ pwa.readiness === 'error' ? 'Ponów przygotowanie' : 'Sprawdź aktualizacje' }}
        </UiBaseButton>
      </div>
      <p
        v-if="pwa.updateAvailable"
        class="mt-3 text-secondary"
      >
        Aktualizacja otworzy aplikację ponownie. Wymaga zakończenia treningu i wysłania zmian ze wszystkich kont na tym urządzeniu.
      </p>
      <p
        v-if="editing"
        class="mt-3 text-secondary"
      >
        Najpierw zapisz lub anuluj edycję profilu.
      </p>
      <p
        v-if="pwa.message"
        role="status"
        class="mt-3"
      >
        {{ pwa.message }}
      </p>
    </div>
  </section>
</template>
