FROM python:3.14-slim-trixie

COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

COPY . /app
ENV UV_NO_DEV=1
WORKDIR /app
RUN uv sync --locked

ENV PATH="/app/.venv/bin:$PATH"

RUN useradd -r app
USER app

CMD [ "gunicorn",  "-w", "4", "-b", "0.0.0.0", "--no-control-socket", "collagle:app" ]