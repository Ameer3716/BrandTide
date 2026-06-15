# BrandTide Automated Testing Documentation

This document provides a comprehensive technical overview of the automated testing infrastructure implemented for the BrandTide application, covering the Frontend (React), Backend (Node.js/Express), and Machine Learning Service (Python/FastAPI).

---

## 🛠 Technologies and Tools Used

### 1. **Vitest (Frontend & Backend Test Runner)**
Vitest is a blazing fast testing framework powered by Vite. We selected it over traditional tools like **Jest** because it natively understands modern ES Modules (ESM) and TypeScript without requiring complex Babel configurations. It shares the same configuration as our Vite frontend, ensuring that tests run in the exact same environment as the application.
- **Usage**: Used to run all tests in the `brandtide` (Frontend) and `server` (Backend) directories.
- **Reporting**: Configured to output both standard console traces and machine-readable JSON reports (`--reporter=json`) for the dashboard widget.

### 2. **React Testing Library (Frontend UI Testing)**
React Testing Library (`@testing-library/react`) is a utility for testing React components in a way that resembles how users interact with them. Instead of testing implementation details (like component state), it queries the DOM for text, roles, and labels.
- **Usage**: Used to mount components, simulate user clicks/typing, and assert that the correct HTML elements are visible on the screen.

### 3. **Pytest (ML-Service Test Runner)**
Pytest is the industry standard testing framework for Python. It provides simple, scalable testing with powerful fixture support.
- **Usage**: Used to test the FastAPI application in the `ml-service` directory.
- **Plugins**: Used `pytest-json-report` to automatically generate `ml-report.json` for dashboard integration.

### 4. **FastAPI TestClient (ML-Service Integration Testing)**
A utility built into FastAPI (powered by `httpx`) that allows you to send simulated HTTP requests to your Python API without actually spinning up a live network server.

### 5. **Mocking Strategies (Critical Infrastructure)**
To ensure tests are fast, deterministic, and can run in CI/CD environments without external dependencies, heavy mocking was implemented:
- **`vi.mock()`**: Used in Vitest to intercept imports.
- **Mongoose Mocking (Backend)**: We completely intercepted `User.find()`, `Review.aggregate()`, etc., using custom chainable mock objects. This allows backend tests to run in milliseconds without requiring a live MongoDB database.
- **FakeTorch (Python ML)**: We injected a custom `FakeTorch` and `MagicMock` class into `sys.modules['torch']` before the ML app imports them. This tricks the app into thinking PyTorch and HuggingFace are installed, avoiding the downloading of the 2.5GB `XLM-RoBERTa` model during tests!

---

## 🧪 Detailed Test Cases Breakdown

### 1. Frontend Tests (20 Tests Total)
**Location**: `brandtide/src/__tests__/`

#### Pages Tested
- **Landing Page (`Landing.test.tsx`)**: Ensures the Hero section, Features matrix, Pricing tiers, and Call-to-Action components render correctly for unauthenticated users.
- **Dashboard Page (`Dashboard.test.tsx`)**: Validates that the primary Metric Cards, Sentiment Donut Chart, and the `TestReportSummary` components are visible and handle data structures.
- **Batch Processing Page (`Batch.test.tsx`)**: Tests the rendering of the upload zone, mapping configuration UI, and the data table.
- **Insights Page (`Insights.test.tsx`)**: Validates the rendering of AI-generated insights and trend graphs.
- **Reviews Page (`Reviews.test.tsx`)**: Tests the review list and sentiment filtering UI.
- **Auth Pages (`Login.test.tsx` / `Register.test.tsx`)**: Ensures form inputs exist, submit buttons are clickable, and validation paths are accessible.

#### Components Tested
- **`Badge.test.tsx`**: Tests conditional class generation for "success", "error", and "warning" badge colors.
- **`DataTable.test.tsx`**: Tests pagination controls, column header rendering, and row data mapping.
- **`GlassCard.test.tsx`**: Validates that children elements are correctly encapsulated within the translucent frosted-glass styling.
- **`MetricCard.test.tsx`**: Tests value formatting and the conditional red/green rendering of positive/negative delta arrows.
- **`Skeleton.test.tsx`**: Ensures loading states render without throwing errors.
- **`TopicChip.test.tsx`**: Validates topic pill UI generation.

---

### 2. Backend API Tests (20 Tests Total)
**Location**: `server/src/__tests__/controllers/`

#### Controllers & APIs Tested
- **Auth Controller (`authController.test.js`)**:
  - `POST /api/auth/register`: Tests the "user already exists" check (returns 400), and validates successful user creation and JWT token dispatch.
  - `POST /api/auth/login`: Tests password comparison using mocked `comparePassword` and ensures valid credentials return a 200 status with a token.
- **Data Controller (`dataController.test.js`)**:
  - `GET /api/data/metrics` & `GET /api/data/trend`: Tests complex Mongoose `aggregate()` chains, ensuring the controller properly passes the data payload.
- **Schedule Controller (`scheduleController.test.js`)**:
  - `POST /api/schedules`: Tests schedule creation.
  - `PATCH /api/schedules/:id/toggle`: Tests enabling/disabling automated reporting.
  - *Note*: We mocked the `utils/email.js` Nodemailer transporter to prevent the test suite from accidentally sending real emails.
- **Review Controller (`reviewController.test.js`)**:
  - `GET /api/reviews/recent`: Tests fetching reviews tied to a user context, mocking `Review.find().sort().limit()`.
- **Stripe Controller (`stripeController.test.js`)**:
  - `POST /api/stripe/create-checkout-session`: Tests that the API validates the presence of the `STRIPE_PRICE_PRO` environment variable before initializing a checkout session.
  - `POST /api/stripe/webhook`: Tests webhook event signatures and simulated Stripe payload handling.
- **Dashboard / Agent Controllers (`dashboardController.test.js`, `agentController.test.js`)**:
  - Tests the formatting of AI-generated insights and recent system activities.

---

### 3. ML-Service Tests (6 Tests Total)
**Location**: `ml-service/test_app.py`

#### Endpoints Tested
- **`test_health` (`GET /health`)**:
  - Verifies that the API spins up correctly and confirms that the model state is labeled as "loaded".
- **`test_predict_single` (`POST /predict`)**:
  - Sends a mock text payload to the model. The custom `MockModel` intercepts it and returns a fake tensor array favoring the "neutral" class. The test validates that the JSON response structure is intact and the `label` mapping matches.
- **`test_predict_batch` (`POST /predict/batch`)**:
  - Tests processing arrays of text. Ensures the length of the returned array matches the input payload size.
- **`test_predict_batch_extra_fields`**:
  - **Crucial Test**: Validates "passthrough" logic. Ensures that if a user uploads a CSV with custom columns (e.g., `ReviewID`, `Date`), those columns are successfully returned untouched alongside the new `sentiment` prediction.
- **Validation Tests (`test_predict_empty_text`, `test_predict_batch_empty_array`)**:
  - Verifies that FastAPI's Pydantic schemas correctly reject empty payloads with a `422 Unprocessable Entity` status.

---

## 🔄 CI/CD Pipeline Integration (GitHub Actions)

To ensure this testing suite provides continuous value, a GitHub Actions workflow (`.github/workflows/test.yml`) was implemented.

**How it works:**
1. **Trigger**: Runs automatically on every push to the `main` branch.
2. **Setup**: Provisions an Ubuntu runner, installing Node.js `20.x` and Python `3.10`.
3. **Execution**:
   - Injects temporary Environment Variables (`JWT_SECRET`, `STRIPE_PRICE_PRO`, etc.) so controllers don't crash.
   - Runs `npm run test:report` for Frontend and Backend.
   - Runs `python -m pytest` for the ML-Service.
4. **Artifact Generation & Deployment**:
   - The test runners generate `frontend-report.json`, `backend-report.json`, and `ml-report.json`.
   - The GitHub Action executes a `git commit` to push these JSON files directly into the `brandtide/public/` directory.
   - Vercel automatically deploys the updated repository, allowing the `TestReportSummary.tsx` React component on your Dashboard to read these fresh files and display live CI/CD results!
