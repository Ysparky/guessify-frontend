import type { RouteRecordRaw } from "vue-router";
import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "../stores/auth";

const routes: RouteRecordRaw[] = [
  {
    path: "/",
    name: "home",
    component: () => import("../views/HomeView.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/party/:id",
    name: "party",
    component: () => import("../views/PartyView.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/create",
    name: "create",
    component: () => import("../views/CreatePartyView.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/stats",
    name: "stats",
    component: () => import("../views/StatsView.vue"),
    meta: { requiresAuth: true },
  },
  {
    path: "/login",
    name: "login",
    component: () => import("../views/LoginView.vue"),
    meta: { requiresAuth: false },
  },
  {
    path: "/auth/callback",
    name: "auth-callback",
    component: () => import("../views/LoginView.vue"),
    meta: { requiresAuth: false },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Navigation guard
router.beforeEach(async (to) => {
  const authStore = useAuthStore();

  // Check if this is the callback route
  if (to.name === "auth-callback") {
    const code = to.query.code as string;
    if (code) {
      try {
        await authStore.handleCallback(code);
        return { name: "home" };
      } catch (err) {
        return { name: "login" };
      }
    }
  }

  // Check if the route requires authentication
  if (to.meta.requiresAuth) {
    // If not authenticated, redirect to login
    if (!authStore.isAuthenticated) {
      return { name: "login" };
    }

    // If authenticated but token might be expired, validate session
    if (!authStore.hasValidToken) {
      const isValid = await authStore.validateSession();
      if (!isValid) {
        return { name: "login" };
      }
    }
  }

  // If we're going to login while already authenticated, redirect to home
  if (to.name === "login" && authStore.isAuthenticated) {
    return { name: "home" };
  }
});

export default router;
