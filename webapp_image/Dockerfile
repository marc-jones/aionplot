FROM tiangolo/uwsgi-nginx-flask:python2.7
RUN apt-get update && apt-get install -y wkhtmltopdf xvfb fonts-texgyre
COPY ./setup /setup
WORKDIR /setup
RUN pip install -r requirements.txt
RUN /setup/setup_virtualx_env.sh
RUN /setup/download_blast.sh
COPY /setup/app.conf /etc/nginx/conf.d/
COPY /setup/supervisord.conf /etc/supervisor/supervisord.conf
COPY ./app /app
ENV CONTENT_LOCATION=/content
RUN cat /app/templates/SearchAndPlot/*.js > /app/templates/SearchAndPlot.js
RUN chown -R nginx:nginx /etc/nginx
RUN chown -R nginx:nginx /app
RUN touch /var/run/nginx.pid
RUN chown -R nginx:nginx /var/run/nginx.pid
RUN chown -R nginx:nginx /var/cache/nginx
RUN chown -R nginx:nginx /var/log
ENV LISTEN_PORT 8080
EXPOSE 8080
