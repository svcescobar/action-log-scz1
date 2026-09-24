const REPO = "svcescobar/action-log-scz1";
const API_ROOT = "https://api.github.com/repos/" + REPO + "/contents/";
const ALLOWED_ORIGIN = "https://svcescobar.github.io";

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
    "Access-Control-Allow-Methods": "GET, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Accept, Content-Type",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
}

function validPath(path) {
  return /^data(?:-[A-Z0-9]+)?\.json$/.test(path) ||
    /^img\/mant\/[0-9a-f-]+\.jpg$/i.test(path);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin") || "";
    const headers = corsHeaders();

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers });
    }
    if (origin && origin !== ALLOWED_ORIGIN) {
      return Response.json({ error: "Origin not allowed" }, { status: 403, headers });
    }
    if (!env.GITHUB_TOKEN) {
      return Response.json({ error: "Backend is not configured" }, { status: 503, headers });
    }
    if (!url.pathname.startsWith("/contents/")) {
      return Response.json({ error: "Not found" }, { status: 404, headers });
    }

    let path;
    try {
      path = decodeURIComponent(url.pathname.slice("/contents/".length));
    } catch {
      return Response.json({ error: "Invalid path" }, { status: 400, headers });
    }
    if (!validPath(path) || !["GET", "PUT", "DELETE"].includes(request.method)) {
      return Response.json({ error: "Path or method not allowed" }, { status: 404, headers });
    }

    const target = API_ROOT + path + url.search;
    const upstreamHeaders = {
      Authorization: "Bearer " + env.GITHUB_TOKEN,      
      "User-Agent": "action-log-scz1-worker",

      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    };
    if (request.method !== "GET") upstreamHeaders["Content-Type"] = "application/json";

    let body;
    if (request.method !== "GET") {
      try {
        body = await request.text();
        JSON.parse(body);
      } catch {
        return Response.json({ error: "Invalid JSON body" }, { status: 400, headers });
      }
    }

    try {
      const upstream = await fetch(target, {
        method: request.method,
        headers: upstreamHeaders,
        body,
      });
      const responseHeaders = new Headers(headers);
      responseHeaders.set("Content-Type", upstream.headers.get("Content-Type") || "application/json");
      return new Response(await upstream.arrayBuffer(), {
        status: upstream.status,
        headers: responseHeaders,
      });
    } catch {
      return Response.json({ error: "GitHub API unavailable" }, { status: 502, headers });
    }
  },
};
