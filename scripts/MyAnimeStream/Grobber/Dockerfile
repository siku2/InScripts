FROM tiangolo/uwsgi-nginx-flask:python3.6

COPY ./grobber /app/grobber
COPY ./.docker/uwsgi.ini /app/
COPY ./requirements.txt ./

ENV STATIC_INDEX 1
ENV STATIC_PATH /app/app/grobber/static

RUN pip install -r requirements.txt