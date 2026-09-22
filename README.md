# CluBingoEdition

Sistema de bingo do Clube. O notebook do sorteador roda o servidor e o banco de
dados (arquivo SQLite local); os tablets dos conferentes se conectam e ficam
sincronizados em tempo real via **SSE** (Server-Sent Events).

Sem nuvem, sem serviços externos: todo o dado fica no notebook, no arquivo
`data/clubingo.db`.

## Requisitos

- **Node.js** (testado na v24+)
- **Bun** (usado apenas como gerenciador de pacotes)
- **cloudflared** (opcional, para acesso externo via tunnel)

> Importante: `better-sqlite3` é um módulo nativo que **não carrega no runtime
> do Bun no Windows**. Por isso TODOS os scripts usam `node` explicitamente.
> `bun` só é usado para `bun install` / `bun add`.

## Instalação

```bash
bun install
```

## Desenvolvimento

```bash
bun run dev
```

Sobe o servidor em `http://localhost:3000`. Na mesma rede, os tablets acessam
`http://IP-DO-NOTEBOOK:3000` (o endereço `Network:` aparece no terminal).

## Produção

```bash
bun run build
bun run start
```

O build gera `.output/` e o `start` roda o servidor Node em
`http://localhost:3000`.

## Acesso externo (Cloudflare Tunnel)

Com o servidor rodando na porta 3000:

```bash
bun run tunnel
```

Isso publica o site em uma URL temporária `*.trycloudflare.com`. Para uma URL
fixa, configure um `cloudflared tunnel` com DNS próprio.

> Dica: para os tablets funcionarem a noite toda, mantenha o notebook ligado e
> o sistema não pode dormir (ajuste o plano de energia).

## Scripts

| comando           | o que faz                          |
| ----------------- | ---------------------------------- |
| `bun run dev`     | servidor de desenvolvimento        |
| `bun run build`   | build de produção (`.output/`)     |
| `bun run start`   | roda o build de produção           |
| `bun run tunnel`  | expõe a porta 3000 via Cloudflare  |
| `bun run lint`    | eslint                            |
| `bun run format`  | prettier                          |

## Estrutura

- `src/routes/api/bingo/` — API REST (`state`, `draw`, `toggle`, `reset`) e
  `stream` (SSE em tempo real).
- `src/server/` — banco SQLite (`db.server.ts`), lógica de bingo
  (`bingo.service.ts`) e broadcast SSE (`sse.server.ts`). Roda apenas no
  servidor (protegido por `importProtection`).
- `src/lib/bingo-store.ts` — cliente React que busca o estado e mantém a
  conexão SSE com fila offline.
- `data/` — banco físico `clubingo.db` (gerado automaticamente, fora do git).