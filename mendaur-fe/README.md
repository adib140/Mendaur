# Mendaur Frontend

Aplikasi frontend untuk sistem Mendaur - Platform Bank Sampah Digital.

## Tech Stack

- **Framework:** React 18 + Vite
- **Styling:** CSS Modules
- **Package Manager:** pnpm

## Setup Instructions

### Prerequisites

- Node.js >= 18
- pnpm

### Installation

```bash
# Clone repository
git clone https://github.com/Adib121140210/mendaur-frontend.git
cd mendaur-frontend

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

### Environment Variables

Buat file `.env.local` di root folder:

```env
VITE_API_URL=http://127.0.0.1:8000/api
```

## API Configuration

| Environment | Base URL |
|-------------|----------|
| Development | `http://127.0.0.1:8000/api` |
| Production  | `https://api.mendaur.id/api` |

## Test Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@mendaur.id | password123 |
| Superadmin | superadmin@mendaur.id | password123 |
| Demo | demo@mendaur.id | demo123 |
| Nasabah | rina@gmail.com | password123 |

> **Note:** Leaderboard hanya menampilkan nasabah (role_id=1). Admin dan Superadmin tidak muncul di leaderboard.

## Available Scripts

```bash
pnpm dev      # Start development server
pnpm build    # Build for production
pnpm preview  # Preview production build
pnpm lint     # Run ESLint
```

## Project Structure

```
src/
├── Components/
│   ├── Pages/          # Page components
│   ├── Layouts/        # Layout components
│   └── ...
├── services/           # API services
├── hooks/              # Custom hooks
├── utils/              # Utility functions
└── main.jsx            # Entry point
```

## License

Private - All Rights Reserved
