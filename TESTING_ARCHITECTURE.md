# BrandTide Testing Architecture & Implementation

This document provides a comprehensive overview of the automated testing suite implemented across the BrandTide project. It covers the tools, mocking strategies, and CI/CD integrations used to achieve a robust, lightning-fast test environment.

---

## 1. High-Level Overview

We implemented **46 automated tests** spanning across the three major architectural layers of BrandTide:

1. **Frontend (React/Vite)**: 20 Tests
2. **Backend (Node.js/Express)**: 20 Tests
3. **ML-Service (Python/FastAPI)**: 6 Tests

All testing suites are seamlessly integrated into a centralized **GitHub Actions CI/CD Pipeline** that automatically executes on pushes to `main`. Test results are outputted to JSON reports, which are dynamically aggregated and displayed on the BrandTide Dashboard.

---

## 2. Frontend Testing Suite

### Tools & Technologies
- **Test Runner & Framework**: **Vitest** (Chosen over Jest for native ES Module support and seamless Vite integration).
- **DOM Testing**: **React Testing Library** (RTL) & `jsdom`.
- **Assertions**: `expect` (Chai-based, built into Vitest).

### Implementation Details
- **Environment Setup**: We configured a custom `setupTests.ts` file that globally mocks the `matchMedia` browser API (which is missing in `jsdom` but required by charting libraries like Recharts) and explicitly runs cleanup after each test.
- **Mocking Contexts & Providers**: Custom renderers were created to wrap components in `<BrowserRouter>` and mock `<AuthContext.Provider>`. This ensures UI components that depend on authentication state or routing hooks (`useNavigate`) render without crashing.
- **ES Module Mocking**: We utilized `vi.mock()` extensively to intercept and simulate backend API calls inside our `dataService` and `authService` modules, ensuring tests never hit the real backend and run instantaneously.
- **Reporting**: Configured to output a `frontend-report.json` using the built-in Vitest JSON reporter.

---

## 3. Backend API Testing Suite

### Tools & Technologies
- **Test Runner & Framework**: **Vitest**.
- **Mocking Strategy**: Complete database and external API isolation.

### Implementation Details
- **Mongoose / MongoDB Mocking**: Instead of spinning up an in-memory database like `mongodb-memory-server` (which is slow), we used **Vitest Spies & Mocks** to intercept Mongoose Model calls (e.g., `User.findOne`, `Review.aggregate`). 
  - *Technical Challenge*: Many Express controllers chain Mongoose commands (e.g., `Review.find().sort().limit()`). We solved this by creating a **custom chainable mock object** that intercepts `.sort()` and `.limit()` and simply returns `this` until resolution.
- **Stripe Webhook & API Mocking**: In `stripeController.test.js`, we used `vi.mock('stripe')` to intercept the creation of Checkout Sessions and the validation of Webhook signatures. We simulated different webhook events (`invoice.payment_succeeded`, `customer.subscription.deleted`) by constructing fake Stripe event objects in memory.
- **Email Service Mocking (Nodemailer)**: We mocked the `sendEmail` utility function to prevent Nodemailer from attempting to connect to an external SMTP server during CI/CD execution, ensuring it returns a simulated `messageId`.
- **Reporting**: Configured to output a `backend-report.json`.

---

## 4. ML-Service Testing Suite

### Tools & Technologies
- **Test Runner**: **Pytest**.
- **HTTP Client for Tests**: **FastAPI `TestClient`** (Powered by HTTPX).
- **Mocking Strategy**: Python `unittest.mock.MagicMock`.
- **Reporting**: `pytest-json-report` plugin.

### Implementation Details
- **The "Heavy Dependency" Challenge**: The ML service relies on `torch` and `transformers`, which normally download a ~2.5GB XLM-RoBERTa language model on startup. This is unacceptable for a fast CI/CD pipeline.
- **Solution**: We implemented an innovative deep-mocking strategy. Before the `app.py` FastAPI file is even imported into the test environment, we inject **Fake Module Instances** into Python's `sys.modules`:
  ```python
  import sys
  from unittest.mock import MagicMock
  
  # Inject dummy modules
  sys.modules['transformers'] = MagicMock()
  ```
- **Custom Torch Tensor Mocking**: Since FastAPI controllers call methods like `.cpu().item()` and `.argmax()` on Torch tensors, we created a lightweight `FakeTensor` Python class that faithfully mimics PyTorch tensor behaviors just enough to pass the mathematical operations without requiring the actual `torch` binary.
- **Endpoint Tests**: Verified that `/health`, `/predict`, and `/predict/batch` correctly deserialize inputs, apply mock predictions, and return properly formatted JSON adhering to the Pydantic schemas.
- **Reporting**: Outputs to `ml-report.json`.

---

## 5. CI/CD Integration (GitHub Actions)

### Tools & Technologies
- **Platform**: GitHub Actions (`.github/workflows/test.yml`).
- **Permissions**: Authorized to commit generated files back to the repository.

### Implementation Details
- **Multi-Environment Runner**: The pipeline provisions an Ubuntu server, installs Node 20.x, and Python 3.10.
- **Environment Variable Injection**: Since `.env` files are ignored in Git, the Action injects simulated environment variables (e.g., `JWT_SECRET: test_secret`, `STRIPE_PRICE_PRO: price_test_123`) directly into the shell to satisfy backend controller configurations.
- **Automated Commit Back**: After all three testing suites (`frontend`, `backend`, `ml-service`) finish running, the pipeline takes the newly generated JSON report files and runs `git commit` to push them directly to the `main` branch under `brandtide/public/`. 
- **Triggering Vercel**: Because Vercel watches the GitHub repository, these committed JSON reports instantly trigger Vercel to update the live production dashboard with the absolute latest testing metrics.
