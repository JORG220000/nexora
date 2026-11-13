import { describe, it, expect } from "vitest";
import { properties } from "./data";
import {
  emptyFilters,
  filterProperties,
  sortProperties,
  monthlyPayment,
  compareAllowed,
  parseFilters,
  filterParams,
} from "./model";
describe("demonstration data", () => {
  it("has 12 coherent four-view listings and 9/3 transactions", () => {
    expect(properties).toHaveLength(12);
    expect(properties.filter((p) => p.deal === "buy")).toHaveLength(9);
    expect(properties.filter((p) => p.deal === "rent")).toHaveLength(3);
    expect(new Set(properties.map((p) => p.slug)).size).toBe(12);
    expect(new Set(properties.map((p) => p.city)).size).toBe(5);
    expect(new Set(properties.map((p) => p.type)).size).toBe(4);
    properties.forEach((p) => {
      expect(p.photos).toHaveLength(4);
      expect(p.description.en.length).toBeGreaterThan(70);
      expect(p.description.ru.length).toBeGreaterThan(70);
    });
  });
});
describe("catalogue", () => {
  it("applies combined search, city, transaction and amenity filters", () => {
    const list = filterProperties(properties, {
      ...emptyFilters,
      city: "Dubai",
      q: "obsidian",
      amenities: ["pool"],
      minArea: "1000",
    });
    expect(list.map((p) => p.id)).toEqual(["demo-01"]);
  });
  it("uses chosen currency for price bounds", () => {
    expect(
      filterProperties(
        properties,
        { ...emptyFilters, minPrice: "18000000", maxPrice: "19000000" },
        "USD",
      ).map((p) => p.id),
    ).toEqual(["demo-01"]);
    expect(
      filterProperties(
        properties,
        { ...emptyFilters, minPrice: "18000000", maxPrice: "19000000" },
        "EUR",
      ).length,
    ).toBe(0);
  });
  it("supports all six sorting orders without mutating input", () => {
    for (const [key, field, direction] of [
      ["price-asc", "price", 1],
      ["price-desc", "price", -1],
      ["area-asc", "area", 1],
      ["area-desc", "area", -1],
      ["popular", "popularity", -1],
    ] as const) {
      const sorted = sortProperties(properties, key);
      expect(
        sorted.every(
          (p, i) =>
            i === 0 || direction * (p[field] - sorted[i - 1][field]) >= 0,
        ),
      ).toBe(true);
    }
    expect(sortProperties(properties, "newest")[0].added).toBe(
      [...properties]
        .map((p) => p.added)
        .sort()
        .reverse()[0],
    );
    expect(properties[0].id).toBe("demo-01");
  });
  it("round trips shareable filters including New York and amenities", () => {
    const f = {
      ...emptyFilters,
      city: "New York",
      amenities: ["gym", "concierge"],
      maxPrice: "25000000",
    };
    expect(parseFilters(filterParams(f))).toEqual(f);
  });
});
describe("comparison", () => {
  it("limits selection to two matching transactions", () => {
    expect(compareAllowed([properties[0]], properties[3])).toBe("deal");
    expect(compareAllowed([properties[0], properties[1]], properties[2])).toBe(
      "full",
    );
    expect(compareAllowed([properties[0]], properties[0])).toBe("remove");
    expect(compareAllowed([properties[0]], properties[1])).toBe("add");
  });
});
describe("annuity calculator", () => {
  it("calculates standard and zero-interest monthly payments", () => {
    expect(monthlyPayment(100000, 20000, 30, 6)).toBeCloseTo(479.64, 2);
    expect(monthlyPayment(120000, 0, 10, 0)).toBe(1000);
    expect(monthlyPayment(120000, 120000, 10, 5)).toBe(0);
  });
  it("rejects invalid values and overpayment", () => {
    expect(monthlyPayment(100, 101, 20, 5)).toBe(null);
    expect(monthlyPayment(100, 0, 0, 5)).toBe(null);
    expect(monthlyPayment(100, 0, 20, -1)).toBe(null);
    expect(monthlyPayment(100, NaN, 20, 5)).toBe(null);
  });
});
