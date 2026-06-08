# IR4-SiteGuard

Laravel + React site safety platform (web dashboard, AI assistant, camera ingest API).

## Setup

```bash
composer install
cp .env.example .env
php artisan key:generate
npm install
npm run build
php artisan migrate
```

## Notes

- `Mobile/` and `node_modules/` are excluded from this repository.
- Configure environment values in `.env` before running the app.
