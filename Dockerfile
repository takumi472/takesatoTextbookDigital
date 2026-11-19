FROM nginx:alpine

# Cloud Run injects PORT (default 8080); nginx:alpine runs envsubst on /etc/nginx/templates/*.template
ENV PORT=8080
ENV NGINX_ENVSUBST_FILTER=^PORT$

COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY site/ /usr/share/nginx/html/

EXPOSE 8080
