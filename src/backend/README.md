# _Backend_

Esta pasta deverá armazenar arquivos referentes a:

- Código-fonte da API REST: rotas, controladores, modelos e lógica de negócio.
- Arquivos de configuração do servidor: `app.py`, `server.js`, `main.go` etc., dependendo da linguagem/framework utilizado ([Flask](https://flask.palletsprojects.com/), [FastAPI](https://fastapi.tiangolo.com/), [Express](https://expressjs.com/), [Django](https://www.djangoproject.com/) etc.).
- Arquivos de definição de dependências: `requirements.txt` ou `pyproject.toml` (Python), `package.json` (Node.js), `pom.xml` (Java/Maven) etc.
- Scripts de migração e esquemas de banco de dados: arquivos `.sql`, scripts de migração ([Alembic](https://alembic.sqlalchemy.org/), [Sequelize](https://sequelize.org/) etc.) e seeds de dados para desenvolvimento.
- Arquivos de configuração de ambiente: `.env.example` com as variáveis de ambiente necessárias (nunca o `.env` real).
- Arquivos de containerização: `Dockerfile` e `docker-compose.yml`, caso o serviço seja executado em contêiner.

Evite incluir:

- Credenciais e segredos: arquivos `.env`, chaves de API, senhas, tokens de acesso ou qualquer dado sensível **nunca** devem ser versionados.
- Artefatos de build: diretórios como `__pycache__/`, `dist/`, `build/`, `.eggs/` devem ser gerados localmente e ignorados via `.gitignore`.
- Dependências instaladas: pastas como `node_modules/` ou ambientes virtuais Python (`venv/`, `.env/`) não devem ser incluídos no repositório.
- Arquivos temporários/específicos do sistema operacional: arquivos gerados automaticamente pelo sistema ou pelo gerenciador de arquivos (ex.: `*~`, `.DS_Store`, `Thumbs.db`).
> [!WARNING]
> **Não acrescente arquivos referentes ao _frontend_ nesta pasta.** Eles deverão ser armazenados na pasta [frontend](https://github.com/fcte-pi1/template/tree/main/src/frontend) deste repositório.

# Backend — Micromouse

Backend do projeto **Micromouse**, responsável por fornecer a estrutura necessária para o desenvolvimento das funcionalidades do servidor e integração com o banco de dados PostgreSQL.

O backend utiliza **FastAPI** como framework principal, **SQLAlchemy** para comunicação com o banco de dados e **PostgreSQL** executado através de Docker.

---

## Tecnologias utilizadas

- Python
- FastAPI
- Uvicorn
- SQLAlchemy
- PostgreSQL
- Psycopg
- Docker / Docker Compose
- Alembic
- Pydantic Settings

---

## Estrutura do backend

A estrutura principal do backend está organizada da seguinte forma:

```text
backend/
├── app/
│   ├── core/
│   │   ├── __init__.py
│   │   ├── config.py
│   │   └── database.py
│   │
│   ├── __init__.py
│   └── main.py
│
├── db/
│   ├── 01-schema.sql
│   └── README.md
│
├── migrations/
│   ├── versions/
│   ├── env.py
│   └── script.py.mako
│
├── .env.example
├── alembic.ini
├── docker-compose.yml
├── requirements.txt
└── README.md
```

### `app/`

Contém o código principal da aplicação FastAPI.

### `app/main.py`

Arquivo de inicialização da API.

É responsável por criar a aplicação FastAPI e registrar os endpoints iniciais.

### `app/core/config.py`

Responsável pela leitura das variáveis de ambiente utilizadas pela aplicação.

As configurações são carregadas a partir do arquivo `.env`.

### `app/core/database.py`

Responsável por configurar a conexão entre a aplicação e o PostgreSQL através do SQLAlchemy.

Também disponibiliza a sessão utilizada para operações futuras no banco.

### `db/`

Contém arquivos relacionados à inicialização e estrutura do banco PostgreSQL.

### `migrations/`

Contém a configuração do Alembic e as migrations utilizadas para versionamento da estrutura do banco.

---

# Pré-requisitos

Antes de executar o backend, é necessário possuir:

- Python instalado;
- Docker Desktop instalado e em execução;
- Git;
- terminal PowerShell, CMD, Bash ou equivalente.

O PostgreSQL não precisa obrigatoriamente estar instalado diretamente no computador, pois o projeto utiliza um container PostgreSQL através do Docker.

---

# Configuração inicial

## 1. Acessar a pasta do backend

A partir da raiz do repositório:

```bash
cd src/backend
```

Os comandos seguintes devem ser executados dentro dessa pasta.

---

## 2. Criar o ambiente virtual Python

No Windows:

```powershell
py -m venv .venv
```

Caso `py` não esteja disponível:

```powershell
python -m venv .venv
```

### Ativando o ambiente virtual

PowerShell:

```powershell
.\.venv\Scripts\Activate.ps1
```

CMD:

```cmd
.venv\Scripts\activate
```

Linux/macOS:

```bash
source .venv/bin/activate
```

Quando o ambiente estiver ativo, o terminal deverá apresentar algo semelhante a:

```text
(.venv) PS C:\...\src\backend>
```

---

## 3. Instalar as dependências

Com o ambiente virtual ativado:

```bash
pip install -r requirements.txt
```

As principais dependências utilizadas pelo backend incluem:

```text
FastAPI
Uvicorn
SQLAlchemy
Psycopg
Alembic
Pydantic Settings
```

---

# Variáveis de ambiente

O projeto utiliza um arquivo `.env` para armazenar configurações locais.

O arquivo `.env` **não deve ser versionado**, principalmente porque pode conter credenciais.

Utilize o arquivo:

```text
.env.example
```

como referência.

Crie um arquivo:

```text
.env
```

dentro de:

```text
src/backend/
```

Exemplo:

```env
POSTGRES_USER=micromouse
POSTGRES_PASSWORD=coloque_sua_senha_aqui
POSTGRES_DB=micromouse
POSTGRES_PORT=5432
```

## Significado das variáveis

| Variável | Descrição |
|---|---|
| `POSTGRES_USER` | Usuário utilizado para acessar o PostgreSQL |
| `POSTGRES_PASSWORD` | Senha do usuário PostgreSQL |
| `POSTGRES_DB` | Nome do banco de dados utilizado pelo projeto |
| `POSTGRES_PORT` | Porta utilizada pelo computador para acessar o container PostgreSQL |

---

# Porta do PostgreSQL

Por padrão, o projeto utiliza:

```env
POSTGRES_PORT=5432
```

Entretanto, caso já exista outro PostgreSQL ou outro serviço utilizando a porta `5432` no computador, é possível utilizar outra porta local.

Por exemplo:

```env
POSTGRES_PORT=55432
```

O `docker-compose.yml` realiza o mapeamento:

```text
Computador:55432
        ↓
Docker:5432
        ↓
PostgreSQL
```

A porta interna do PostgreSQL dentro do container continua sendo `5432`.

Portanto, alterar `POSTGRES_PORT` no `.env` não altera a porta interna do PostgreSQL.

---

# Banco de dados com Docker

O banco PostgreSQL é executado através do Docker Compose.

Certifique-se de que o **Docker Desktop esteja aberto e em execução**.

Dentro de:

```text
src/backend
```

execute:

```bash
docker compose up -d backend
```

O parâmetro:

```text
-d
```

faz com que o container seja executado em segundo plano.

---

## Verificar o container

Para verificar se o PostgreSQL está em execução:

```bash
docker compose ps
```

Um resultado semelhante ao seguinte deve aparecer:

```text
NAME           IMAGE         SERVICE   STATUS
backend-db-1   postgres:18   db        Up
```

Na coluna `PORTS`, também será possível visualizar o mapeamento utilizado.

Exemplo utilizando a porta padrão:

```text
0.0.0.0:5432->5432/tcp
```

Ou utilizando uma porta alternativa:

```text
0.0.0.0:55432->5432/tcp
```

---

# Parar o banco

Para interromper os containers:

```bash
docker compose down
```

Esse comando não remove o volume persistente do PostgreSQL.

Portanto, os dados armazenados são preservados.

> **Atenção:** evite utilizar `docker compose down -v` sem necessidade.
>
> O parâmetro `-v` remove os volumes associados ao container e pode apagar os dados armazenados localmente no PostgreSQL.

---

# Persistência dos dados

O `docker-compose.yml` utiliza um volume para manter os dados do PostgreSQL:

```text
dados_db
```

Isso significa que os dados permanecem armazenados mesmo que o container seja interrompido ou recriado.

Os arquivos presentes em:

```text
db/
```

podem ser utilizados pelo PostgreSQL durante a inicialização inicial do banco.

Scripts presentes em:

```text
/docker-entrypoint-initdb.d
```

normalmente são executados apenas quando o volume do PostgreSQL é inicializado pela primeira vez.

---

# Executando o backend

Certifique-se primeiro de que:

```text
1. O Docker está aberto;
2. O banco PostgreSQL está em execução;
3. O ambiente virtual está ativado;
4. As dependências foram instaladas.
```

Dentro de:

```text
src/backend
```

execute:

```bash
python -m uvicorn app.main:app --reload
```

É recomendado utilizar:

```text
python -m uvicorn
```

em vez de apenas:

```text
uvicorn
```

para garantir que o Uvicorn utilizado pertence ao mesmo ambiente Python do projeto.

Se tudo estiver funcionando corretamente, aparecerá algo semelhante a:

```text
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete.
```

---

# Endpoints iniciais

## API

A aplicação estará disponível em:

```text
http://127.0.0.1:8000
```

Ao acessar:

```text
http://127.0.0.1:8000/
```

a API deverá responder indicando que o backend está funcionando.

---

## Health Check

Para verificar o status da aplicação e da conexão com o banco:

```text
http://127.0.0.1:8000/health
```

Quando a aplicação e o banco estiverem funcionando corretamente:

```json
{
  "status": "ok",
  "database": "connected"
}
```

Caso exista algum problema de conexão:

```json
{
  "status": "error",
  "database": "disconnected"
}
```

O endpoint de health check permite verificar rapidamente se:

```text
FastAPI
   ↓
SQLAlchemy
   ↓
Psycopg
   ↓
PostgreSQL
```

estão conseguindo se comunicar corretamente.

---

# Documentação automática da API

O FastAPI disponibiliza automaticamente uma interface Swagger.

Com o backend em execução, acesse:

```text
http://127.0.0.1:8000/docs
```

Através dessa página é possível visualizar e testar os endpoints disponíveis.

Também está disponível a documentação ReDoc:

```text
http://127.0.0.1:8000/redoc
```

---

# Banco de dados e SQLAlchemy

A conexão com o PostgreSQL está configurada em:

```text
app/core/database.py
```

O SQLAlchemy utiliza as configurações carregadas através de:

```text
app/core/config.py
```

As informações utilizadas para montar a conexão vêm do `.env`.

O fluxo simplificado é:

```text
.env
 │
 ├── POSTGRES_USER
 ├── POSTGRES_PASSWORD
 ├── POSTGRES_DB
 └── POSTGRES_PORT
           ↓
       config.py
           ↓
      database.py
           ↓
       SQLAlchemy
           ↓
        Psycopg
           ↓
      PostgreSQL
```

Dessa forma, nenhuma credencial precisa ficar escrita diretamente no código.

---

# Migrations

O projeto utiliza **Alembic** para versionamento da estrutura do banco de dados.

A configuração está presente em:

```text
alembic.ini
```

e:

```text
migrations/
```

Para verificar a migration atualmente aplicada:

```bash
alembic current
```

Para visualizar o histórico:

```bash
alembic history
```

Para aplicar migrations existentes:

```bash
alembic upgrade head
```

A criação de novas migrations deve ser realizada apenas quando houver alteração planejada na estrutura do banco.

Exemplo:

```bash
alembic revision --autogenerate -m "descricao da alteracao"
```

Antes de criar ou alterar migrations, verifique se a mudança não pertence a outra issue ou implementação já existente no projeto.

---

# Verificando diretamente a conexão com o banco

Caso seja necessário testar a conexão sem iniciar toda a API, é possível executar um teste através do Python.

Com o `.venv` ativado:

```powershell
python -c "from app.core.config import settings; import psycopg; conn = psycopg.connect(host=settings.POSTGRES_HOST, port=settings.POSTGRES_PORT, dbname=settings.POSTGRES_DB, user=settings.POSTGRES_USER, password=settings.POSTGRES_PASSWORD); print('CONEXAO OK'); conn.close()"
```

Quando estiver correto:

```text
CONEXAO OK
```

---

# Problemas comuns

## `ModuleNotFoundError`

Exemplo:

```text
ModuleNotFoundError: No module named 'fastapi'
```

Normalmente significa que o ambiente virtual não está ativo.

Ative:

```powershell
.\.venv\Scripts\Activate.ps1
```

Depois execute novamente:

```powershell
python -m uvicorn app.main:app --reload
```

---

## Porta PostgreSQL ocupada

Caso a porta `5432` já esteja utilizada:

```text
port 5432 already in use
```

altere no seu `.env`:

```env
POSTGRES_PORT=55432
```

Depois reinicie o container:

```bash
docker compose down
docker compose up -d backend
```

Não é necessário alterar o `docker-compose.yml`.

---

## Erro de autenticação PostgreSQL

Exemplo:

```text
password authentication failed
```

Verifique se:

```text
POSTGRES_USER
POSTGRES_PASSWORD
POSTGRES_DB
POSTGRES_PORT
```

no `.env` correspondem às configurações utilizadas pelo ambiente Docker.

Para verificar as variáveis utilizadas pelo container:

```bash
docker compose exec backend printenv POSTGRES_USER
docker compose exec backend printenv POSTGRES_DB
docker compose exec backend printenv POSTGRES_PORT
```

Evite compartilhar ou registrar a senha real em logs, commits, issues ou pull requests.

---

## Verificar se o banco está acessível pelo Docker

É possível executar:

```bash
docker compose exec backend psql -U micromouse -d micromouse
```

Dentro do PostgreSQL:

```sql
\dt
```

lista as tabelas.

Para sair:

```sql
\q
```

---

# Arquivos que não devem ser versionados

Arquivos locais ou sensíveis devem permanecer fora do Git.

Entre eles:

```text
.env
.venv/
__pycache__/
*.pyc
```

Antes de realizar um commit, utilize:

```bash
git status
```

e verifique se nenhum arquivo sensível está sendo incluído.

O `.env.example` pode e deve ser versionado, pois serve apenas como modelo de configuração.

---

# Fluxo recomendado para iniciar o ambiente

Após realizar a configuração inicial uma vez, o fluxo normal para trabalhar no backend é:

```bash
cd src/backend
```

Ativar o ambiente virtual:

```powershell
.\.venv\Scripts\Activate.ps1
```

Iniciar o PostgreSQL:

```bash
docker compose up -d backend
```

Iniciar o FastAPI:

```bash
python -m uvicorn app.main:app --reload
```

Depois acessar:

```text
API:
http://127.0.0.1:8000

Health Check:
http://127.0.0.1:8000/health

Swagger:
http://127.0.0.1:8000/docs

ReDoc:
http://127.0.0.1:8000/redoc
```

---

# Encerrando o ambiente

Para parar o FastAPI:

```text
CTRL + C
```

Para parar o banco:

```bash
docker compose down
```

Para sair do ambiente virtual:

```bash
deactivate
```

---

# Segurança

Nunca versione:

```text
senhas
tokens
credenciais
arquivos .env
chaves privadas
```

As configurações sensíveis devem permanecer exclusivamente no `.env` local de cada desenvolvedor.

O repositório deve conter somente:

```text
.env.example
```

com valores de exemplo.

---

# Status do setup

O setup atual disponibiliza:

```text
FastAPI
   ↓
SQLAlchemy
   ↓
Psycopg
   ↓
PostgreSQL
   ↓
Docker
```

Além de:

```text
✓ Estrutura inicial do backend
✓ Configuração através de variáveis de ambiente
✓ Banco PostgreSQL executado via Docker
✓ Persistência através de volume
✓ Conexão SQLAlchemy/PostgreSQL
✓ Health check da aplicação e banco
✓ Documentação Swagger automática
✓ Versionamento do banco através do Alembic
✓ Ambiente de desenvolvimento documentado
```

Essa estrutura fornece a base necessária para o desenvolvimento das próximas funcionalidades do servidor.
