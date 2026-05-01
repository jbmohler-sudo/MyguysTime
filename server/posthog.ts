import { PostHog } from "posthog-node";

const token = process.env.POSTHOG_PROJECT_TOKEN?.trim();
const host = process.env.POSTHOG_HOST?.trim();

let _client: PostHog | null = null;

if (token && host) {
  _client = new PostHog(token, { host });
}

export const posthog = _client;
export const posthogEnabled = Boolean(_client);

export async function shutdownPostHog() {
  await _client?.shutdown();
}
