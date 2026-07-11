import { describe, expect, it } from "vitest";
import { productivityNavigation, productivitySectionMeta } from "./productivityNavigation";

describe("productivity navigation", () => {
  it("keeps all workspace sections available and routes Notes to the legacy workspace", () => {
    expect(productivityNavigation.map((item) => item.label)).toEqual([
      "Overview",
      "Tasks",
      "Calendar",
      "Notes",
      "Reminders",
      "Goals",
      "Templates",
      "Archive",
      "Settings",
    ]);
    expect(productivityNavigation.find((item) => item.section === "notes")?.href).toBe("/notes");
  });

  it("provides a bounded title and empty-state contract for each new route", () => {
    expect(Object.keys(productivitySectionMeta)).toEqual([
      "overview",
      "tasks",
      "calendar",
      "reminders",
      "goals",
      "templates",
      "archive",
      "settings",
    ]);
  });
});
