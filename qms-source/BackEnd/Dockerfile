FROM node:20

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app/backend

COPY pnpm-lock.yaml* package.json ./

RUN pnpm install

COPY . .

EXPOSE 5000

CMD [ "pnpm", "dev" ]
