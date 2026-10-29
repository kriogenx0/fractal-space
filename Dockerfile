FROM node:22-alpine AS test
WORKDIR /app
COPY dist/ ./dist/
COPY scripts/check-site.mjs scripts/render-wild.mjs scripts/check-parallax.mjs scripts/check-levitated.mjs scripts/check-tandava-controller.mjs scripts/check-theme.mjs scripts/check-levitated-studies.mjs scripts/check-levitated-player.mjs scripts/check-levitated-archive.mjs scripts/check-levitated-kinetic.mjs ./scripts/
CMD ["node", "scripts/check-site.mjs"]

FROM nginx:alpine AS production
COPY docker/nginx.conf /etc/nginx/nginx.conf
COPY --chown=nginx:nginx dist/ /usr/share/nginx/html/
USER nginx
EXPOSE 8080
HEALTHCHECK --interval=10s --timeout=3s --start-period=3s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:8080/healthz || exit 1
ENTRYPOINT ["nginx"]
CMD ["-g", "daemon off;"]
