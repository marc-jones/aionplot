FROM tiangolo/uwsgi-nginx-flask:python2.7
COPY ./app /app
COPY ./setup /setup
WORKDIR /setup
ENV YAML_LOCATION=/yaml
RUN cat /app/templates/SearchAndPlot/*.js > /app/templates/SearchAndPlot.js
RUN pip install -r requirements.txt
