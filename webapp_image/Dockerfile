FROM tiangolo/uwsgi-nginx-flask:python2.7
RUN apt-get update && apt-get install -y wkhtmltopdf xvfb fonts-texgyre
COPY ./setup /setup
WORKDIR /setup
RUN pip install -r requirements.txt
COPY ./app /app
RUN /setup/setup_virtualx_env.sh
RUN mv app.conf /etc/nginx/conf.d/
ENV CONTENT_LOCATION=/content
RUN cat /app/templates/SearchAndPlot/*.js > /app/templates/SearchAndPlot.js
