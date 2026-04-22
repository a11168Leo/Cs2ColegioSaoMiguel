# CS2 CSM Control Center

Webpanel para gerir partidas de CS2 num estilo mini Faceit:

- criar partidas
- ver fila de matches
- arrancar, pausar, retomar e encerrar
- enviar comandos manuais por RCON

## Stack

- `app/`: backend em FastAPI
- `frontend/`: frontend em React + Vite
- `RCON`: comunicacao com o servidor CS2

## Estrutura

- `app/main.py`: API principal
- `app/core/config.py`: configuracoes do projeto
- `app/core/security.py`: auth por bearer token
- `app/services/match_service.py`: gestao das partidas
- `app/services/rcon_service.py`: comandos RCON
- `frontend/src/App.jsx`: interface principal
- `frontend/src/lib/api.js`: cliente da API
- `frontend/src/styles.css`: visual do painel

## Requisitos

Antes de comecar, garante que tens instalado:

- Node.js 18+ com `npm`
- Python 3.10+ com `pip`

Para confirmar:

```powershell
node -v
npm -v
python --version
```

Se `python` nao funcionar no Windows, testa:

```powershell
py --version
```

## Instalacao

Corre os comandos a partir da raiz do projeto:

```powershell
cd Z:\Cs2-ColegioSaoMiguel
```

### 1. Instalar dependencias do frontend

```powershell
npm --prefix frontend install
```

### 2. Instalar dependencias do backend

Com `python`:

```powershell
python -m pip install fastapi uvicorn valve-rcon
```

Ou com `py`, se necessario:

```powershell
py -m pip install fastapi uvicorn valve-rcon
```

## Como correr

Abre dois terminais.

### Terminal 1: backend

Na raiz do projeto:

```powershell
cd Z:\Cs2-ColegioSaoMiguel
python -m uvicorn app.main:app --reload
```

Se `python` nao for reconhecido:

```powershell
cd Z:\Cs2-ColegioSaoMiguel
py -m uvicorn app.main:app --reload
```

Importante:

- corre este comando na raiz do projeto
- nao corras dentro de `app/`
- usa `python -m uvicorn ...` em vez de `uvicorn ...` no Windows

Backend por defeito:

- `http://localhost:8000`

### Terminal 2: frontend

Na raiz do projeto:

```powershell
cd Z:\Cs2-ColegioSaoMiguel
npm run dev
```

Ou diretamente na pasta do frontend:

```powershell
cd Z:\Cs2-ColegioSaoMiguel\frontend
npm run dev
```

Frontend por defeito:

- `http://localhost:5173`

## Configuracao do painel

No frontend, a configuracao inicial esta preparada para:

- `API Base URL`: `http://localhost:8000`
- `Bearer token`: `dev-panel-token`

## Auth

A API usa bearer token.

Token por defeito:

```text
dev-panel-token
```

Header esperado:

```text
Authorization: Bearer dev-panel-token
```

Podes alterar o token com a variavel de ambiente:

```powershell
$env:PANEL_API_TOKEN="o-teu-token"
python -m uvicorn app.main:app --reload
```

## RCON

Configuracoes atuais no backend:

- `RCON_HOST`
- `RCON_PORT`
- `RCON_PASSWORD`
- `RCON_SIMULATION_MODE`

Por defeito, o projeto esta seguro para desenvolvimento porque usa simulacao.

Se quiseres manter em modo simulacao:

```powershell
$env:RCON_SIMULATION_MODE="true"
```

Se quiseres usar RCON real:

```powershell
$env:RCON_SIMULATION_MODE="false"
$env:RCON_HOST="127.0.0.1"
$env:RCON_PORT="27015"
$env:RCON_PASSWORD="a-tua-password"
python -m uvicorn app.main:app --reload
```

## Scripts disponiveis

Na raiz:

```powershell
npm run dev
npm run build
```

No frontend:

```powershell
npm run dev
npm run build
npm run preview
```

## Build do frontend

Para testar se o frontend compila:

```powershell
cd Z:\Cs2-ColegioSaoMiguel
npm run build
```

## Problemas comuns

### `uvicorn : The term 'uvicorn' is not recognized`

Usa:

```powershell
python -m pip install fastapi uvicorn valve-rcon
python -m uvicorn app.main:app --reload
```

Ou:

```powershell
py -m pip install fastapi uvicorn valve-rcon
py -m uvicorn app.main:app --reload
```

### `python` nao e reconhecido

Testa:

```powershell
py --version
```

Se `py` funcionar, usa `py -m ...` em vez de `python -m ...`.

### `npm run dev` na raiz nao funcionava

Ja foi corrigido com um `package.json` na raiz. Agora podes arrancar o frontend com:

```powershell
npm run dev
```

### O frontend abre mas nao carrega dados

Verifica:

- se o backend esta a correr em `http://localhost:8000`
- se o token no painel e igual ao `PANEL_API_TOKEN`
- se a `API Base URL` no frontend esta correta

## Estado atual

Ja existe:

- backend FastAPI funcional
- criacao e listagem de partidas
- dashboard frontend
- acoes de `start`, `pause`, `resume`, `end`
- envio de comando manual
- modo simulacao para desenvolvimento

## Proximos passos

Sugestoes para a proxima fase:

- historico de comandos por match
- scoreboard live
- fluxo de veto/picks
- autenticacao com login real
- persistencia em base de dados
