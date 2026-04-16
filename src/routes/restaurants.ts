import { Hono } from "hono";
import {
  successResponse,
  errorResponse,
} from "@sudobility/superguide_types";
import type {
  RestaurantSearchRequest,
  RestaurantSearchResponse,
} from "@sudobility/superguide_types";
import { getEnv } from "../lib/env-helper";

const SHAPESHYFT_URL =
  "https://api.shapeshyft.ai/api/v1/ai/w7883i4e/superguide/openai";

const restaurantsRouter = new Hono();

/**
 * POST /search - Search for restaurants by dish and location.
 *
 * Proxies the request to the ShapeShyft AI API and returns
 * the list of matching restaurants.
 */
restaurantsRouter.post("/search", async (c) => {
  const body = await c.req.json<RestaurantSearchRequest>();

  if (!body.dish || !body.location) {
    return c.json(errorResponse("Both 'dish' and 'location' are required"), 400);
  }

  const apiKey = getEnv("SHAPESHYFT_API_KEY");
  if (!apiKey) {
    return c.json(errorResponse("SHAPESHYFT_API_KEY is not configured"), 500);
  }

  const response = await fetch(SHAPESHYFT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ dish: body.dish, location: body.location }),
  });

  if (!response.ok) {
    return c.json(
      errorResponse(`ShapeShyft API error: ${response.statusText}`),
      502
    );
  }

  // ShapeShyft returns a generic itinerary-shaped payload keyed under
  // data.output.itin[].schedule[]. Extract restaurant entries and dedupe
  // by name so the client gets the flat list it expects.
  const raw = (await response.json()) as {
    data?: {
      output?: {
        itin?: Array<{
          schedule?: Array<{
            type?: string;
            name?: string;
            location?: string;
          }>;
        }>;
      };
    };
  };

  const seen = new Set<string>();
  const restaurants: RestaurantSearchResponse["restaurants"] = [];
  for (const day of raw.data?.output?.itin ?? []) {
    for (const item of day.schedule ?? []) {
      if (item.type !== "restaurant" || !item.name) continue;
      if (seen.has(item.name)) continue;
      seen.add(item.name);
      restaurants.push({
        restaurantname: item.name,
        address: item.location ?? "",
      });
    }
  }

  return c.json(successResponse({ restaurants }));
});

export default restaurantsRouter;
