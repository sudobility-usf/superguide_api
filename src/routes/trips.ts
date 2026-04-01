import { Hono } from "hono";
import {
  successResponse,
  errorResponse,
} from "@sudobility/superguide_types";
import type {
  TripGenerateRequest,
  TripGenerateResponse,
} from "@sudobility/superguide_types";
import { getEnv } from "../lib/env-helper";

const SHAPESHYFT_URL =
  "https://api.shapeshyft.ai/api/v1/ai/w7883i4e/superguide/openai";

const tripsRouter = new Hono();

/**
 * POST /generate - Generate a trip itinerary for a destination and date range.
 *
 * Proxies the request to the ShapeShyft AI API and returns
 * the generated itinerary.
 */
tripsRouter.post("/generate", async (c) => {
  const body = await c.req.json<TripGenerateRequest>();

  if (!body.location || !body.start_date || !body.end_date) {
    return c.json(
      errorResponse("'location', 'start_date', and 'end_date' are required"),
      400
    );
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
    body: JSON.stringify({
      location: body.location,
      start_date: body.start_date,
      end_date: body.end_date,
    }),
  });

  if (!response.ok) {
    return c.json(
      errorResponse(`ShapeShyft API error: ${response.statusText}`),
      502
    );
  }

  const data = (await response.json()) as { data: { output: TripGenerateResponse } };
  return c.json(successResponse(data.data.output));
});

export default tripsRouter;
