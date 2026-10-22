// Liveness: is the process up? Never touches the database, so a short DB blip
// doesn't mark the only instance unhealthy (docs/10-docker.md). Used by Docker + the ALB.
export function GET() {
  return Response.json({ status: "ok" });
}
