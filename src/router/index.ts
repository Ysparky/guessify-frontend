import type { RouteRecordRaw } from "vue-router";
import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "../stores/auth";
import HomeView from "../views/HomeView.vue";

const routes: RouteRecordRaw[] = [
  {
    path: "/",
    name: "home",
    component: HomeView,
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
    path: "/profile",
    name: "profile",
    component: () => import("../views/ProfileView.vue"),
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
    name: "callback",
    component: () => import("../views/CallbackView.vue"),
    meta: { requiresAuth: false },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Auth guard
router.beforeEach(async (to) => {
  const authStore = useAuthStore();

  // Initialize auth state if not already done
  if (!authStore.isInitialized) {
    await authStore.initialize();
  }

  // Skip auth check for login and callback routes
  if (to.path === "/login" || to.path === "/auth/callback") {
    // If user is already authenticated and tries to access login, redirect to home
    if (authStore.isAuthenticated && to.path === "/login") {
      return { path: "/" };
    }
    return true;
  }

  // Check if route requires authentication
  if (to.meta.requiresAuth) {
    // If not authenticated, store intended path and redirect to login
    if (!authStore.isAuthenticated) {
      sessionStorage.setItem("redirectPath", to.fullPath);
      return { path: "/login" };
    }
  }

  return true;
});

export default router;
