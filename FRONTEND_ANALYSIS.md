# FINSHIELD FRONTEND - Architecture & Code Flow Analysis

## 📋 Overview

FinShield Frontend is a **Next.js 15** application built with **React 19**, **TypeScript**, and **Tailwind CSS**. It serves as the user interface for the FinShield platform, providing distinct portals for Platform Admins (Super Admin, Auditor, Regulator) and Company Users (Managers, Employees).

**Tech Stack:**

-   **Framework:** Next.js 15 (App Router)
-   **Library:** React 19
-   **Language:** TypeScript
-   **Styling:** Tailwind CSS + Shadcn UI
-   **Icons:** Lucide React
-   **State Management:** React Query (TanStack Query) + React Context
-   **Form Handling:** React Hook Form + Zod
-   **HTTP Client:** Axios
-   **Charts:** Recharts

---

## 🏗️ Architecture Overview

The application follows a **feature-based modular architecture** within the Next.js App Router structure.

### **Core Design Patterns**

1.  **Server vs. Client Components:**
    -   **Server Components:** Used for initial layouts and static parts (where possible).
    -   **Client Components:** Used heavily for interactive dashboards, tables, and form inputs (`"use client"`).

2.  **Service Repository Pattern:**
    -   API calls are abstracted into `services/` (e.g., `invoice.service.ts`).
    -   Components never call `axios` directly; they use **Custom Hooks**.

3.  **Data Fetching Layer:**
    -   **Custom Hooks** (`hooks/`) wrap `useQuery` calls.
    -   Hooks allow toggling between **Real API** and **Mock Data** (`lib/mock-data.ts`) transparently during development.

---

## 📁 Folder Architecture & Responsibilities

### **1. `/app` - Routes & Pages**

The `app` directory is organized by **Portal** and **Role** to enforce separation of concerns.

```
app/
├── (auth)/                 # Authentication routes (Login, etc.)
│   ├── login/
│   └── layout.tsx          # Auth layout
├── admin/                  # Platform Portal
│   ├── super-admin/        # Super Admin specific pages
│   ├── auditor/            # Auditor specific reviews
│   └── regulator/          # Regulator compliance views
├── company/                # Company Portal
│   ├── manager/            # Manager dashboards (Employee mgmt)
│   └── employee/           # Employee views (Uploads)
├── layout.tsx              # Root layout (Fonts, Providers)
└── page.tsx                # Landing page redirect
```

**Key Flow:**
-   `layout.tsx` wraps the app in `providers.tsx` (QueryClientProvider, AuthProvider).
-   Role-based folders (`/admin/super-admin`, `/company/manager`) often have their own `layout.tsx` to render specific sidebars and topbars.

### **2. `/components` - UI Library**

-   **`/ui`**: Atomic, reusable components (Button, Card, Input) primarily from Shadcn UI.
-   **`/common`**: Shared business components (`StatusBadge`, `BackButton`).
-   **`/invoices`**: specific components like `InvoiceTable`, `InvoiceUploadForm`.
-   **`/dashboard`**: Widgets like `RecentActivity`, `StatsCard`.
-   **`/layout`**: Structural components (`Sidebar`, `TopBar`).

### **3. `/hooks` - Logic & Data Layer**

Hooks are the bridge between UI and Data.

| Hook Directory | Purpose |
| :--- | :--- |
| `auth/` | `useAuth`, `useLogin` - Authentication state and actions. |
| `invoices/` | `useAuditorInvoices`, `useRegulatorInvoices` - Fetching and filtering invoices for specific roles. |
| `blockchain/` | `useRegulatorBlockchain` - Simulates or fetches blockchain ledger data. |
| `dashboard/` | `useManagerDashboard`, `useAuditorDashboard` - Aggregates stats for dashboards. |

**Example Hook Pattern:**
```typescript
export function useAuditorInvoices() {
    // 1. Fetch data (handling loading/error)
    const { data } = useQuery({ queryKey: ['invoices'], queryFn: InvoiceService.getAll });
    
    // 2. Client-side filtering/sorting logic
    const filtereddata = useMemo(() => { ... }, [data, filters]);

    // 3. Return view-model for component
    return { invoices: filteredData, ...controls };
}
```

### **4. `/services` - API Integration**

Axios instances configured with interceptors for JWT token injection.

-   `api-client.ts`: Base axios instance.
-   `auth.service.ts`: Login, Logout, Refresh Token.
-   `invoice.service.ts`: Upload, fetch all, fetch by ID.

### **5. `/lib` - Utilities**

-   `types.ts`: TypeScript interfaces mirroring Backend models (`Invoice`, `User`, `Organization`).
-   `mock-data.ts`: Extensive static data used when the backend is unreachable or for prototyping.
-   `utils.ts`: Helper functions (Shadcn `cn` utility, formatters).

---

## 🔐 Authentication & Authorization Flow

### **Client-Side Auth State**

The `AuthProvider` (`context/auth-context.tsx`) manages the global user state.

1.  **Initial Load:** Checks for stored tokens (Cookies/LocalStorage).
2.  **Login:** Calls `AuthService.login()`, saves token, updates State.
3.  **Protection:** Middleware (`middleware.ts`) and Checkers inside `layout.tsx` verify if the user has the correct **Role** to view the current route.

```typescript
// Middleware Example
export function middleware(request: NextRequest) {
  const token = request.cookies.get('accessToken');
  if (!token && request.nextUrl.pathname.startsWith('/admin')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
}
```

---

## 🔄 Key Feature Implementation

### **Invoice Management (Frontend)**

1.  **Upload (Employee/Manager):**
    -   Uses `react-dropzone` or file input.
    -   Calls `InvoiceService.upload(formData)`.
    -   Optimistic updates or invalidates 'invoices' query to refresh list.

2.  **Review (Auditor):**
    -   `AuditorInvoicesPage` uses `useAuditorInvoices`.
    -   Table displays invoices with status badges.
    -   Clicking "Review" goes to details page.
    -   Details page shows **AI Analysis** (Visualized with risk score bars) and **Blockchain Verification** (Simulated hash display).

3.  **Blockchain Transparency (Regulator):**
    -   Dedicated view showing a "Ledger".
    -   Displays `txHash`, `blockTimestamp` from the invoice data.
    -   UI indicates "Verified on Blockchain" with green shields.

---

## 🚨 Current State & Analysis

### **Strengths**
-   **Clean Separation:** Logic is well-isolated in hooks, keeping UI components "dumb" and presentational.
-   **Type Safety:** Strong TypeScript usage reduces runtime errors (recently improved null safety).
-   **Responsive UI:** Tailwind + Shadcn ensures a modern, consistent look.
-   **Role Isolation:** Folder structure prevents code leakage between different user roles.

### **Areas for Attention**
-   **Mock Data Reliance:** The application is currently heavily relying on `mock-data.ts` for complex views (like Blockchain hooks). Full integration with the backend endpoints is the next critical step.
-   **Error Handling:** While `toast` is used, more granular error boundaries or fallback UIs for failed API calls could be added.
-   **Testing:** Currently lacks comprehensive Unit/E2E testing (Jest/Cypress).

---

## 🏁 Conclusion

The Frontend structure is **production-ready** in terms of architecture. It correctly mirrors the backend's layered approach and role-based security model. The immediate next phase is ensuring all Services connect to real backend endpoints and replacing the `mock-data` fallbacks with live data.
