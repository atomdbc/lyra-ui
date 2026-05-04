export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const AGENT_URL = process.env.LYRA_AGENT_URL ?? "http://localhost:4060";

export async function GET() {
  try {
    const upstream = await fetch(`${AGENT_URL}/stream`, {
      headers: { Accept: "text/event-stream" },
      cache: "no-store",
    });

    if (upstream.body) {
      return new Response(upstream.body, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache, no-transform",
          "X-Accel-Buffering": "no",
        },
      });
    }
  } catch { /* agent offline — fall through to keepalive stream */ }

  // Agent unreachable: hold the connection open with periodic comments so
  // EventSource never fires onerror / never reconnects and spams the feed.
  // Send one offline event then keep the stream alive with SSE comments.
  const encoder = new TextEncoder();
  let heartbeat: ReturnType<typeof setInterval>;

  const body = new ReadableStream({
    start(ctrl) {
      ctrl.enqueue(encoder.encode('data: {"type":"error","content":"Agent offline"}\n\n'));
      heartbeat = setInterval(() => {
        try {
          ctrl.enqueue(encoder.encode(": ping\n\n"));
        } catch {
          clearInterval(heartbeat);
        }
      }, 25_000);
    },
    cancel() {
      clearInterval(heartbeat);
    },
  });

  return new Response(body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "X-Accel-Buffering": "no",
    },
  });
}
