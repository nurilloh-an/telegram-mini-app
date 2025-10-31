# Build stage
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

ARG VITE_BACKEND_URL
ARG VITE_BACKEND_API_PREFIX
ARG VITE_ADMIN_TELEGRAM_IDS
ARG VITE_FAKE_TELEGRAM_ID

ENV VITE_BACKEND_URL=${VITE_BACKEND_URL}
ENV VITE_BACKEND_API_PREFIX=${VITE_BACKEND_API_PREFIX}
ENV VITE_ADMIN_TELEGRAM_IDS=${VITE_ADMIN_TELEGRAM_IDS}
ENV VITE_FAKE_TELEGRAM_ID=${VITE_FAKE_TELEGRAM_ID}

RUN npm run build

# Production stage
FROM nginx:1.25-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
