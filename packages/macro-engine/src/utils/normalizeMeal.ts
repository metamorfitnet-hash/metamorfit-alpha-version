export function normalizeMeal(text: string) {
  return (text || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[^\w\s]/g, "")
    ?.trim();
}
