# Scan2Connect

Sistema de QR Code para networking em eventos. Cada participante recebe um adesivo com QR Code único que, ao ser escaneado, redireciona para o perfil LinkedIn vinculado.

## Requisitos

- Node.js 20+

## Início rápido

```bash
npm install
cp .env.example .env   # edite com sua senha e BASE_URL
npm run dev
```

O terminal deve exibir `Server running at http://127.0.0.1:3000`. Confirme com:

```bash
curl http://localhost:3000/health
# {"status":"ok"}
```

---

## Como utilizar

> **Importante:** este projeto é um **servidor backend (Fastify)**, não um app com página inicial. Acessar apenas `http://localhost:3000/` retorna `{"error":"Código não encontrado"}` — isso é esperado.

### URLs principais

| URL | Quem usa | O que faz |
|-----|----------|-----------|
| `http://localhost:3000/health` | Desenvolvedor | Verifica se o servidor está rodando |
| `http://localhost:3000/admin/login` | Organizador | Tela de login do painel admin |
| `http://localhost:3000/admin` | Organizador | Dashboard após login |
| `http://localhost:3000/{codigo}` | Participante | Cadastro ou redirecionamento ao LinkedIn |
| `http://localhost:3000/admin/codes/{id}/qr` | Organizador | Download do QR Code em PNG |

Substitua `{codigo}` pelo `short_id` gerado no painel (ex: `a65198`, `teste01`).

### Fluxo completo

```
1. Organizador  →  /admin/login  →  gera códigos no painel
2. Organizador  →  baixa QR de cada código  →  imprime nos adesivos
3. Participante →  escaneia QR  →  /{codigo}  →  vincula LinkedIn
4. Participante →  escaneia novamente  →  redirect direto ao LinkedIn
```

### 1. Painel admin (organizador)

1. Acesse **`http://localhost:3000/admin/login`**
2. Entre com a senha definida em `ADMIN_PASSWORD` no `.env`
3. No painel você pode:
   - Gerar lote de códigos (campo "Quantidade" + botão gerar)
   - Ver status de cada código (vinculado / não vinculado)
   - Baixar QR Code PNG de qualquer código
   - Desvincular um código para permitir novo cadastro

### 2. Cadastro do participante

1. Gere um código no painel admin, **ou** insira um manualmente no banco:

```bash
node -e "
import Database from 'better-sqlite3';
const db = new Database('./data.db');
db.prepare(\"INSERT OR IGNORE INTO codes (id) VALUES ('teste01')\").run();
console.log('Código criado: teste01');
"
```

2. Abra **`http://localhost:3000/teste01`**
   - Código sem LinkedIn vinculado → tela de cadastro
   - Cole a URL completa do perfil (`https://www.linkedin.com/in/seu-usuario`) ou informe apenas o usuário (`joao-silva`)
   - Clique em confirmar para vincular
3. Acesse **`http://localhost:3000/teste01`** novamente → redireciona ao LinkedIn

### 3. Download de QR Code

Com o servidor rodando e autenticado no admin:

```
http://localhost:3000/admin/codes/{id}/qr
```

Substitua `{id}` pelo `short_id` do código. Retorna PNG pronto para impressão.

---

## Rodando localmente

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar variáveis de ambiente

```bash
cp .env.example .env
```

Edite `.env` com os valores mínimos para rodar local:

```env
ADMIN_PASSWORD=admin123
BASE_URL=http://localhost:3000
```

### 3. Iniciar o servidor

```bash
npm run dev    # desenvolvimento com hot reload
npm run build  # compila TypeScript
npm start      # produção (após build)
```

Servidor disponível em `http://localhost:3000`.

### Solução de problemas

| Sintoma | Causa provável | Solução |
|---------|----------------|---------|
| Página em branco ou JSON de erro em `/` | Não há homepage na raiz | Use `/admin/login` ou `/{codigo}` |
| `Missing required environment variables` | `.env` ausente ou incompleto | Copie `.env.example` e preencha os campos obrigatórios |
| Navegador não conecta | Servidor não subiu ou porta ocupada | Verifique o terminal; tente `PORT=3001 npm run dev` |
| `curl /health` não responde | Processo não está rodando | Execute `npm run dev` e confira erros no terminal |

---

## Variáveis de ambiente

| Variável | Obrigatória | Descrição |
|----------|-------------|-----------|
| `ADMIN_PASSWORD` | ✅ | Senha do painel admin |
| `BASE_URL` | ✅ | URL pública do servidor (local: `http://localhost:3000`; produção: `https://scan-gdg.limadesenvolvimento.com`) |
| `PORT` | — | Porta do servidor (padrão: `3000`) |
| `DB_PATH` | — | Caminho do banco SQLite (padrão: `./data.db`) |
| `SESSION_SECRET` | — | Segredo das sessões admin (**obrigatório** em produção; ver [docs/deploy-portainer.md](docs/deploy-portainer.md)) |

## Testes automatizados

```bash
npm test
npm run coverage  # com relatório de cobertura
```

## Build

```bash
npm run build    # compila TypeScript → dist/
npm start        # inicia o servidor compilado
```

## Deploy com Docker Compose + GHCR

### Documentação

Índice completo: **[docs/README.md](docs/README.md)**

| Guia | Quando usar |
|------|-------------|
| **[docs/deploy-portainer.md](docs/deploy-portainer.md)** | **Produção** — Portainer + Traefik + subdomínio HTTPS |
| **[docs/deploy-ghcr.md](docs/deploy-ghcr.md)** | Publicar imagem no GHCR e testar Docker localmente |

**URL de produção:** `https://scan-gdg.limadesenvolvimento.com`

Arquivos de produção: `docker-compose.prod.yml` e `.env.prod.example`.

### Variáveis no Portainer (produção)

| Variável | Valor | Obrigatória |
|----------|-------|-------------|
| `DOMAIN` | `scan-gdg.limadesenvolvimento.com` | Sim |
| `ADMIN_PASSWORD` | senha forte | Sim |
| `SESSION_SECRET` | output de `openssl rand -base64 32` | Sim |
| `GITHUB_OWNER` | `lima08` | Não |
| `IMAGE_TAG` | `latest` | Não |
| `HOST_BIND_PORT` | `13087` | Não |
| `TZ` | `America/Sao_Paulo` | Não |

> **DNS vs `DOMAIN`:** na Hostinger o registro **A** usa nome `scan-gdg`; no Portainer a variável `DOMAIN` é o hostname **completo** `scan-gdg.limadesenvolvimento.com`.

### Rodar localmente com Docker

1. Copie o arquivo de ambiente:

```bash
cp .env.docker.example .env
```

2. Edite `.env` com `ADMIN_PASSWORD`, `BASE_URL` e `SESSION_SECRET`.

3. Suba o stack:

```bash
docker compose build
docker compose up -d
curl http://localhost:3000/health
```

O banco SQLite persiste no volume `scan2connect-data` em `/data/data.db` dentro do container.

4. Para validar persistência após restart:

```bash
docker compose down
docker compose up -d
```

### Publicar imagem no GitHub Container Registry

Detalhes completos em **[docs/deploy-ghcr.md](docs/deploy-ghcr.md)**. Resumo:

1. Faça push do repositório para o GitHub.
2. Em **Settings → Actions → General → Workflow permissions**, habilite **Read and write permissions**.
3. Em **Settings → Packages**, defina a visibilidade do pacote (pública ou privada).
4. No GitHub, abra **Actions → Docker Publish → Run workflow**.

Imagem publicada (sempre em **minúsculas**):

```
ghcr.io/lima08/scan2connect:latest
ghcr.io/lima08/scan2connect:sha-<commit>
```

### Deploy em produção (Portainer + Traefik)

Siga o guia **[docs/deploy-portainer.md](docs/deploy-portainer.md)** — inclui **primeiro acesso e testagem** (Parte 5). Resumo:

1. Registro DNS **A** `scan-gdg` → IP do servidor (Hostinger).
2. Stack no Portainer com `docker-compose.prod.yml`.
3. Variáveis: `DOMAIN=scan-gdg.limadesenvolvimento.com`, `ADMIN_PASSWORD`, `SESSION_SECRET`.
4. Validar: `curl https://scan-gdg.limadesenvolvimento.com/health`
5. Primeiro acesso: `https://scan-gdg.limadesenvolvimento.com/admin/login` — ver Parte 5 do guia

### Docker sem Compose (alternativa local)

```bash
docker build -t scan2connect .
docker run -d --name scan2connect -p 3000:3000 \
  -e ADMIN_PASSWORD=senha \
  -e BASE_URL=http://localhost:3000 \
  -e SESSION_SECRET=segredo-longo-aleatorio-com-32-chars-ou-mais \
  -v scan2connect-data:/data \
  -e DB_PATH=/data/data.db \
  --restart unless-stopped \
  scan2connect
```

> Em produção com Traefik, use `docker-compose.prod.yml` — veja [docs/deploy-portainer.md](docs/deploy-portainer.md).

## Fluxo de uso no evento

### 1. Antes do evento — gerar QR Codes

Acesse `/admin/login`, faça login e gere um lote de N códigos em `/admin/codes`. Baixe o QR de cada um (`/admin/codes/{id}/qr`) e envie para impressão nos adesivos.

### 2. Durante o evento — participante escaneia

- **Primeiro scan**: aparece tela de cadastro → participante informa URL ou usuário do LinkedIn → sistema verifica e vincula
- **Scans seguintes (mobile)**: página intermediária com botão **"Abrir no LinkedIn"** — tenta abrir o app nativo; após 3s, fallback automático para o perfil no navegador
- **Scans seguintes (desktop)**: redirect 302 direto para o LinkedIn do participante

#### Abrir no app do LinkedIn (mobile)

No celular, o sistema detecta o dispositivo e exibe [`/open.html`](/open.html) em vez de redirecionar direto. O botão usa Intent URL no Android e Universal Links no iOS (via HTTPS com gesto do usuário).

**Limitações conhecidas:**

- Nem sempre é possível abrir o app — navegadores internos de WhatsApp, Instagram e similares bloqueiam Universal Links
- No iOS, o toque no botão aumenta a chance de abrir o app; o redirect automático após 3s vai para a versão web
- Não há como detectar no servidor se o LinkedIn está instalado; a lógica roda no navegador do celular

### 3. Correções — painel admin

No painel é possível desvincular qualquer código (ex: participante digitou username errado) para permitir um novo cadastro.

## Rotas

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/{short_id}` | Redireciona (mobile → `/open.html`, desktop → LinkedIn) ou serve tela de cadastro |
| `GET` | `/open.html` | Página intermediária para abrir perfil no app LinkedIn (mobile) |
| `POST` | `/{short_id}` | Vincula URL ou usuário LinkedIn ao código |
| `GET` | `/health` | Health check |
| `GET` | `/admin/login` | Tela de login admin |
| `POST` | `/admin/login` | Autenticação admin |
| `GET` | `/admin/codes` | Listagem de códigos + estatísticas |
| `GET` | `/admin/codes/export` | Exportar códigos (`format=csv` ou `format=zip`, `status=all\|linked\|unlinked`) |
| `POST` | `/admin/codes` | Gerar lote de códigos (`{ count: N }`) |
| `GET` | `/admin/codes/:id/qr` | Download do QR Code PNG |
| `POST` | `/admin/codes/:id/unlink` | Desvincular código |
