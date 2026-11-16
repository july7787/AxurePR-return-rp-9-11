FROM node:20-slim

WORKDIR /app
RUN npm install -g return_rp@1.4.4

CMD ["return_rp-mcp"]