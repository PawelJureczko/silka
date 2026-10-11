import { profileInputSchema, preferencesSchema } from '#shared/schemas/profile'
import type { ProfileInput } from '#shared/schemas/profile'
import { saveProfile } from '~/services/profiles'

export async function useProfileEditor() {
  const client = usePlanClient()
  const profile = await useProfile()
  const form = reactive<ProfileInput>({ displayName: '', trainingGoal: '', timezone: 'Europe/Warsaw', weeklyTarget: 3 })
  const editing = ref(false)
  const saving = ref(false)
  const error = ref('')
  const success = ref('')
  function edit() {
    const value = profile.data.value
    if (!value)
      return
    Object.assign(form, { displayName: value.display_name, trainingGoal: value.training_goal, timezone: value.timezone, weeklyTarget: preferencesSchema.parse(value.preferences).weeklyTarget })
    error.value = success.value = ''
    editing.value = true
  }
  async function save() {
    error.value = success.value = ''
    const parsed = profileInputSchema.safeParse(form)
    if (!parsed.success) {
      error.value = parsed.error.issues[0]?.message ?? 'Sprawdź formularz.'
      return
    }
    saving.value = true
    try {
      await saveProfile(client, parsed.data)
      await profile.refresh()
      editing.value = false
      success.value = 'Profil został zapisany.'
    }
    catch (cause) {
      error.value = cause instanceof Error ? cause.message : 'Nie udało się zapisać profilu.'
    }
    finally {
      saving.value = false
    }
  }
  return { profile, form, editing, saving, error, success, edit, save }
}
