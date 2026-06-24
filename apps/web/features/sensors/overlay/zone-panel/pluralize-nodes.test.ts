import { describe, expect, test } from "bun:test";

import { pluralizeNodes } from "./pluralize-nodes";

describe("pluralizeNodes", () => {
  test("0 → Nodes (plural, never '0 Node')", () => {
    expect(pluralizeNodes(0)).toBe("Nodes");
  });

  test("1 → Node (the only singular case)", () => {
    expect(pluralizeNodes(1)).toBe("Node");
  });

  test("2+ → Nodes", () => {
    expect(pluralizeNodes(2)).toBe("Nodes");
    expect(pluralizeNodes(42)).toBe("Nodes");
  });
});
