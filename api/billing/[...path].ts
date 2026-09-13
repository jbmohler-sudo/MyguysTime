import { app } from "../../server/index.js";

export default app;

// Vercel must not pre-parse request bodies: the Stripe webhook route
// verifies its signature against the raw body via express.raw().
export const config = {
  api: {
    bodyParser: false,
  },
};
