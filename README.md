<div align="center">

# 🚛 Ceylon Freight — Digital Logistics Platform

A modern, full-stack freight and logistics platform built specifically for Sri Lanka using **React**, **TypeScript**, **Supabase**, and **TailwindCSS** — featuring role-based dashboards (Shipper/Driver), a 3D globe visualization, real-time load matching, and instant market rate calculations.

[![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Vite](https://img.shields.io/badge/Vite-5.0-646CFF?logo=vite&logoColor=white)](https://vitejs.dev)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

</div>

---

## ✨ Key Features

| Feature | Description |
|---|---|
| 🔐 **Role-Based Workflows** | Distinct authentication and dashboards for Shippers and Drivers |
| 🌍 **3D Globe Visualization** | Interactive 3D Earth rendered with React Three Fiber on the landing page |
| 🧮 **Instant Rate Calculator** | Dynamic freight cost estimation based on district distances and truck types |
| 📦 **Load Posting System** | Comprehensive flow for shippers to post LTL/FTL cargo with precise requirements |
| 🚛 **Driver Load Board** | Marketplace for drivers to find, accept, and manage available shipments |
| 🔔 **Real-Time Notifications** | Instant updates powered by Supabase Realtime when a driver accepts a load |
| 📱 **Fully Responsive UI** | Accessible, mobile-first design built with standard shadcn/ui components |
| 🌙 **Dark Mode Support** | Seamless switching between light and dark themes |

---

## 🛠️ Tech Stack

<!-- <div align="center"> -->

| Category | Technologies |
|---|---|
| **Frontend** | React 18, TypeScript, HTML5 |
| **Styling & UI** | TailwindCSS, shadcn/ui (Radix), Lucide Icons |
| **Backend & Auth** | Supabase (PostgreSQL, Auth, Realtime, Storage, RLS) |
| **State Management** | React Query (@tanstack/react-query), Zustand |
| **3D Engine** | Three.js, React Three Fiber, React Three Drei |
| **Build Tool** | Vite 5 |

<!-- </div> -->

---

## 📁 Project Structure

```text
ceylon-freight/
├── public/                 # Static public assets
├── supabase/               # Supabase edge functions and migrations
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── ui/             # shadcn/ui primitive components
│   │   ├── Globe3D.tsx     # 3D Earth visualization component
│   │   ├── Navbar.tsx      # Main navigation layout
│   │   └── RouteCalculator.tsx # Price estimation logic
│   ├── hooks/              # Custom React hooks (useAuth, use-toast)
│   ├── integrations/       # Backend connections
│   │   └── supabase/       # Supabase client and TypeScript types
│   ├── lib/                # Shared utilities and helpers
│   ├── pages/              # Application Routes
│   │   ├── Auth.tsx        # Login & Signup
│   │   ├── Dashboard.tsx   # Shipper operations panel
│   │   ├── DriverDashboard.tsx # Driver load board
│   │   ├── PostLoad.tsx    # Cargo posting workflow
│   │   └── FindTrucks.tsx  # Truck discovery engine
│   ├── App.tsx             # Root routing component
│   └── main.tsx            # Application entry point
├── .env                    # Environment variables (ignored)
├── index.html
├── tailwind.config.ts
├── vite.config.ts
└── package.json
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18.x
- **npm** ≥ 9.x
- **Supabase Account** (For backend services)

### Installation

```bash
# Clone the repository
git clone https://github.com/PradeepSamarasinghe/ceylon-freight.git

# Navigate to the project
cd ceylon-freight

# Install dependencies
npm install
```

### Environment Configuration

Create a `.env` file in the root directory and add your Supabase credentials:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
```

### Run Locally

```bash
# Start the development server
npm run dev
```

The app will be available at `http://localhost:5173`

### Build for Production

```bash
npm run build
npm run preview
```

---

## 📸 Core Workflows

1. **Landing & Market Rates** — Estimate delivery costs between any two Sri Lankan districts.
2. **Onboarding** — Secure sign up and role selection (Shipper or Driver).
3. **Shipper Dashboard** — Post new loads, track active shipments, and manage history.
4. **Driver Dashboard** — View the live load board, accept jobs, and manage earnings.
5. **Real-time Engine** — Drivers accepting a load instantly trigger notifications to the respective shipper.

---

## 📬 Contact

<!-- <div align="center"> -->

| | |
|---|---|
| 📧 **Email** | [samarasinghepradeep242@gmail.com](mailto:samarasinghepradeep242@gmail.com) |
| 💼 **LinkedIn** | [linkedin.com/in/pradeep-samarasinghe](https://www.linkedin.com/in/pradeep-samarasinghe) |
| 🐙 **GitHub** | [github.com/PradeepSamarasinghe](https://github.com/PradeepSamarasinghe) |
| 📱 **Phone** | +94 77 568 9783 |

<!-- </div> -->

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

<div align="center">

**Designed & Developed by Pradeep Samarasinghe** ✨

</div>
