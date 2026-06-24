// Returns the correctly-pluralised "Node"/"Nodes" noun (caller supplies the
// count). Mirrors the project's `pluralize` convention — count === 1 is the only
// singular case, so "0 Nodes" reads correctly.
export function pluralizeNodes(count: number): string {
  return count === 1 ? "Node" : "Nodes";
}
