# Dois Brilhos — E-commerce

Loja virtual da **Dois Brilhos Joias** (Recife — PE · Prata 925, Aço Inoxidável e Folheados Premium), com finalização de pedidos pelo WhatsApp e painel administrativo.

**Stack:** React 18 · TypeScript · Vite · Tailwind CSS 4 · Framer Motion · Lucide · TanStack Query · Zustand · Zod · Supabase (PostgreSQL, Auth, Storage, Edge Functions).

---

## 1. Rodar no computador

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # build de produção (pasta dist/)
```

### Modo demonstração

Enquanto o arquivo `.env.local` não existir, o site roda em **modo demonstração**:

- produtos, categorias e coleções de **exemplo** (marcados como “Exemplo”, com ilustrações próprias — não são fotos reais);
- tudo o que for feito no painel fica salvo **apenas no navegador** (localStorage);
- o painel (`/admin`) aceita qualquer e-mail/senha.

Assim que as variáveis do Supabase forem preenchidas, o site passa a usar o banco de dados real automaticamente — nenhuma alteração de código é necessária.

---

## 2. Estrutura

```
src/
  admin/            Painel administrativo (carregado sob demanda, separado da loja)
    pages/          Dashboard, Produtos, Categorias/Coleções, Pedidos, Conteúdo, Depoimentos, Administradores
    components/     Layout, formulários, upload de imagens
  components/       Componentes da loja (layout, home, produto, animações, UI)
  pages/            Páginas da loja (Home, Loja, Produto, Sacola, Finalizar, Sobre…)
  services/         Camada de dados: api.ts escolhe Supabase ou demonstração
  store/cart.ts     Carrinho (persistido no navegador)
  lib/              WhatsApp, validação do checkout, formatação, imagens
  data/demo-data.json  Dados de exemplo (fonte única da loja demo e do seed SQL)
supabase/
  migrations/       Tabelas, relacionamentos, RLS, funções e Storage
  seed.sql          Dados de exemplo (opcional)
  functions/admin-users/  Edge Function para cadastrar/remover administradores
scripts/            Geradores das imagens de exemplo e do seed.sql
```

### Rotas

| Loja | | Painel | |
|---|---|---|---|
| `/` | Página inicial | `/admin/login` | Login |
| `/loja` | Todas as joias (busca, filtros, ordenação) | `/admin` | Dashboard |
| `/categoria/:slug` | Categoria | `/admin/produtos` | Produtos |
| `/colecao/:slug` | Coleção | `/admin/categorias` · `/admin/colecoes` | Organização |
| `/novidades` · `/mais-vendidos` | Automáticas (marcações do produto) | `/admin/pedidos` | Pedidos |
| `/produto/:slug` | Produto | `/admin/conteudo` | Banner, textos, contatos, redes, atendentes, SEO |
| `/carrinho` · `/finalizar` | Sacola e finalização | `/admin/depoimentos` · `/admin/usuarios` | Depoimentos e administradores |

---

## 3. Como funciona a finalização pelo WhatsApp

1. O cliente monta a sacola (fica salva mesmo se atualizar a página).
2. Em **Finalizar pedido**, o site confere preço e estoque atuais no banco e avisa se algo mudou.
3. O cliente preenche nome completo, cidade, bairro, endereço (opcional) e observações — tudo validado.
4. Escolhe **Michael** ou **Nicolly**.
5. O site gera a mensagem com o resumo e um código (ex.: `DB261117-HCFT`) e abre `https://wa.me/<número>?text=…`.
6. Ao mesmo tempo, o pedido é registrado no painel com status **Pendente**. Os preços desse registro são recalculados no servidor (o cliente não consegue alterá-los).
7. Nada é cobrado pelo site. O pedido só é considerado confirmado após o atendimento.

Os números dos atendentes são editáveis em **Painel → Conteúdo do site → Atendentes (WhatsApp)**.

Números atuais: **Michael** `5581998070744` (+55 81 99807-0744) · **Nicolly** `5581996404201` (+55 81 99640-4201).

---

## 4. Configuração do Supabase (passo a passo)

### 4.1 Criar o projeto
1. Acesse <https://supabase.com> e crie uma conta (pode entrar com GitHub ou e-mail).
2. **New project** → nome `dois-brilhos`, defina uma senha forte para o banco (guarde-a em local seguro) e escolha a região **South America (São Paulo)**.
3. Aguarde a criação (1–2 minutos).

### 4.2 Criar as tabelas, segurança e Storage
1. No menu lateral, abra **SQL Editor** → **New query**.
2. Cole todo o conteúdo de `supabase/migrations/20261117000000_init.sql` e clique em **Run**.
   Isso cria: tabelas e relacionamentos, políticas **RLS**, funções seguras (`create_site_order`, `increment_product_view`, `is_admin`) e o bucket **product-images** com suas políticas.
3. *(Opcional)* Para começar com os produtos de exemplo, rode também `supabase/seed.sql` **uma única vez**. Depois é só editar/excluir pelo painel (ou rodar `delete from public.products where is_demo;`).
   Mesmo sem o seed, as configurações do site (textos, atendentes, redes) usam os valores padrão até você salvá-las no painel.

### 4.3 Autenticação
1. **Authentication → Sign In / Providers → Email**: mantenha *Email* habilitado e **desative “Allow new users to sign up”**. (Mesmo que alguém crie uma conta, ela não acessa o painel — só quem está na tabela `admin_users` —, mas é a configuração correta.)
2. **Authentication → URL Configuration**:
   - *Site URL*: o endereço público da loja (ex.: `https://www.doisbrilhos.com.br`).
   - *Redirect URLs*: adicione `https://SEU-DOMINIO/admin/login` e `http://localhost:5173/admin/login`.

### 4.4 Cadastrar o primeiro administrador (proprietário)
1. **Authentication → Users → Add user → Create new user**: informe e-mail e senha forte e marque **Auto Confirm User**.
2. No **SQL Editor**, rode (trocando o e-mail):
   ```sql
   insert into public.admin_users (user_id, email, name, role)
   select id, email, 'Michael', 'owner' from auth.users where email = 'seu-email@exemplo.com';
   ```
Os próximos administradores podem ser cadastrados pelo próprio painel (**Administradores**), depois do passo 4.5.

### 4.5 Publicar a Edge Function de administradores
Necessária para cadastrar/remover administradores pelo painel (usa a chave secreta somente no servidor).
```bash
npx supabase login
npx supabase link --project-ref SEU_PROJECT_REF     # o "Reference ID" em Project Settings → General
npx supabase functions deploy admin-users
```

### 4.6 Variáveis de ambiente
Crie o arquivo `.env.local` na raiz (use `.env.example` como modelo):
```
VITE_SUPABASE_URL=https://xxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_SITE_URL=https://www.doisbrilhos.com.br
```
Os dois primeiros ficam em **Project Settings → API**. A *anon key* é pública por natureza; a proteção dos dados é feita pelas políticas RLS.
**Nunca** use a `service_role key` no frontend nem a envie por chat.

### 4.7 Publicar o site
Recomendado: **Vercel** (o `vercel.json` já está configurado). Netlify também funciona (`public/_redirects`).
1. Suba o projeto para um repositório no GitHub.
2. Na Vercel: **Add New → Project** → importe o repositório (framework: Vite).
3. Em **Environment Variables**, cadastre as três variáveis do passo 4.6.
4. **Deploy**. Depois, conecte o domínio em **Settings → Domains** e atualize a *Site URL* do Supabase.

### 4.8 Checklist de validação (após conectar)
- [ ] `/admin` sem login redireciona para a tela de login; conta que não é administradora não entra.
- [ ] Cadastrar produto com fotos → aparece na loja; foto principal correta.
- [ ] Marcar Lançamento / Mais vendido / Destaque → aparece nas seções da Home.
- [ ] Finalizar um pedido de teste com cada atendente → WhatsApp abre com a mensagem; pedido aparece como **Pendente** no painel.
- [ ] Alterar status do pedido → dashboard atualiza.
- [ ] Editar banner/textos em **Conteúdo do site** → loja reflete após recarregar.
- [ ] Cadastrar e remover um administrador secundário.
- [ ] Trocar a imagem de compartilhamento (SEO) por um JPG/PNG 1200×630 e testar o link no WhatsApp.

---

## 5. O que ainda depende de vocês

| Item | Onde |
|---|---|
| Fotos reais, nomes, preços e descrições das peças | Painel → Produtos (excluir os de exemplo) |
| Foto do banner principal e da seção institucional | Painel → Conteúdo do site |
| Texto institucional definitivo | Painel → Conteúdo → Institucional |
| E-mail, horário e endereço (se houver) | Painel → Conteúdo → Contato |
| Confirmação do número da Nicolly | Painel → Conteúdo → Atendentes |
| Depoimentos reais (com autorização) | Painel → Depoimentos |
| Publicações do Instagram em destaque | Painel → Conteúdo → Instagram |
| Imagem de compartilhamento em JPG/PNG | Painel → Conteúdo → SEO |

### Sobre o Instagram integrado
A seção mostra publicações escolhidas no painel (imagem + link do post). Um feed 100% automático exige a **Instagram Graph API**, que pede conta profissional ligada a uma Página do Facebook, um app na Meta for Developers e renovação de token. Isso pode ser adicionado depois como uma Edge Function, sem mudar o layout.

---

## 6. Segurança (resumo)
- **RLS** em todas as tabelas: visitantes só leem o catálogo ativo e as configurações públicas; pedidos, clientes e administradores só são acessíveis a administradores.
- Visitantes criam pedidos **somente** pela função `create_site_order`, que valida os dados e recalcula os preços no servidor.
- Uploads restritos a administradores, apenas imagens até 8 MB; as fotos são comprimidas no navegador antes do envio.
- A chave `service_role` existe apenas dentro da Edge Function.
- O painel não é indexado por buscadores (`robots.txt` + `noindex`).

## 7. Scripts úteis
```bash
npm run gen:images   # regenera as ilustrações de exemplo (public/demo)
npm run gen:seed     # regenera supabase/seed.sql a partir de src/data/demo-data.json
npm run typecheck
```
