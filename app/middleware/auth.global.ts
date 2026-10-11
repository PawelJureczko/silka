export default defineNuxtRouteMiddleware((to) => {
  const { user } = useAuthState()
  if (!user.value && to.path !== '/login') return navigateTo('/login', { replace: true })
  if (user.value && to.path === '/login') return navigateTo('/', { replace: true })
})
