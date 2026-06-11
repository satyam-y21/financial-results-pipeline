# Financial Results Processor

An end-to-end pipeline that accepts a BSE/NSE corporate result PDF link, sends it to Gemini for P&L extraction, and returns structured JSON to a React frontend.

---

## Project Structure

```
financial-results-pipeline/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── JsonViewer.jsx       # Syntax-highlighted JSON display
│   │   │   ├── ResultPanel.jsx      # Header, tabs, copy/download
│   │   │   └── TableView.jsx        # P&L rendered as HTML table
│   │   ├── services/
│   │   │   └── api.js               # Webhook call + error handling
│   │   ├── utils/
│   │   │   └── jsonUtils.js         # Highlighting, table extraction
│   │   ├── App.jsx                  # Main page + state machine
│   │   ├── index.css                # All styles
│   │   └── main.jsx                 # Entry point
│   ├── .env.example                 # Template for environment variables
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── n8n/
│   └── workflow.json                # n8n workflow export file
├── samples/
│   ├── ivalue-q4-fy26.json          # Q4 extended format sample
│   └── example-q1-fy26.json         # Q1 standard format sample
└── README.md                        # Setup and run guide
```

---

## Setup and Running the Solution

Follow these steps to set up and run both the **n8n automation backend** (including credentials configuration) and the **React frontend**.

### 1. n8n Backend Setup & Configuration

You can run n8n either locally via npm (Node.js).

#### Running n8n Locally (npm)
If you don't have n8n installed, install it globally using npm:
```bash
npm install -g n8n
```
Start n8n:
```bash
n8n start
```
By default, n8n will start and be accessible at `http://localhost:5678`.


---

#### Configuring Gemini API Credentials in n8n

The workflow utilizes the standard Google Gemini node credential type (`googlePalmApi`). You must create this credential in your n8n instance and link it to the workflow:

1. Open your browser and navigate to **`http://localhost:5678`** (complete the initial setup to create your owner account if running for the first time).
2. Click on **Credentials** in the left sidebar menu.
3. Click the **Create Credential** button (top right).
4. In the search box, search for `Google Gemini` or `Google Gemini(PaLM) API`.
5. Select **Google Gemini(PaLM) API** and click **Continue**.
6. Paste your Gemini API key in the **API Key** input field.
7. Click **Save** (bottom right).

---

#### Importing and Activating the Workflow

1. In the n8n sidebar, click on **Workflows**.
2. Click on the three dots icon (`...`) in the top-right corner of the Workflows list and choose **Import from File...**
3. Select `n8n/workflow.json` from this project's directory.
4. Once loaded, you will see the pipeline nodes.
5. **Associate the Credentials**:
   - Double-click/open the **`Start Gemini Upload`** node. Under the *Credential* field, select the Google Gemini(PaLM) API credential you saved earlier.
   - Double-click/open the **`Gemini API`** node. Similarly, select the Google Gemini(PaLM) API credential.
6. Click **Save** in the top right to save your changes to the workflow.
7. Toggle the workflow status in the top right to **Publish**.

Your production webhook is now active and listening for POST requests at:
```
http://localhost:5678/webhook/process-pdf
```

---

### 2. React Frontend Setup

The frontend is built with Vite and React. It acts as the user interface to paste PDF links, trigger the n8n pipeline, and visualize the output.

1. Open a new terminal and navigate to the `frontend` folder:
   ```bash
   cd frontend
   ```
2. Copy the `.env.example` file to `.env`:
   ```bash
   copy .env.example .env
   ```
   *(On Linux/macOS, use `cp .env.example .env`)*

3. Verify the `.env` file content. It should point to your active n8n production webhook URL:
   ```env
   VITE_N8N_WEBHOOK_URL=http://localhost:5678/webhook/process-pdf
   ```
4. Install all dependencies:
   ```bash
   npm install
   ```
5. Start the Vite development server:
   ```bash
   npm run dev
   ```
6. The app will run locally. Open the URL shown in your terminal (usually **`http://localhost:5173`**).

---

## Configuration Summary

| Variable | Location | Default Value | Description |
|---|---|---|---|
| `VITE_N8N_WEBHOOK_URL` | `frontend/.env` | `http://localhost:5678/webhook/process-pdf` | The n8n webhook API URL endpoint for processing PDF links |
| `API Key` (Google Gemini) | n8n Credentials UI | — | Gemini API key from Google AI Studio |

---

## Testing & Verification

### Using the Web UI

1. Open your browser to **`http://localhost:5173`**.
2. Paste a valid corporate result PDF URL into the input field.
3. Click **Process PDF**.
4. The processing status will load (usually takes 20-60 seconds depending on size/latency).
5. View the structured output under either the **Table View** or **Raw JSON** tabs.
6. Use the **Copy JSON** or **Download JSON** buttons to export the result.

### Valid BSE PDF Links for example:

https://www.bseindia.com/xml-data/corpfiling/AttachHis/d11ea565-ec81-4379-aa72-dfbbd2674c1e.pdf

https://www.bseindia.com/xml-data/corpfiling/AttachHis/ba4f4cd2-5696-4738-91b2-766fca042a1a.pdf

---