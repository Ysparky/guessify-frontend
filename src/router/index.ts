import type { RouteRecordRaw } from "vue-router";
import { createRouter, createWebHistory } from "vue-router";

const routes: RouteRecordRaw[] = [
  {
    path: "/",
    name: "home",
    component: () => import("../views/HomeView.vue"),
  },
  {
    path: "/party/:id",
    name: "party",
    component: () => import("../views/PartyView.vue"),
  },
  {
    path: "/create",
    name: "create",
    component: () => import("../views/CreatePartyView.vue"),
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
