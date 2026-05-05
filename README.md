# Conduz Brasil — Marketplace de Autoescolas e Instrutores de Trânsito

> A full-stack marketplace connecting driving students with certified instructors and driving schools across Brazil.

---

## What is Conduz Brasil?

Conduz Brasil is a two-sided marketplace platform that simplifies how Brazilians find, book, and manage driving lessons. Students discover nearby instructors on an interactive map, schedule lessons on a calendar, track their CNH journey, and pay via Mercado Pago. Instructors and driving schools get a full business dashboard — appointments, financials, vehicle management, and student communication — in one place.

---

## Features

### For Students
- **Instructor discovery** — Browse and filter instructors by location, price, and rating
- **Interactive map** — Find instructors near you with Leaflet.js embedded maps
- **Calendar scheduling** — Book and manage lessons with a visual calendar
- **CNH Journey tracker** — Track progress toward getting a driver's license
- **Practice test simulator** — Prepare for the theory exam
- **Favorites** — Save preferred instructors
- **Real-time messaging** — Chat directly with instructors
- **Refund management** — Request and track refunds

### For Instructors & Driving Schools
- **Appointment management** — Full calendar view of scheduled lessons
- **Financial dashboard** — Balance tracking, withdrawal requests, transaction history
- **Vehicle management** — Register multiple vehicles with pricing per category
- **Media gallery** — Upload lesson documentation and proof of completion
- **Instructor roster** — Driving schools manage multiple instructors
- **Review management** — View and respond to student ratings
- **Check-in system** — QR code generation for lesson confirmation
- **Subscription plans** — Tiered plans with Mercado Pago billing

### System Admin
- **Instructor approval workflow** — Review, approve, or reject instructor registrations
- **Document verification** — Validate instructor credentials and vehicle docs
- **Dispute & complaint management** — Handle refund disputes and reports
- **Audit logs** — Full activity trail across the platform
- **Platform settings** — Global configuration controls

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite 5 |
| Routing | React Router DOM v6 |
| Styling | Tailwind CSS 3, shadcn/ui, Radix UI |
| Animations | Framer Motion |
| State / Data | TanStack Query v5, React Hook Form, Zod |
| Backend | Supabase (PostgreSQL, Auth, Storage, Realtime) |
| Payments | Mercado Pago (cards, subscriptions, refunds) |
| Maps | Leaflet.js + Google Maps (directions) |
| Charts | Recharts |
| Testing | Playwright |

---

## Integrations

- **Mercado Pago** — Card tokenization, subscription billing, refund processing — Brazil's leading payment processor
- **Supabase** — Auth, PostgreSQL database with RLS, Storage, Realtime for messaging
- **Leaflet.js** — Embedded interactive maps for instructor discovery
- **Google Maps** — Directions linking from lesson locations

---

## Project Structure

```
src/
├── pages/            # Route-level page components
│   ├── aluno/        # Student portal (dashboard, aulas, calendario, favoritos…)
│   ├── admin/        # Instructor/school dashboard (agendamentos, financeiro…)
│   ├── system-admin/ # Platform admin panel (pendentes, auditoria, disputas…)
│   └── marketplace/  # Public instructor discovery
├── components/       # Shared UI components
├── hooks/            # Data fetching and state hooks
├── lib/              # Utilities and Supabase client
└── integrations/
    └── supabase/     # Auto-generated DB types + client singleton

supabase/
└── migrations/       # PostgreSQL schema migrations
```

---

## Key Routes

| Area | Route | Description |
|---|---|---|
| Public | `/marketplace` | Instructor discovery with filters |
| Public | `/mapa-instrutores` | Interactive instructor map |
| Public | `/instrutores/:id` | Instructor public profile |
| Student | `/aluno/dashboard` | Student home |
| Student | `/aluno/jornada` | CNH journey tracker |
| Student | `/aluno/simulado` | Theory exam simulator |
| Student | `/aluno/mensagens` | Messaging with instructors |
| Instructor | `/admin/agendamentos` | Appointment calendar |
| Instructor | `/admin/financeiro` | Financial dashboard |
| Instructor | `/admin/veiculos` | Vehicle management |
| Admin | `/system-admin/pendentes` | Instructor approval queue |
| Admin | `/system-admin/auditoria` | Audit logs |

---

## Local Development

```bash
npm install       # Install dependencies
npm run dev       # Start dev server
npm run build     # Production build
npx playwright test  # Run e2e tests
```

Requires a `.env` file (see `.env.example`) with:
- `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`

---

## Author

Built by [Raffael Ramalho Rosa](https://github.com/raffaelramalhorosa) as lead developer for Conduz Brasil.
