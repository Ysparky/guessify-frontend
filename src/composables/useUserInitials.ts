import { computed } from "vue";

export function useUserInitials(displayName: string | undefined | null) {
  return computed(() => {
    const name = displayName || "";
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  });
}
