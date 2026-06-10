# DR.AYAZHAN Backend

Node.js + Express + PostgreSQL backend for the DR.AYAZHAN clinic app.

## Құрылым

```text
dr-ayazhan-backend/
  src/
    app.js
    server.js
    config/
    controllers/
    db/
    middleware/
    routes/
    utils/
  database/
    schema.sql
    seed.sql
    reset.sql
  .vscode/
  Dockerfile
  render.yaml
```

Бұл бір `index.js` емес. Route, controller, middleware және database бөлек жасалған.

## Жергілікті іске қосу

1. PostgreSQL ішінде база ашыңыз:

```bash
createdb dr_ayazhan
```

2. `.env.example` файлын `.env` деп көшіріп, `DATABASE_URL` және `JWT_SECRET` мәндерін қойыңыз.

3. Пакеттерді орнатыңыз:

```bash
npm install
```

4. Database schema және seed қосыңыз:

```bash
npm run db:schema
npm run db:seed
```

5. Серверді қосыңыз:

```bash
npm run dev
```

API: `http://localhost:4000`

## Дайын login деректері

Admin:

```text
login: admin
password: admin123
```

Doctors:

```text
login: ayazhan
password: doctor123

login: madina
password: doctor123

login: nurbolat
password: doctor123
```

Client қолданушыны `/api/auth/register` арқылы тіркейсіз.

## Негізгі endpoint-тер

```text
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me

GET    /api/doctors
GET    /api/doctors/:id
POST   /api/doctors          admin only
PATCH  /api/doctors/:id      admin only
DELETE /api/doctors/:id      admin only

GET    /api/services
POST   /api/services         admin only

GET    /api/appointments
GET    /api/appointments/slots?doctorId=...&date=2026-06-10
POST   /api/appointments     client only
PATCH  /api/appointments/:id/status
```

Protected endpoint-терге header қосылады:

```text
Authorization: Bearer YOUR_TOKEN
```

## Render deploy

1. Render-де PostgreSQL database жасаңыз.
2. Бұл project-ті GitHub-қа push жасаңыз.
3. Render Web Service ашып, repo таңдаңыз.
4. Environment variables:

```text
NODE_ENV=production
DATABASE_URL=Render PostgreSQL internal URL
JWT_SECRET=ұзын құпия мәтін
CORS_ORIGIN=https://your-frontend-domain.com
```

5. Build command:

```bash
npm install
```

6. Start command:

```bash
npm start
```

7. Render shell немесе local terminal арқылы database қосыңыз:

```bash
npm run db:schema
npm run db:seed
```

## Railway deploy

1. Railway-де PostgreSQL plugin қосыңыз.
2. Project variables ішіне `DATABASE_URL`, `JWT_SECRET`, `NODE_ENV=production` қойыңыз.
3. Deploy болғаннан кейін `npm run db:schema` және `npm run db:seed` орындаңыз.

## API мысалдары

Client register:

```bash
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"fullName\":\"Аружан Тест\",\"phone\":\"+77001234567\",\"password\":\"123456\"}"
```

Login:

```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"login\":\"admin\",\"password\":\"admin123\"}"
```

Book appointment:

```bash
curl -X POST http://localhost:4000/api/appointments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d "{\"doctorId\":\"DOCTOR_ID\",\"serviceId\":\"SERVICE_ID\",\"date\":\"2026-06-10\",\"time\":\"10:00\"}"
```
