/**
 * A basic Cloudflare Worker that provides API endpoints for "items."
 * This example uses in‑memory storage for demonstration purposes.
 * Note: In production, you might use Cloudflare KV or Durable Objects for persistence.
 */

let items = [];  // In‑memory storage for items
let games = [];  // In‑memory storage for games (if needed)

export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const path = url.pathname;

  // Define CORS headers (adjust as needed for your security requirements)
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  // Handle preflight OPTIONS requests
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  // API endpoint: GET /api/items returns the list of items
  if (path === "/api/items" && request.method === "GET") {
    return new Response(JSON.stringify(items), {
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  // API endpoint: POST /api/items to add a new item
  if (path === "/api/items" && request.method === "POST") {
    try {
      const newItem = await request.json();
      // Optionally, add validation here
      items.push(newItem);
      return new Response(
        JSON.stringify({ status: "success", item: newItem }),
        { headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    } catch (error) {
      return new Response(
        JSON.stringify({ error: "Invalid JSON" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
  }

  // Default response for other paths
  return new Response("ecomons API Worker", {
    headers: { "Content-Type": "text/plain", ...corsHeaders },
  });
}
