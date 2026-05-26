# Deploy automático ao publicar ou editar posts

Quando um post é **publicado** ou **editado** (já publicado), o Supabase dispara um rebuild completo (`vite build` + pré-render SEO) e envia o `dist/` para o cPanel via FTP.

Repositório: [dsbuhrer/lily-letters](https://github.com/dsbuhrer/lily-letters)

## Fluxo

1. CMS salva post com `status = published` (novo ou edição).
2. **Database Webhook** em `posts` chama a Edge Function `trigger-rebuild`.
3. A função dispara **GitHub Actions** (`repository_dispatch` → evento `rebuild-seo`).
4. O workflow faz `npm run build` e publica `dist/` no FTP (`public_html`).

Rascunhos (`status = draft`) **não** disparam deploy. Excluir um post publicado **dispara** rebuild (atualiza sitemap/RSS).

## 1. GitHub — Personal Access Token

Crie um token (fine-grained ou classic) com permissão **`repo`** no repositório `dsbuhrer/lily-letters`.

Guarde como secret no **Supabase** (passo 3), não no repositório público.

## 2. GitHub Actions — Secrets

Em **Settings → Secrets and variables → Actions** do repositório `lily-letters`:

| Secret | Descrição |
|--------|-----------|
| `VITE_SUPABASE_URL` | URL do projeto Supabase |
| `VITE_SUPABASE_ANON_KEY` | Chave anon (build do frontend) |
| `SUPABASE_URL` | Mesma URL (pré-render) |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role (só CI — nunca no site) |
| `SITE_URL` | Ex.: `https://thelilyletters.co` |
| `FTP_SERVER` | Host FTP do cPanel (ex.: `ftp.thelilyletters.co`) |
| `FTP_USERNAME` | Usuário FTP |
| `FTP_PASSWORD` | Senha FTP |
| `FTP_SERVER_DIR` | Opcional — pasta remota (padrão `./public_html/`) |
| `FTP_PORT` | Opcional — padrão `21` |

Teste manual: **Actions → Build and deploy to cPanel (FTP) → Run workflow**.

## 3. Supabase — Secrets da Edge Function

```bash
supabase secrets set \
  GH_DISPATCH_TOKEN=ghp_xxxxxxxx \
  WEBHOOK_SECRET=um-segredo-longo-aleatorio \
  GITHUB_OWNER=dsbuhrer \
  GITHUB_REPO=lily-letters
```

| Secret | Uso |
|--------|-----|
| `GH_DISPATCH_TOKEN` | PAT do GitHub com `repo` |
| `WEBHOOK_SECRET` | Mesmo valor no header do Database Webhook |
| `GITHUB_OWNER` | Opcional (padrão `dsbuhrer`) |
| `GITHUB_REPO` | Opcional (padrão `lily-letters`) |

Deploy da função:

```bash
supabase functions deploy trigger-rebuild
```

## 4. Supabase — Database Webhook

**Database → Webhooks → Create a new hook**

| Campo | Valor |
|-------|--------|
| Name | `posts-rebuild-seo` |
| Table | `posts` |
| Events | Insert, Update, Delete |
| Type | HTTP Request |
| URL | `https://<PROJECT_REF>.supabase.co/functions/v1/trigger-rebuild` |
| HTTP Headers | `Content-Type: application/json` |
| | `x-webhook-secret: <mesmo WEBHOOK_SECRET>` |

Não é necessário filtro SQL no painel: a função ignora rascunhos e só dispara rebuild para posts publicados (ou exclusão de publicado).

## 5. Verificação

1. Publique ou edite um post no `/admin`.
2. Supabase → Edge Functions → `trigger-rebuild` → Logs (deve aparecer `dispatched: true`).
3. GitHub → Actions → workflow em execução (~1–3 min).
4. Site: view-source em `/blog/<slug>` e `sitemap.xml` com o post novo.

## Solução de problemas

| Sintoma | Causa provável |
|---------|----------------|
| `GH_DISPATCH_TOKEN is not configured` | Secret não definido no Supabase |
| `GitHub dispatch failed (404)` | Owner/repo errados ou token sem acesso ao repo |
| `Unauthorized` na Edge Function | Header `x-webhook-secret` diferente de `WEBHOOK_SECRET` |
| FTP falha | `FTP_SERVER_DIR`, credenciais ou firewall do host |
| Build falha | Secrets `VITE_*` / `SUPABASE_SERVICE_ROLE_KEY` ausentes no GitHub |

## Deploy manual (fallback)

```bash
npm run build
# enviar dist/ via FTP no cPanel
```
