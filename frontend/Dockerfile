FROM nginx:latest

WORKDIR /usr/src/app/
USER root

COPY ./deploy/nginx.conf /etc/nginx/conf.d/default.conf

COPY  ./build  /usr/share/nginx/html/

EXPOSE 80
STOPSIGNAL SIGTERM

CMD ["nginx", "-g", "daemon off;"]
