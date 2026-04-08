import { Hono } from "hono";
import {
  successResponse,
  errorResponse,
} from "@sudobility/superguide_types";
import type {
  RestaurantSearchRequest,
  RestaurantSearchResponse,
} from "@sudobility/superguide_types";

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

  const response = await fetch(SHAPESHYFT_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ dish: body.dish, location: body.location }),
  });

  if (!response.ok) {
    return c.json(
      errorResponse(`ShapeShyft API error: ${response.statusText}`),
      502
    );
  }

  const data = (await response.json()) as RestaurantSearchResponse;
  return c.json(successResponse(data));
});

export default restaurantsRouter;
