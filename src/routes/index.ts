import { Hono } from "hono";
import { firebaseAuthMiddleware } from "../middleware/firebaseAuth";
import usersRouter from "./users";
import historiesRouter from "./histories";
import historiesTotalRouter from "./historiesTotal";
import restaurantsRouter from "./restaurants";
import tripsRouter from "./trips";
import savedTripsRouter from "./savedTrips";

/**
 * Aggregated API routes for the `/api/v1` prefix.
 *
 * Route structure:
 * - **Public** (no auth): `/histories/total` - Global history total
 * - **Authenticated**: `/users/:userId` - User profile
 * - **Authenticated**: `/users/:userId/histories` - User history CRUD with pagination
 *
 * The Firebase auth middleware is applied to all authenticated routes,
 * setting context variables (`firebaseUser`, `userId`, `userEmail`, `siteAdmin`)
 * for downstream handlers.
 */
const routes = new Hono();

// Public routes (no auth required)
routes.route("/histories", historiesTotalRouter);
routes.route("/restaurants", restaurantsRouter);
routes.route("/trips", tripsRouter);

// Auth-required routes
const authRoutes = new Hono();
authRoutes.use("*", firebaseAuthMiddleware);
// More-specific sub-routes MUST be declared before the generic users router,
// because Hono matches in declaration order and the users router's `/:userId`
// handler would otherwise swallow paths like `/users/:userId/trips`.
authRoutes.route("/users/:userId/histories", historiesRouter);
authRoutes.route("/users/:userId/trips", savedTripsRouter);
authRoutes.route("/users/:userId", usersRouter);
routes.route("/", authRoutes);

export default routes;
