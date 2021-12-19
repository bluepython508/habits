# syntax=docker/dockerfile:1
FROM node:16 AS node
WORKDIR /app
COPY client/ /app/
RUN --mount=type=cache,target=/app/node_modules yarn install --prod && yarn build

FROM instrumentisto/rust:nightly-2021-12-09 as rust
WORKDIR /app
RUN apt-get update && apt-get install sqlite3 && apt-get clean
# Force cargo to update index - lazy_static doesn't have a binary, so will fail, but only after updating index
RUN cargo install lazy_static || true
COPY server/ /app/
RUN --mount=type=cache,target=/app/target cargo build --release -Z no-index-update  && cp /app/target/release/server /app/server

FROM debian:buster-slim AS final
WORKDIR /app
COPY --from=node /app/build /app/build
COPY --from=rust /app/server /app/server
EXPOSE 80
ENV ROCKET_ADDRESS 0.0.0.0
ENV ROCKET_PORT 80
CMD ["/app/server"]