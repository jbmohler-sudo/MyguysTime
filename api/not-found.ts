import type { IncomingMessage, ServerResponse } from "node:http";

const HTML = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex" />
    <title>Page not found | My Guys Time</title>
    <style>
      body { margin: 0; font-family: Georgia, "Times New Roman", serif; background: #f8fafc; color: #0f172a; }
      main { max-width: 36rem; margin: 0 auto; padding: 6rem 1.5rem; text-align: center; }
      p.kicker { color: #ea580c; font-family: system-ui, sans-serif; font-size: 0.8rem; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; }
      h1 { font-size: 2.25rem; margin: 1rem 0; }
      p { color: #475569; }
      a { color: #ea580c; font-weight: 700; }
    </style>
  </head>
  <body>
    <main>
      <p class="kicker">404</p>
      <h1>Page not found</h1>
      <p>That page is not on this site.</p>
      <p><a href="/">Back to the homepage</a></p>
    </main>
  </body>
</html>
`;

export default function handler(_req: IncomingMessage, res: ServerResponse) {
  res.statusCode = 404;
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("X-Robots-Tag", "noindex");
  res.setHeader("Cache-Control", "no-store");
  res.end(HTML);
}
