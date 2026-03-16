# Stage 1
# Packaging
FROM node:18.19-alpine AS build
WORKDIR /app
COPY package.json .
RUN npm install --force --legacy-peer-deps
RUN npm install htmlparser2 entities --force
COPY . .
ENV NODE_ENV=production
ENV NODE_OPTIONS=--openssl-legacy-provider
RUN npm run build --output-hashing=all

# Stage 2
FROM nginx:stable-alpine

WORKDIR /axia

# Ajusta diretórios para o usuário nginx (padrão dos workers)
RUN mkdir -p /var/lib/nginx \
    && mkdir -p /var/cache/nginx/client_temp \
    && mkdir -p /var/log/nginx \
    && mkdir -p /var/run/nginx \
    && mkdir -p /run/nginx \
    && chown -R nginx:nginx /axia \
    && chown -R nginx:nginx /var/lib/nginx \
    && chown -R nginx:nginx /var/log/nginx \
    && chown -R nginx:nginx /etc/nginx \
    && chown -R nginx:nginx /var/cache/nginx \
    && chown -R nginx:nginx /var/run/nginx \
    && chown -R nginx:nginx /run/nginx

# Copia config antes de validar
COPY ./devops/nginx.conf /etc/nginx/nginx.conf

# Copia app estático
COPY --from=build /app/dist/app/browser /axia
RUN ls -la /axia

EXPOSE 8080
ENV TZ=America/Sao_Paulo

COPY replace_api_url.sh .
CMD ["sh", "replace_api_url.sh"]