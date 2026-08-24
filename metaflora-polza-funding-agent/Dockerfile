FROM mcr.microsoft.com/playwright:v1.62.1-noble

ARG TARGETARCH

RUN apt-get update \
  && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends ca-certificates curl fluxbox gnupg novnc websockify x11vnc \
  && if [ "$TARGETARCH" = "amd64" ]; then \
    install -d -m 0755 /usr/share/keyrings; \
    curl --fail --show-error --silent --location --proto '=https' --proto-redir '=https' --tlsv1.2 \
      --output /tmp/google-linux-signing-key.pub \
      https://dl.google.com/linux/linux_signing_key.pub; \
    install -d -m 0700 /tmp/google-chrome-gnupg; \
    gpg --batch --homedir /tmp/google-chrome-gnupg --import /tmp/google-linux-signing-key.pub; \
    gpg --batch --homedir /tmp/google-chrome-gnupg --with-colons --fingerprint EB4C1BFD4F042F6DDDCCEC917721F63BD38B4796 \
      | grep --quiet '^fpr:::::::::EB4C1BFD4F042F6DDDCCEC917721F63BD38B4796:$'; \
    gpg --batch --homedir /tmp/google-chrome-gnupg --export EB4C1BFD4F042F6DDDCCEC917721F63BD38B4796 \
      > /usr/share/keyrings/google-chrome.gpg; \
    test -s /usr/share/keyrings/google-chrome.gpg; \
    chmod 0644 /usr/share/keyrings/google-chrome.gpg; \
    echo "deb [arch=amd64 signed-by=/usr/share/keyrings/google-chrome.gpg] https://dl.google.com/linux/chrome/deb/ stable main" \
      > /etc/apt/sources.list.d/google-chrome.list; \
    rm -f /tmp/google-linux-signing-key.pub; \
    rm -r /tmp/google-chrome-gnupg; \
    apt-get update; \
    DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends google-chrome-stable; \
  fi \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --omit=dev
COPY . .
RUN chmod +x /app/start.sh

ENV DISPLAY=:99
CMD ["/app/start.sh"]
