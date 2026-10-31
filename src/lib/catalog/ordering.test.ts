import { describe, expect, it } from "vitest";

import { nextSortOrder, planReorder } from "./ordering";

const current = [
  { id: "a", sortOrder: 10 },
  { id: "b", sortOrder: 20 },
  { id: "c", sortOrder: 30 },
];

describe("planReorder", () => {
  it("grava só os itens que mudaram de posição", () => {
    expect(planReorder(current, ["a", "c", "b"])).toEqual({
      ok: true,
      updates: [
        { id: "c", sortOrder: 20 },
        { id: "b", sortOrder: 30 },
      ],
    });
  });

  it("normaliza ordens antigas (0, 0, 5) para 10, 20, 30", () => {
    expect(
      planReorder(
        [
          { id: "a", sortOrder: 0 },
          { id: "b", sortOrder: 0 },
          { id: "c", sortOrder: 5 },
        ],
        ["a", "b", "c"],
      ),
    ).toEqual({
      ok: true,
      updates: [
        { id: "a", sortOrder: 10 },
        { id: "b", sortOrder: 20 },
        { id: "c", sortOrder: 30 },
      ],
    });
  });

  it("mesma ordem não gera gravação", () => {
    expect(planReorder(current, ["a", "b", "c"])).toEqual({
      ok: true,
      updates: [],
    });
  });

  it("recusa lista incompleta, com item estranho ou repetido", () => {
    expect(planReorder(current, ["a", "b"])).toEqual({
      ok: false,
      reason: "mismatch",
    });
    expect(planReorder(current, ["a", "b", "x"])).toEqual({
      ok: false,
      reason: "mismatch",
    });
    expect(planReorder(current, ["a", "a", "b"])).toEqual({
      ok: false,
      reason: "duplicate",
    });
  });
});

describe("nextSortOrder", () => {
  it("coloca o item novo no fim", () => {
    expect(nextSortOrder(current)).toBe(40);
    expect(nextSortOrder([])).toBe(10);
  });
});
