# Stage 1: Build the shadow JAR
FROM gradle:8.7-jdk21 AS build
WORKDIR /app
COPY build.gradle settings.gradle ./
COPY src/ src/
RUN gradle shadowJar --no-daemon

# Stage 2: Run - v2FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
RUN apk add --no-cache wget \
		&& addgroup -S sentra \
		&& adduser -S sentra -G sentra
COPY --from=build /app/build/libs/sentra-backend.jar sentra-backend.jar

# Render provides PORT via env; bind to 0.0.0.0 so the container is reachable
ENV HOST=0.0.0.0
ENV PORT=10000
ENV APP_ENV=production

RUN chown -R sentra:sentra /app
USER sentra

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
	CMD wget -qO- "http://127.0.0.1:${PORT}/api/health" > /dev/null || exit 1

EXPOSE 10000
CMD ["java", "-jar", "sentra-backend.jar"]
