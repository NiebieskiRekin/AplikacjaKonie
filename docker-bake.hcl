group "default" {
  targets = ["production-backend", "production-frontend"]
}

target "production-backend" {
  context = "."
  dockerfile = "Dockerfile"
  target = "production-backend"
  tags = ["ghcr.io/niebieskirekin/aplikacjakonie-backend:main"]
  platforms = ["linux/amd64"]
  description = "Nodejs backend aplikacji dla hodowców koni i weterynarzy"
  labels = {
    "org.opencontainers.image.source" = "https://github.com/NiebieskiRekin/AplikacjaKonie"
  }
}

target "production-frontend" {
  context = "."
  dockerfile = "Dockerfile"
  target = "production-frontend"
  tags = ["ghcr.io/niebieskirekin/aplikacjakonie-frontend:main"]
  platforms = ["linux/amd64"]
  description = "React frontend aplikacji dla hodowców koni i weterynarzy"
  labels = {
    "org.opencontainers.image.source" = "https://github.com/NiebieskiRekin/AplikacjaKonie"
  }
}