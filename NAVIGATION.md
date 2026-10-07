# Navigation & Route Map

How the four panels are wired with the Next.js 16 App Router. The screens still
use `lib/data.ts` as their demo dataset, while the Prisma/PostgreSQL schema and
seed path provide the persistence layer for the backend migration.

## Route tree

```
app/
├── layout.tsx                 Root layout: fonts (next/font), icon font, <html>/<body>
├── page.tsx                   /            Panel chooser (temporary until auth)
├── not-found.tsx              Shown for unknown URLs and notFound() calls
│
├── employee/                  ── Employee panel ──
│   ├── layout.tsx             Header + icon dock (persists between pages)
│   ├── page.tsx               /employee                         Overview
│   ├── tickets/page.tsx       /employee/tickets                 My tickets (filter + search)
│   ├── tickets/new/page.tsx   /employee/tickets/new             4-step create wizard
│   ├── tickets/[ticketId]/page.tsx        /employee/tickets/TKT-8492       Subtasks, pass ticket, notes
│   ├── tickets/[ticketId]/edit/page.tsx   /employee/tickets/TKT-8492/edit  Same wizard, edit mode
│   ├── history/page.tsx       /employee/history                 Previous (closed) tickets
│   └── _components/           Private folder: not routable
│
├── admin/                     ── Admin panel ──
│   ├── layout.tsx             Top nav + icon dock + global search (<Form>)
│   ├── page.tsx               /admin                            Overview
│   ├── tickets/page.tsx       /admin/tickets?q=…&filter=…       Console (reads searchParams)
│   ├── tickets/[ticketId]/page.tsx   /admin/tickets/TKT-8492    Crew add/remove, controls, log
│   ├── employees/page.tsx     /admin/employees                  Add / remove employees
│   ├── clients/page.tsx       /admin/clients                    Clients & their jobs
│   └── reports/page.tsx       /admin/reports                    Progress reports
│
├── customer-care/             ── Customer care panel ──
│   ├── layout.tsx             Header nav + footer
│   ├── (desk)/                Route group: no URL segment
│   │   ├── layout.tsx         Search hub + ticket stream (stays mounted)
│   │   ├── page.tsx           /customer-care                    Dossier of most urgent ticket
│   │   └── tickets/[ticketId]/page.tsx  /customer-care/tickets/TKT-8492  Dossier only
│   ├── employees/page.tsx     /customer-care/employees          Directory, search by EMP ID
│   └── reports/page.tsx       /customer-care/reports            Progress & end dates
│
└── customer/                  ── Customer portal ──
    ├── layout.tsx             Header, status bar, footer
    ├── page.tsx               /customer                         Your jobs
    ├── jobs/[jobId]/page.tsx  /customer/jobs/JOB-8942 or demo-JOB-8942
    │                                                            Sub-task progress, team, docs
    └── jobs/[jobId]/bill/page.tsx  /customer/jobs/JOB-8942/bill Printable bill
```

## Patterns used

| Pattern | Where | Why |
| --- | --- | --- |
| **Nested layouts** | each panel's `layout.tsx` | The header and nav stay mounted, so only the page content swaps. Client state in the layout (an open mobile menu, for example) survives navigation. |
| **Active links via `usePathname`** | `components/nav-link.tsx` | Layouts don't re-render on navigation, so the highlight has to come from a client hook. `exact` and `exclude` handle nested routes like `/tickets` vs `/tickets/new`. |
| **Route group `(desk)`** | `customer-care/(desk)` | Lets `/customer-care` and `/customer-care/tickets/[id]` share the master list without the employees and reports pages getting it. Clicking a ticket swaps only the dossier, and the search text, filter, sort and page stay as they were. |
| **Dynamic segments + `generateStaticParams`** | all `[ticketId]` / `[jobId]` pages | Known tickets are pre-rendered at build time, so they prefetch fully and open instantly. Unknown IDs call `notFound()`. |
| **`params` / `searchParams` are Promises** | dynamic pages, `/admin/tickets` | Next 16 API: `const { ticketId } = await params`. Typed with the global `PageProps<'/route'>` helper (`npx next typegen`). |
| **URL as state + `next/form`** | admin header search, `/admin/tickets` | A GET `<Form>` navigates client-side to `/admin/tickets?q=…`, so results can be bookmarked and shared. |
| **Private folders `_components`** | every panel | Keeps each panel's UI next to its routes without creating URLs. |
| **Server pages → client islands** | e.g. `TicketWizard`, `TicketWorkspace`, `CrewManager`, `DeskShell` | Pages fetch and shape data on the server and pass plain props down. Only interactive parts ship JS. Server components can be passed *into* client ones as `children`/props (wizard sidebar, `TicketControls` children). |
| **`scroll={false}`** | customer-care ticket stream links | Picking a ticket doesn't jump the list back to the top. |

## Cross-panel flows (to wire to the backend later)

- **Customer care note → employee**: notes with "Visible to Employees" appear in the employee's ticket page under *Activity & Customer Care Notes* (`activity[].visibleToEmployees`).
- **Customer care priority request → admin**: `priorityRequests[]` show on the admin ticket page with Approve and Decline buttons.
- **Employee passes ticket**: changes `ownerId` (the holder). The holder shows up across all panels.
- **Customer report request / bill**: report requests go to customer care. Bills come from `ticket.billing`.

## Database

The PostgreSQL schema is in `prisma/schema.prisma`. It stores users,
customers, tickets, subtasks, attachments, activity, priority requests, and
billing. Each ticket receives a random `publicToken` with a unique database
constraint. The customer link is generated as
`NEXT_PUBLIC_APP_URL/customer/jobs/<publicToken>`, and the token can also be
resolved through `GET /api/jobs/<publicToken>`.

Copy `.env.example` to `.env`, set `DATABASE_URL`, then run:

```bash
npm run db:generate
npm run db:migrate -- --name init
npm run db:seed
```

The seed imports the existing demo employees, customers, and tickets. Existing
demo links use `demo-<jobId>` until the UI is switched fully to database reads.
