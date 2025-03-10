# Optimizing docker images

```bash
docker compose build
mint build --compose-file=docker-compose.yml --dep-exclude-compose-svc-all --compose-env-file=.env --http-probe=false aplikacja-konie-backend
mint build --compose-file=docker-compose.yml --dep-exclude-compose-svc-all --compose-env-file=.env aplikacja-konie-frontend 
```
