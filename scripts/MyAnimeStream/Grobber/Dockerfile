FROM tiangolo/uwsgi-nginx-flask:python3.6

COPY ./grobber /app/grobber
COPY ./.docker/uwsgi.ini /app/
COPY ./.docker/grobber.conf /etc/nginx/conf.d/

COPY ./requirements.txt ./
RUN pip install -r requirements.txt