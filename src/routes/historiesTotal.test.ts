import { describe, it, expect } from "vitest";
import { Hono } from "hono";
import { successResponse } from "@sudobility/superguide_types";

describe("historiesTotal route", () => {
  it("should return total in correct response format", () => {
    // Test the response format used by the route
    const response = successResponse({ total: 42 });
    expect(response.success).toBe(true);
    expect(response.data.total).toBe(42);
    expect(response.timestamp).toBeDefined();
  });

  it("should handle zero total", () => {
    const response = successResponse({ total: 0 });
    expect(response.success).toBe(true);
    expect(response.data.total).toBe(0);
  });
});
