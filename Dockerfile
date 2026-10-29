FROM node:22-alpine AS test
WORKDIR /app
COPY dist/ ./dist/
COPY scripts/check-site.mjs scripts/seo.mjs scripts/check-seo.mjs scripts/render-social.mjs scripts/render-wild.mjs scripts/check-parallax.mjs scripts/check-levitated.mjs scripts/check-tandava-controller.mjs scripts/check-theme.mjs scripts/check-levitated-studies.mjs scripts/check-levitated-player.mjs scripts/check-levitated-archive.mjs scripts/check-levitated-kinetic.mjs scripts/check-levitated-geometric.mjs scripts/check-math.mjs scripts/check-terrain.mjs scripts/check-math-player.mjs ./scripts/
CMD ["node", "scripts/check-site.mjs"]

# Optional authoring image; Sharp never enters the production container.
FROM node:22-alpine AS seo
WORKDIR /app
COPY tools/seo/package.json tools/seo/package-lock.json /opt/seo/
RUN apk add --no-cache font-dejavu
RUN npm ci --prefix /opt/seo --no-audit --no-fund
COPY scripts/seo.mjs scripts/render-social.mjs ./scripts/
CMD ["node", "scripts/render-social.mjs"]

FROM nginx:alpine AS production
COPY docker/nginx.conf /etc/nginx/nginx.conf
COPY --chown=nginx:nginx dist/ /usr/share/nginx/html/
USER nginx
EXPOSE 8080
HEALTHCHECK --interval=10s --timeout=3s --start-period=3s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:8080/healthz || exit 1
ENTRYPOINT ["nginx"]
CMD ["-g", "daemon off;"]
