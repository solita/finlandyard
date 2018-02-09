FROM node

RUN git clone https://github.com/solita/finlandyard.git

RUN cd finlandyard && npm install

EXPOSE 8080 8000

ENTRYPOINT cd finlandyard && npm run dev+proxy
