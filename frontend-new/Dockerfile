FROM node:20

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app/frontend

COPY pnpm-lock.yaml* package.json ./

RUN pnpm install

COPY . .

EXPOSE 3000

CMD ["pnpm", "dev"]