# Stage 1: Build the application
FROM eclipse-temurin:21-jdk AS build

WORKDIR /app

COPY . .

# Give Maven Wrapper execute permission
RUN chmod +x mvnw

# Build the application
RUN ./mvnw clean package -DskipTests

# Stage 2: Create final lightweight image
FROM eclipse-temurin:21-jre

WORKDIR /app

COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]