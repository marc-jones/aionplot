FROM tiangolo/uwsgi-nginx-flask:python2.7
RUN apt-get update && apt-get install -y wkhtmltopdf xvfb fonts-texgyre
COPY ./app /app
COPY ./setup /setup
RUN /setup/setup_virtualx_env.sh
WORKDIR /setup
RUN mv app.conf /etc/nginx/conf.d/
ENV YAML_LOCATION=/yaml
RUN cat /app/templates/SearchAndPlot/*.js > /app/templates/SearchAndPlot.js
RUN pip install -r requirements.txt
