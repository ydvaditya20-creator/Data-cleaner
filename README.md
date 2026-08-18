# DataPrep Studio — Spreadsheet Data Cleaning & Automation Suite

A high-performance, interactive tabular data cleaning, spreadsheet transformation, and 1-click recipe automation web application.

---

## 🌟 Key Features

1. **Space-Delimited Tabular Parser**: Paste any unformatted, space-delimited or multi-space text (courier logs, bank statements, ledger sheets, invoices) to convert it instantly into clean columns and rows.
2. **Spreadsheet Formula & Math Engine**: Top formula bar (`fx`) supporting arithmetic (`=2*5+1/4-1`, `=(100+50)*0.18`), relative cell coordinates (`=A1*B1`, `=C1*1.18`), and aggregate functions (`=SUM()`, `=AVERAGE()`, `=ROUND()`, `=MIN()`, `=MAX()`, `=IF()`).
3. **1-Click Insert & Delete Cells**:
   - `+ Left` / `+ बाएं`: Inserts a blank cell to the left of the active cell.
   - `+ Right` / `+ दाएं`: Inserts a blank cell to the right and shifts row items right.
   - `Delete` / `हटाएं`: Deletes active cell and shifts trailing row elements left.
4. **Column & Row Transformations**:
   - Merge Columns with custom delimiters (e.g., First Name + Last Name).
   - Split Column by character, hyphen, comma, or space into multiple columns.
   - Insert Rows & Columns (Above/Below, Left/Right with custom headers).
5. **Text Cleaning & Formatting**:
   - Change Case (UPPERCASE, lowercase, Title Case, Sentence case).
   - Trim & normalize excess whitespace.
   - Find & Replace (text or regex).
   - Add custom Prefix & Suffix (currency ₹, $, units kg, pcs).
6. **Smart Data Tools**:
   - Dictionary Word Joiner (Adjacent Blank Manager) for fractured multi-word titles.
   - Missing Value Filling (Forward Fill, Backward Fill, Custom value, Column Average).
   - Deduplication (Unique rows or key-column deduplication).
   - Sequence Generator (1, 2, 3... with custom prefix and step).
7. **Automated Recipe Pipeline (.json)**:
   - Records every transformation step.
   - Download the reusable recipe `.json` file.
   - Load the recipe file in future sessions to clean new raw files in 1 click!
8. **Multi-Format Export & Code Generation**:
   - Excel (`.xlsx`), CSV, TSV, JSON.
   - Python Pandas script, R tidyverse script, SQL INSERT statements.
   - 1-Click copy directly to Google Sheets or Excel clipboard.

---

## 🚀 How to Deploy Live (GitHub ➔ Live URL)

### Method 1: Deploy with Vercel (Recommended — Free & 1 Minute)

1. Push this project to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit - DataPrep Studio"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git push -u origin main
   ```
2. Go to [vercel.com/new](https://vercel.com/new) and log in with your GitHub account.
3. Select your repository (`YOUR_REPO_NAME`) and click **Deploy**.
4. Your live URL will be ready immediately at `https://your-app.vercel.app`!

---

### Method 2: Deploy on GitHub Pages

1. Build the production files:
   ```bash
   npm run build
   ```
2. In your GitHub repository, navigate to **Settings ➔ Pages**.
3. Under **Build and deployment > Source**, choose **GitHub Actions** (or select the `dist` branch).
4. Your application will be live at `https://<YOUR_USERNAME>.github.io/<YOUR_REPO_NAME>/`.

---

## 💻 Local Development

```bash
# Install dependencies
npm install

# Start local development server
npm run dev

# Build production bundle
npm run build
```

---

## 📄 License
MIT License. Free for personal and commercial data processing workflows.
