# syntax=docker/dockerfile:1

FROM node:24.18.0-alpine AS build

WORKDIR /workspace

ARG MFE_REGISTRY_URL=http://host.docker.internal:4873/
ARG PRODUCTS_REMOTE_URL=http://localhost:8081/mf-manifest.json
ARG ACCOUNT_REMOTE_URL=http://localhost:8082/mf-manifest.json

RUN corepack enable && corepack prepare pnpm@11.21.0 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc tsconfig.base.json ./
COPY apps/shell-react/package.json apps/shell-react/package.json

RUN pnpm config set '@mfe-lab:registry' "${MFE_REGISTRY_URL}" --location=project \
    && pnpm install --filter @mfe-lab/shell-react... --frozen-lockfile

COPY apps/shell-react apps/shell-react

ENV ACCOUNT_REMOTE_URL=${ACCOUNT_REMOTE_URL}
ENV PRODUCTS_REMOTE_URL=${PRODUCTS_REMOTE_URL}
ENV MF_CONSUME_REMOTE_TYPES=false

RUN pnpm --filter @mfe-lab/shell-react build

FROM nginx:1.28.2-alpine AS runtime

ENV MFE_ALLOWED_ORIGIN=http://localhost:8080

COPY infra/nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /workspace/apps/shell-react/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=5s --timeout=3s --retries=12 \
  CMD wget --quiet --output-document=/dev/null http://127.0.0.1/ || exit 1
