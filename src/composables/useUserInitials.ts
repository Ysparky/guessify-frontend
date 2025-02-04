import { computed, type ComputedRef } from "vue";
import { useAuthStore } from "../stores/auth";

export function useUserInitials(): ComputedRef<string> {
  const authStore = useAuthStore();

  return computed(() => {
    const displayName = authStore.player?.displayName;
    if (!displayName) return "";

    const name = displayName.trim();
    if (!name) return "";

    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  });
}
