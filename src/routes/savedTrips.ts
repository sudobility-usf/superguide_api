import { Hono } from "hono";
import { eq, and, desc } from "drizzle-orm";
import { db, trips } from "../db";
import {
  successResponse,
  errorResponse,
  type Trip,
  type TripCreateRequest,
} from "@sudobility/superguide_types";

const savedTripsRouter = new Hono();

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

/**
 * Serialize a trip row from the DB into the wire format.
 *
 * Dates come back from Drizzle as either `Date` or `string` depending on
 * the column type; normalize to ISO 8601 / YYYY-MM-DD strings so the
 * client always sees a consistent shape.
 */
function serializeTrip(row: typeof trips.$inferSelect): Trip {
  const toDateString = (v: unknown): string => {
    if (typeof v === "string") return v;
    if (v instanceof Date) return v.toISOString().slice(0, 10);
    return String(v);
  };
  const toIsoString = (v: unknown): string => {
    if (typeof v === "string") return v;
    if (v instanceof Date) return v.toISOString();
    return new Date().toISOString();
  };
  return {
    id: row.id,
    user_id: row.user_id,
    location: row.location,
    start_date: toDateString(row.start_date),
    end_date: toDateString(row.end_date),
    itin: row.itin as Trip["itin"],
    created_at: toIsoString(row.created_at),
  };
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * GET / - List the authenticated user's saved trips, newest first.
 */
savedTripsRouter.get("/", async c => {
  const userId = c.req.param("userId")!;
  const tokenUserId = c.get("userId");

  if (userId !== tokenUserId && !c.get("siteAdmin")) {
    return c.json(errorResponse("Not authorized"), 403);
  }

  const limitParam = c.req.query("limit");
  const offsetParam = c.req.query("offset");
  const limit = Math.min(
    Math.max(1, parseInt(limitParam || String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT),
    MAX_LIMIT
  );
  const offset = Math.max(0, parseInt(offsetParam || "0", 10) || 0);

  const rows = await db
    .select()
    .from(trips)
    .where(eq(trips.user_id, userId))
    .orderBy(desc(trips.created_at))
    .limit(limit)
    .offset(offset);

  return c.json(successResponse(rows.map(serializeTrip)));
});

/**
 * POST / - Save a newly generated trip for the authenticated user.
 */
savedTripsRouter.post("/", async c => {
  const userId = c.req.param("userId")!;
  const tokenUserId = c.get("userId");

  if (userId !== tokenUserId && !c.get("siteAdmin")) {
    return c.json(errorResponse("Not authorized"), 403);
  }

  const body = (await c.req.json()) as Partial<TripCreateRequest>;
  const { location, start_date, end_date, itin } = body;

  if (!location || !start_date || !end_date || !itin) {
    return c.json(
      errorResponse("location, start_date, end_date, and itin are required"),
      400
    );
  }
  if (typeof location !== "string" || location.length > 255) {
    return c.json(errorResponse("location must be a string ≤ 255 chars"), 400);
  }
  if (!DATE_RE.test(start_date) || !DATE_RE.test(end_date)) {
    return c.json(
      errorResponse("start_date and end_date must be YYYY-MM-DD"),
      400
    );
  }
  if (!Array.isArray(itin)) {
    return c.json(errorResponse("itin must be an array"), 400);
  }

  const result = await db
    .insert(trips)
    .values({
      user_id: userId,
      location,
      start_date,
      end_date,
      itin,
    })
    .returning();

  return c.json(successResponse(serializeTrip(result[0])), 201);
});

/**
 * GET /:tripId - Fetch a single saved trip by id.
 */
savedTripsRouter.get("/:tripId", async c => {
  const userId = c.req.param("userId")!;
  const tripId = c.req.param("tripId")!;
  const tokenUserId = c.get("userId");

  if (userId !== tokenUserId && !c.get("siteAdmin")) {
    return c.json(errorResponse("Not authorized"), 403);
  }

  const rows = await db
    .select()
    .from(trips)
    .where(and(eq(trips.id, tripId), eq(trips.user_id, userId)))
    .limit(1);

  if (rows.length === 0) {
    return c.json(errorResponse("Trip not found"), 404);
  }

  return c.json(successResponse(serializeTrip(rows[0])));
});

/**
 * DELETE /:tripId - Remove a saved trip.
 */
savedTripsRouter.delete("/:tripId", async c => {
  const userId = c.req.param("userId")!;
  const tripId = c.req.param("tripId")!;
  const tokenUserId = c.get("userId");

  if (userId !== tokenUserId && !c.get("siteAdmin")) {
    return c.json(errorResponse("Not authorized"), 403);
  }

  const result = await db
    .delete(trips)
    .where(and(eq(trips.id, tripId), eq(trips.user_id, userId)))
    .returning();

  if (result.length === 0) {
    return c.json(errorResponse("Trip not found"), 404);
  }

  return c.json(successResponse(null));
});

export default savedTripsRouter;
