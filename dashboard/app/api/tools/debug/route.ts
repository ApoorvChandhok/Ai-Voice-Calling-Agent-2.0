import { NextResponse } from "next/server";

// ---------------------------------------------------------------------------
// DEBUG endpoint — /api/tools/debug
// ---------------------------------------------------------------------------
// Checks every step of the booking chain so you can see exactly where it fails.
// Visit: http://localhost:3000/api/tools/debug
// ---------------------------------------------------------------------------

export async function GET() {
  const report: Record<string, unknown> = {};

  // ── 1. Env vars ─────────────────────────────────────────────────────────
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const clientId    = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  report.env = {
    SUPABASE_URL_set: !!supabaseUrl,
    SERVICE_ROLE_KEY_set: !!serviceKey,
    SERVICE_ROLE_KEY_looks_valid: serviceKey?.startsWith("eyJ") ?? false,
    GOOGLE_CLIENT_ID_set: !!clientId,
    GOOGLE_CLIENT_ID_prefix: clientId?.substring(0, 20) ?? "MISSING",
    GOOGLE_CLIENT_SECRET_set: !!clientSecret,
    GOOGLE_CLIENT_SECRET_prefix: clientSecret?.substring(0, 10) ?? "MISSING",
  };

  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ ...report, error: "Missing required env vars" });
  }

  // ── 2. Supabase connectivity ─────────────────────────────────────────────
  try {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/integrations?select=workspace_id,service,updated_at&limit=10`,
      {
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
        },
      }
    );
    const body = res.ok ? await res.json() : await res.text();
    report.supabase = {
      status: res.status,
      ok: res.ok,
      rows: body,
    };
  } catch (e) {
    report.supabase = { error: String(e) };
  }

  // ── 3. Google token lookup ───────────────────────────────────────────────
  try {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/integrations?service=eq.google_calendar&select=workspace_id,tokens&limit=5`,
      {
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
        },
      }
    );
    const rows: { workspace_id: string; tokens: Record<string, string> }[] = res.ok
      ? await res.json()
      : [];

    report.google_calendar_tokens = rows.map((r) => ({
      workspace_id: r.workspace_id,
      has_access_token: !!r.tokens?.access_token,
      has_refresh_token: !!r.tokens?.refresh_token,
      email: r.tokens?.email ?? "unknown",
      connected_at: r.tokens?.connected_at ?? "unknown",
      access_token_prefix: r.tokens?.access_token?.substring(0, 20) ?? "MISSING",
    }));
  } catch (e) {
    report.google_calendar_tokens = { error: String(e) };
  }

  // ── 4. Test Google token refresh (if tokens found) ───────────────────────
  const gcalRows = report.google_calendar_tokens as Array<{
    workspace_id: string; has_refresh_token: boolean;
  }>;

  if (Array.isArray(gcalRows) && gcalRows[0]?.has_refresh_token) {
    try {
      const tokenRes = await fetch(
        `${supabaseUrl}/rest/v1/integrations?service=eq.google_calendar&select=tokens&limit=1`,
        {
          headers: {
            apikey: serviceKey,
            Authorization: `Bearer ${serviceKey}`,
          },
        }
      );
      const [row] = await tokenRes.json();
      const refreshToken = row?.tokens?.refresh_token;

      if (refreshToken && clientId && clientSecret) {
        const refreshRes = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            refresh_token: refreshToken,
            grant_type: "refresh_token",
          }),
        });
        const refreshData = refreshRes.ok ? await refreshRes.json() : await refreshRes.text();
        report.token_refresh = {
          status: refreshRes.status,
          ok: refreshRes.ok,
          new_access_token_obtained: refreshRes.ok && !!refreshData.access_token,
          error: refreshRes.ok ? undefined : refreshData,
        };

        // ── 5. Test Calendar API with fresh token ────────────────────────
        if (refreshRes.ok && refreshData.access_token) {
          const now = new Date();
          const end = new Date(now.getTime() + 60 * 60 * 1000);
          const busyRes = await fetch("https://www.googleapis.com/calendar/v3/freeBusy", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${refreshData.access_token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              timeMin: now.toISOString(),
              timeMax: end.toISOString(),
              timeZone: "Asia/Kolkata",
              items: [{ id: "primary" }],
            }),
          });
          report.calendar_api_test = {
            status: busyRes.status,
            ok: busyRes.ok,
            body: busyRes.ok ? await busyRes.json() : await busyRes.text(),
          };
        }
      }
    } catch (e) {
      report.token_refresh = { error: String(e) };
    }
  }

  return NextResponse.json(report, { status: 200 });
}
