// Edge Function: gerenciamento de usuários administrativos.
// A service role key fica SOMENTE aqui (variável SUPABASE_SERVICE_ROLE_KEY,
// disponível automaticamente nas Edge Functions). Nunca no frontend.
//
// Deploy: supabase functions deploy admin-users
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.46.1';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Método não permitido' }, 405);

  const url = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

  // 1) Identifica quem está chamando
  const token = (req.headers.get('Authorization') ?? '').replace('Bearer ', '');
  const { data: userData, error: userErr } = await admin.auth.getUser(token);
  if (userErr || !userData.user) return json({ error: 'Não autenticado' }, 401);
  const caller = userData.user;

  // 2) Confirma que é administrador
  const { data: callerRow } = await admin.from('admin_users').select('role').eq('user_id', caller.id).maybeSingle();
  if (!callerRow) return json({ error: 'Acesso negado' }, 403);

  let body: { action?: string; email?: string; password?: string; name?: string; user_id?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Requisição inválida' }, 400);
  }

  switch (body.action) {
    case 'list': {
      const { data, error } = await admin.from('admin_users').select('*').order('created_at');
      if (error) return json({ error: error.message }, 400);
      return json({ users: data });
    }

    case 'create': {
      const email = (body.email ?? '').trim().toLowerCase();
      const password = body.password ?? '';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: 'E-mail inválido' }, 400);
      if (password.length < 10) return json({ error: 'A senha deve ter pelo menos 10 caracteres' }, 400);

      const { data: created, error } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { name: body.name ?? '' },
      });
      if (error || !created.user) return json({ error: error?.message ?? 'Falha ao criar usuário' }, 400);

      const { error: insErr } = await admin.from('admin_users').insert({
        user_id: created.user.id,
        email,
        name: body.name ?? null,
        role: 'admin',
      });
      if (insErr) {
        await admin.auth.admin.deleteUser(created.user.id);
        return json({ error: insErr.message }, 400);
      }
      return json({ ok: true });
    }

    case 'remove': {
      if (!body.user_id) return json({ error: 'Usuário não informado' }, 400);
      if (body.user_id === caller.id) return json({ error: 'Você não pode remover a si mesmo' }, 400);
      if (callerRow.role !== 'owner') return json({ error: 'Somente o proprietário pode remover administradores' }, 403);
      const { data: target } = await admin.from('admin_users').select('role').eq('user_id', body.user_id).maybeSingle();
      if (target?.role === 'owner') return json({ error: 'Não é possível remover o proprietário' }, 400);

      await admin.from('admin_users').delete().eq('user_id', body.user_id);
      await admin.auth.admin.deleteUser(body.user_id);
      return json({ ok: true });
    }

    default:
      return json({ error: 'Ação desconhecida' }, 400);
  }
});
