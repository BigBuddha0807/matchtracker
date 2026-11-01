// Supabase Edge Function: invite-user
// Deploy: supabase functions deploy invite-user
// Secrets: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, APP_URL
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': Deno.env.get('APP_URL') ?? '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: cors });
  try {
    const url = Deno.env.get('SUPABASE_URL')!;
    const anon = Deno.env.get('SUPABASE_ANON_KEY')!;
    const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return new Response('Unauthorized', { status: 401, headers: cors });

    const caller = createClient(url, anon, { global: { headers: { Authorization: authHeader } } });
    const { data: claimsData, error: claimsError } = await caller.auth.getClaims(authHeader.replace(/^Bearer\s+/i, ''));
    if (claimsError || !claimsData?.claims?.sub || claimsData.claims.aal !== 'aal2') {
      return new Response('MFA required', { status: 403, headers: cors });
    }
    const userId = String(claimsData.claims.sub);
    const admin = createClient(url, service);
    const { data: membership, error: memberError } = await admin
      .from('club_memberships').select('club_id,role,active')
      .eq('user_id', userId).eq('active', true)
      .in('role', ['super_admin', 'club_admin']).maybeSingle();
    if (memberError || !membership) return new Response('Forbidden', { status: 403, headers: cors });

    const body = await req.json();
    const email = String(body.email ?? '').trim().toLowerCase();
    const role = String(body.role ?? 'coach');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return new Response('Invalid email', { status: 400, headers: cors });
    if (!['coach', 'youth_lead', 'club_admin'].includes(role)) return new Response('Invalid role', { status: 400, headers: cors });
    const appUrl = Deno.env.get('APP_URL');
    if (!appUrl) return new Response('APP_URL missing', { status: 500, headers: cors });

    const { error: inviteRowError } = await admin.from('invitations').insert({
      club_id: membership.club_id, email, role, invited_by: userId,
      status: 'pending', expires_at: new Date(Date.now() + 7 * 86400000).toISOString(),
    });
    if (inviteRowError) throw inviteRowError;

    const { error: authInviteError } = await admin.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${appUrl.replace(/\/$/, '')}/`,
    });
    if (authInviteError) {
      await admin.from('invitations').update({ status: 'revoked' })
        .eq('club_id', membership.club_id).eq('email', email).eq('status', 'pending');
      throw authInviteError;
    }
    return new Response(JSON.stringify({ ok: true, message: 'Einladung wurde versendet.' }), {
      status: 200, headers: { ...cors, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown error' }), {
      status: 400, headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }
});
