const verification = "google-site-verification: googleb1bac79ed387cb67.html";

export function GET() {
  return new Response(verification, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
