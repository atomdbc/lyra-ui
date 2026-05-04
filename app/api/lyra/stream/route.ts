export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const AGENT_URL = process.env.LYRA_AGENT_URL ?? "http://localhost:4060";

export async function GET() {
  try {
    const upstream = await fetch(`${AGENT_URL}/stream`, {
      headers: { Accept: "text/event-stream" },
      cache: "no-store",
    });

    if (!upstream.body) {
      return offlineResponse();
    }

    return new Response(upstream.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        "X-Accel-Buffering": "no",
      },
    });
  } catch {
    return offlineResponse();
  }
}

function offlineResponse() {
  const body = 'data: {"type":"error","content":"Agent offline — start lyra-agent on port 4060"}\n\n';
  return new Response(body, {
    status: 200,
    headers: { "Content-Type": "text/event-stream" },
  });
}
