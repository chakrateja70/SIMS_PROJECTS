# Intelligent Online Shopping Analyzer

An end-to-end analytics dashboard for retail transaction data. The project combines a static HTML/CSS/JavaScript frontend with a FastAPI backend to clean online shopping datasets, visualize sales performance, generate product recommendations with FP-Growth, segment customers with RFM + K-Means, and explore results through advanced filters.

## Features

- CSV upload and automatic data cleaning for Online Retail style datasets
- Sales overview dashboard with revenue, top products, countries, and sample transactions
- Market basket analysis using FP-Growth association rules
- Product recommendation workflow based on discovered buying patterns
- Customer segmentation using RFM metrics and K-Means clustering
- Advanced combined filtering by customer, segment, country, product, price, and date
- FastAPI interactive API docs at `/docs`

## Tech Stack

- Frontend: HTML, CSS, JavaScript, Chart.js
- Backend: FastAPI, Uvicorn
- Data processing: Pandas, NumPy
- Analytics: mlxtend, scikit-learn

## How It Works

1. Upload a CSV transaction file from the frontend.
2. The backend validates the schema and cleans the dataset.
3. The dashboard loads overview metrics and charts.
4. FP-Growth can be run to discover frequent itemsets and association rules.
5. RFM analysis groups customers into segments such as Champions and At-Risk.
6. Advanced filters help drill into customers, products, countries, and date ranges.

## Dataset Requirements

The backend expects a CSV with these columns:

- `InvoiceNo`
- `StockCode`
- `Description`
- `Quantity`
- `InvoiceDate`
- `UnitPrice`
- `CustomerID`
- `Country`

### Cleaning Rules

During upload, the backend:

- drops rows with missing `CustomerID` or `Description`
- trims product descriptions and removes blank values
- removes cancelled invoices where `InvoiceNo` starts with `C`
- removes rows where `Quantity <= 0`
- removes rows where `UnitPrice <= 0`
- converts `CustomerID` to integer
- creates a `TotalPrice` column as `Quantity * UnitPrice`

## Local Setup

### 1. Create and activate a virtual environment

```powershell
cd backend
python -m venv .venv
.venv\Scripts\activate
```

### 2. Install backend dependencies

```powershell
pip install -r requirements.txt
```

### 3. Start the FastAPI backend

```powershell
python main.py --reload
```

The backend will be available at:

- API root: `http://127.0.0.1:8000/api`
- Swagger docs: `http://127.0.0.1:8000/docs`

### 4. Start the frontend

From the project root, serve the `frontend` folder with a simple local server:

```powershell
cd frontend
python -m http.server 3000
```

Then open:

```text
http://127.0.0.1:3000
```

The frontend is configured to call the backend at `http://127.0.0.1:8000`.

## Main API Endpoints

### System

- `GET /api/health` - backend health and data-loaded status

### Data

- `POST /api/upload` - upload and clean a CSV file
- `GET /api/overview` - summary metrics, charts data, and sample rows

### Market Basket Analysis

- `POST /api/basket` - generate FP-Growth association rules
- `GET /api/products` - list products for the recommendation dropdown
- `GET /api/recommend?product=...&top_k=5` - get product recommendations

### Customer Segmentation

- `POST /api/rfm` - compute RFM clustering and segment summary
- `GET /api/segments/list` - list available segments after RFM is run
