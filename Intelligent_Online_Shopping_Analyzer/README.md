## Intelligent Online Shopping Analyzer (ShopIQ)

Advanced e-commerce analytics with FP-Growth market basket analysis, RFM segmentation, and interactive dashboards.

### Features

- Upload and clean Online Retail CSV data
- Sales overview: monthly revenue, top products, top countries
- FP-Growth association rules and product recommendations
- RFM + K-Means customer segmentation
- Advanced filters: products, customers, segments, countries, and combined filters
- Autocomplete for search fields

### Tech Stack

- Backend: FastAPI + Uvicorn
- Data: Pandas, NumPy, scikit-learn, mlxtend
- Frontend: HTML/CSS/JS + Chart.js

### Project Structure

- backend/: FastAPI app, data processing, analytics
- frontend/: static dashboard UI
- sample_data.csv: example dataset

### Getting Started

1) Install backend dependencies

```bash
python -m pip install -r backend/requirements.txt
```

2) Start the API server

```bash
python backend/main.py --reload
```

3) Open the frontend

Option A: open the HTML file directly.

Option B: run a local static server:

```bash
cd frontend
python -m http.server 3000
```

Then visit http://localhost:3000 in your browser.

### Expected CSV Schema

Required columns (Online Retail format):

- InvoiceNo
- StockCode
- Description
- Quantity
- InvoiceDate
- UnitPrice
- CustomerID
- Country

Notes:

- Cancellation invoices starting with "C" are removed.
- Rows with missing key fields are dropped during cleaning.

### API Overview

Base URL: http://127.0.0.1:8000

Interactive API docs are available at http://127.0.0.1:8000/docs.