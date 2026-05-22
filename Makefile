.PHONY: up down restart logs shell-backend shell-db db-reset

up:
	docker compose up -d --build

down:
	docker compose down

restart:
	docker compose restart

logs:
	docker compose logs -f

shell-backend:
	docker compose exec backend bash

shell-db:
	docker compose exec db mariadb -u root -proot ecommerce_b2b

db-reset:
	docker compose down -v
	docker compose up -d --build
