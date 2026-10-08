/**
 * Public TypeSafe-compatible route.
 *
 * The playground uses /api/decide internally, while external clients can point
 * their base URL at /v1/systemone without changing the request contract.
 */
export {
  GET,
  POST,
} from "@/app/api/decide/route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
