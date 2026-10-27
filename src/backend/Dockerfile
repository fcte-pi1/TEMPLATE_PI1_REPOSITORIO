FROM postgres:18
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        python3 python3-venv supervisor ca-certificates \
    && rm -rf /var/lib/apt/lists/*
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1
WORKDIR /app
COPY requirements.txt .
RUN python3 -m venv /opt/venv \
    && /opt/venv/bin/python -m pip install \
        --no-cache-dir -r requirements.txt
COPY app ./app
COPY iniciar_api.py .
COPY supervisord.conf /etc/supervisor/micromouse.conf
EXPOSE 8000
STOPSIGNAL SIGTERM
ENTRYPOINT ["/usr/bin/supervisord"]
CMD ["-c", "/etc/supervisor/micromouse.conf"]