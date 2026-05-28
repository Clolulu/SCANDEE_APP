# Scandee QR Marketplace

A mobile-first PWA platform connecting foreign tourists and small Thai vendors through QR-driven store access, Omise payment integration, and PIN pickup verification.

## Architecture

- Backend: Python, Django, Django REST Framework, PostgreSQL, JWT authentication
- Frontend: Next.js, Tailwind CSS, PWA support
- Payments: Omise integration with tokenized charge flow
- Roles: Tourist, Vendor, Admin

## Folder structure

- `backend/` - Django API and payment integration
- `frontend/` - React/Next.js PWA UI

## Setup

### Backend

1. Create `.env` from `.env.example`
2. Install dependencies
   ```bash
   cd backend
   python -m venv venv
   venv\Scripts\activate
   pip install -r requirements.txt
   ```
3. Run migrations
   ```bash
   python manage.py migrate
   ```
4. Create superuser
   ```bash
   python manage.py createsuperuser
   ```
5. Start development server
   ```bash
   python manage.py runserver
   ```

### Frontend

1. Install dependencies
   ```bash
   cd frontend
   npm install
   ```
2. Start development server
   ```bash
   npm run dev
   ```

### Docker (optional)

1. Build and start containers
   ```bash
   docker compose up --build
   ```
2. Backend API: `http://localhost:8000`
3. Frontend PWA: `http://localhost:3000`

## API endpoints

- `POST /api/auth/register/tourist/`
- `POST /api/auth/register/vendor/`
- `POST /api/auth/login/`
- `POST /api/auth/refresh/`
- `GET /api/store/vendor/{vendor_id}/`
- `GET /api/store/products/`
- `POST /api/store/products/`
- `GET /api/store/orders/`
- `POST /api/store/orders/`
- `POST /api/payments/charge/`
- `POST /api/payments/webhook/`

## Notes

- Omise card data is tokenized in the frontend, and the backend only stores charge IDs and statuses.
- Vendor QR code paths are generated as `/store/{vendor_id}`.
- PIN verification is implemented on the order endpoint and updates order status to `COMPLETED`.
