# syntax=docker/dockerfile:1

FROM node:24.18.0-alpine AS build

WORKDIR /workspace

ARG MFE_REGISTRY_URL=http://host.docker.internal:4873/
ARG PRODUCTS_ASSET_PREFIX=http://localhost:8081/

RUN corepack enable && corepack prepare pnpm@11.21.0 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc tsconfig.base.json ./
COPY apps/products-react/package.json apps/products-react/package.json

RUN pnpm config set '@mfe-lab:registry' "${MFE_REGISTRY_URL}" --location=project \
    && pnpm install --filter @mfe-lab/products-react... --frozen-lockfile

COPY apps/products-react apps/products-react

ENV PRODUCTS_ASSET_PREFIX=${PRODUCTS_ASSET_PREFIX}

RUN pnpm --filter @mfe-lab/products-react build

FROM nginx:1.28.2-alpine AS runtime

ENV MFE_ALLOWED_ORIGIN=http://localhost:8080

COPY infra/nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /workspace/apps/products-react/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=5s --timeout=3s --retries=12 \
  CMD wget --quiet --output-document=/dev/null http://127.0.0.1/ || exit 1
