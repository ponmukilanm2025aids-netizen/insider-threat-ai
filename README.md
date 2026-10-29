# AyurSutra (आयुर्सूत्र)
### AI-Powered Panchakarma Patient Management and Therapy Scheduling System
**Addressing Ministry of AYUSH Problem Statement SIH25023**

---

## 🌿 1. Overview & Problem Statement

In traditional Ayurvedic hospitals and Panchakarma treatment centers, clinical workflows often rely on fragmented paper records, manual scheduling registers, disconnected pharmacy inventories, and subjective progress tracking. 

**AyurSutra** is an integrated, full-stack digital healthcare platform designed specifically for Ayurvedic medical institutions. It replaces manual procedures with a unified clinical system covering:
- **Patient Management (Rogi Pariksha):** Demographic records, Ayurvedic constitution (Vata / Pitta / Kapha Dosha Prakriti), allergies, and medical history.
- **Conflict-Safe Scheduling:** Mathematical prevention of overlapping bookings for specialized treatment rooms (Dhara Droni, Bashpa Sweda chambers) and qualified therapists.
- **Explainable AI Slot Recommendation:** A hybrid scheduling engine pairing operational constraints (certification, workload balance, room setup) with a `scikit-learn` regressor prototype to suggest optimal conflict-free therapy slots.
- **Clinical Treatment Progress (Chikitsa Krama):** Multi-day Panchakarma regimen tracking, session attendance, vitals logging, pain scale reduction (VAS), and therapist/clinician notes.
- **Digital Prescriptions & Diet Plans (Pathya-Apathya):** Classical Ayurvedic formulations (Thailam, Kwatham, Churnam, Vati) with printable consultation receipts and dosha-specific nutrition schedules.
- **Dispensary & Pharmacy Inventory (Oushadha Bhandara):** Batch tracking for medicated oils, expiry alerts, and reorder threshold notifications.
- **Billing & Receipts (Dhana Lekha):** Transparent invoicing, itemized therapy sessions, GST calculations, and payment tracking.
- **Role-Based Access Control (RBAC):** Strict boundaries separating Admin, Doctor (Vaidya), Therapist, and Front Desk Receptionist duties.

---

## 🎨 2. Ayurvedic Kerala Wellness Design System

The application is styled with a Kerala Ayurveda visual identity:
- **Primary Color:** Deep Forest Green (`#244C3A`) – Reflecting healing nature and vitality.
- **Secondary Color:** Herbal Green (`#66856A`) – Symbolizing medicinal flora.
- **Background:** Warm Ivory (`#FAF7EF`) – Traditional parchment and unbleached cotton.
- **Accent Color:** Muted Antique Gold (`#B99756` / `#D4AF37`) – Highlighting prestige and purity.
- **Text:** Dark Earthy Brown (`#40372D`) – High-contrast readable typography.
- **Typography:** *Playfair Display* serif headings for authentic heritage elegance paired with *Plus Jakarta Sans* for clean clinical readability.

---

## 🛠️ 3. Technology Stack

### Frontend:
- **Framework:** React 19 + TypeScript (Vite)
- **Styling:** Tailwind CSS v4 with custom Ayurvedic design tokens
- **Routing:** React Router v7
- **Icons:** Lucide React
- **Data Visualization:** Recharts (Volume bar charts and therapy distribution pie charts)
- **Networking:** Axios with JWT request interceptors

### Backend:
- **API Framework:** Python FastAPI (async REST APIs, automatic OpenAPI Swagger documentation)
- **Data Validation:** Pydantic v2
- **ORM & Database:** SQLAlchemy ORM with PostgreSQL support and automatic SQLite zero-dependency local fallback
- **Authentication:** JWT (JSON Web Tokens) with secure bcrypt password hashing
- **Testing:** Pytest + FastAPI TestClient test suite

### AI Scheduling Prototype:
- **Framework:** Python `scikit-learn` & `numpy`
- **Module:** Hybrid Explainable Rule Engine + RandomForestRegressor operational efficiency prototype
- **Constraint Factors:** Therapist certification match, room apparatus compatibility, therapist daily workload balancing, and time-of-day fit

---

## 👥 4. Pre-Configured Demo Accounts (1-Click Login)

The system comes pre-seeded with realistic fictional hospital staff accounts for quick testing:

| Role | Name | Email | Password | Primary Permissions |
| :--- | :--- | :--- | :--- | :--- |
| **ADMIN** | Dr. K. S. Varma (Medical Director) | `admin@ayursutra.hospital` | `Password123!` | Complete access to all 14 modules, settings, billing, & audits |
| **DOCTOR** | Dr. Rajesh Krishnan (Senior Vaidya) | `doctor@ayursutra.hospital` | `Password123!` | Patient diagnosis, Panchakarma regimens, digital prescriptions, & diet plans |
| **THERAPIST** | Suresh Nair (Lead Therapist) | `therapist@ayursutra.hospital` | `Password123!` | Daily therapy schedule, session attendance, vitals, & pain relief notes |
| **RECEPTIONIST** | Pooja Menon (Front Desk) | `reception@ayursutra.hospital` | `Password123!` | Patient registration, appointment bookings, invoices, & payment receipts |

*Note: In the login portal, simply click any of the "1-Click Demo Profiles" to automatically fill credentials.*

---

## 🚀 5. Getting Started & Installation

### Option A: Local Development (Quickest Setup)

#### 1. Clone or Open the Repository:
```bash
git clone <repository_url>
cd pancharma-ds
```

#### 2. Start the Backend:
```bash
# Activate Python virtual environment
# Windows:
.\venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install requirements (if setting up fresh environment)
pip install -r backend/requirements.txt

# Run database seed (auto-seeds fictional patients, doctors, therapies, appointments)
python -m backend.app.scripts.seed_data

# Launch FastAPI backend server
uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```
The backend API is now running at `http://127.0.0.1:8000` with interactive Swagger docs at `http://127.0.0.1:8000/docs`.

#### 3. Start the Frontend:
In a separate terminal window:
```bash
cd frontend
npm install
npm run dev
```
The React frontend is now live at `http://localhost:5173`.

---

### Option B: Docker Compose (Full Stack with PostgreSQL)

To run the complete system with a dedicated PostgreSQL database container:

```bash
# From the root directory:
docker-compose up --build
```
This spins up:
- **PostgreSQL Database:** Port `5432` with persistent storage volume
- **FastAPI Backend:** Port `8000`
- **React Frontend:** Port `3000` (production nginx container)

---

## 🧪 6. Automated Testing

### Backend Unit & Integration Tests:
Run the comprehensive `pytest` suite covering authentication, patient CRUD, appointment conflict detection, AI slot recommendations, billing calculations, and inventory stock deductions:

```bash
# Windows PowerShell:
$env:PYTHONPATH="."
.\venv\Scripts\pytest backend/app/tests/test_ayursutra.py -v
```
**Test Coverage Includes:**
- `test_health_check`
- `test_auth_login_success` & `test_auth_login_invalid_password`
- `test_demo_accounts_endpoint`
- `test_patient_crud` (Create, Read, Update, Search, Delete)
- `test_appointment_therapist_scheduling_conflict` (Verifies HTTP 409 Conflict rejection when booking an overlapping therapist session)
- `test_appointment_room_scheduling_conflict` (Verifies HTTP 409 Conflict rejection when booking an overlapping treatment room)
- `test_ai_scheduling_recommender` (Verifies explainable slot scores and conflict-free guarantees)
- `test_inventory_usage_and_alert` (Verifies stock deductions and low-stock threshold triggers)
- `test_billing_invoice_creation_and_payment` (Verifies invoice itemization and payment settlement)
- `test_dashboard_stats` (Verifies live KPI aggregations from database)

### Frontend Build Validation:
```bash
cd frontend
npm run build
```
Validates TypeScript types and generates production bundles with 0 compilation errors.

---

## 📁 7. Project Architecture

```
ayursutra/
├── backend/
│   ├── app/
│   │   ├── api/                 # REST Routers (auth, patients, appointments, billing, etc.)
│   │   │   ├── auth.py
│   │   │   ├── patients.py
│   │   │   ├── doctors_therapists.py
│   │   │   ├── therapies_rooms.py
│   │   │   ├── appointments.py
│   │   │   ├── scheduling_ai.py
│   │   │   ├── clinical.py
│   │   │   ├── billing.py
│   │   │   ├── inventory.py
│   │   │   ├── reports.py
│   │   │   ├── notifications.py
│   │   │   └── deps.py
│   │   ├── core/                # Database engine, security, JWT, config
│   │   │   ├── config.py
│   │   │   ├── security.py
│   │   │   └── database.py
│   │   ├── models/              # SQLAlchemy ORM Models
│   │   ├── schemas/             # Pydantic validation schemas
│   │   ├── services/            # Conflict detection & AI slot ranker
│   │   │   ├── scheduling_service.py
│   │   │   └── ai_scheduling_service.py
│   │   ├── scripts/             # Demonstration seed data generator
│   │   │   └── seed_data.py
│   │   ├── tests/               # Pytest automated test suite
│   │   │   └── test_ayursutra.py
│   │   └── main.py              # FastAPI entry point & lifespan handler
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/          # Reusable UI widgets, badges, sidebar, header
│   │   ├── context/             # AuthContext and demo switcher
│   │   ├── layouts/             # MainLayout with collapsible navigation
│   │   ├── pages/               # 14 Clinical and administrative pages
│   │   │   ├── auth/            # LoginPage
│   │   │   ├── dashboard/       # DashboardPage
│   │   │   ├── patients/        # PatientsPage
│   │   │   ├── appointments/    # AppointmentsPage
│   │   │   ├── doctors/         # DoctorsTherapistsPage
│   │   │   ├── therapies/       # TherapiesCatalogPage
│   │   │   ├── progress/        # TreatmentProgressPage
│   │   │   ├── prescriptions/   # PrescriptionsPage
│   │   │   ├── diet/            # DietPlansPage
│   │   │   ├── billing/         # BillingPage
│   │   │   ├── inventory/       # InventoryPage
│   │   │   ├── reports/         # ReportsPage
│   │   │   ├── notifications/   # NotificationsPage
│   │   │   └── settings/        # SettingsPage
│   │   ├── services/            # Axios API service client
│   │   ├── types/               # TypeScript interfaces
│   │   ├── App.tsx              # React Router configuration
│   │   └── index.css            # Ayurvedic design system tokens
│   ├── package.json
│   ├── vite.config.ts
│   └── Dockerfile
├── docker-compose.yml           # Multi-container deployment configuration
├── .env.example                 # Environment configuration template
└── README.md                    # Project documentation
```

---

## 📜 8. Clinical & Legal Disclaimer

*AyurSutra is developed as an engineering prototype addressing the Ministry of AYUSH Problem Statement SIH25023. All therapy durations, procedural prices, drug formulations, and scheduling scores are provided for demonstration purposes. Prescriptions and intensive Panchakarma procedures (such as Vamana and Virechana) require clinical assessment and authorization by qualified, registered Ayurvedic Medical Practitioners.*
