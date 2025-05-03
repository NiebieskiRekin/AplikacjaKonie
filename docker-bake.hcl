group "all" {
  targets = ["production-backend", "production-frontend"]
}

target "production-backend" {
  context = "."
  dockerfile = "Dockerfile"
  tags = ["ghcr.io/niebieskirekin/aplikacjakonie-backend:main"]
}

target "production-frontend" {
  context = "."
  dockerfile = "Dockerfile"
  tags = ["ghcr.io/niebieskirekin/aplikacjakonie-frontend:main"]
}