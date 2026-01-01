# ビルドステージ
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app

# Maven Wrapperとpom.xmlをコピー
COPY mvnw .
COPY mvnw.cmd .
COPY .mvn .mvn
COPY pom.xml .

# 依存関係をダウンロード（キャッシュを活用）
RUN ./mvnw dependency:go-offline -B

# ソースコードをコピーしてビルド
COPY src ./src
RUN ./mvnw clean package -DskipTests -B

# ランタイムステージ
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# netcatをインストール（healthcheck用）
RUN apk add --no-cache netcat-openbsd

# ビルドしたJARファイルをコピー
COPY --from=build /app/target/*.jar app.jar

# データベースファイル用のディレクトリを作成
RUN mkdir -p /app/data

# ポートを公開
EXPOSE 8080

# アプリケーションを起動
ENTRYPOINT ["java", "-jar", "app.jar"]

