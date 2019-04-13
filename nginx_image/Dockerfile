FROM alpine:3.8

RUN apk add --update nginx && rm -rf /var/cache/apk/*

COPY nginx.conf /etc/nginx/nginx.conf

USER nobody
CMD ["nginx", "-g", "daemon off;"]
