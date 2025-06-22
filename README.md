
---

# Uttranchal Tennis Association Website

A full-stack web application for the Uttranchal Tennis Association, providing player registration, event management, and administrative tools.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
  - [Frontend Setup](#frontend-setup)
  - [Backend Setup](#backend-setup)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [License](#license)

---

## Features

- Player registration with multi-step forms
- Admin dashboard for managing players, events, and partners
- User authentication (login for users and admins)
- Event listing and management
- Responsive and modern UI

---

## Tech Stack

- **Frontend:** React, TypeScript, Tailwind CSS, Vite
- **Backend:** Python (Flask), SQLite
- **Other:** RESTful APIs, Custom UI components

---

## Getting Started

### Frontend Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```
2. **Start the development server:**
   ```bash
   npm run dev
   ```
3. **Open in browser:**  
   Visit [http://localhost:8080](http://localhost:8080)

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```
2. **Create a virtual environment (optional but recommended):**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```
4. **Set up the database:**
   ```bash
   python database.py
   ```
5. **Run the backend server:**
   ```bash
   python app.py
   ```
6. **API will be available at:**  
   [http://localhost:5000](http://localhost:5000)

---

## Project Structure

```
Uttranchal Tennis Association Website/
  backend/                # Flask backend (API, DB, routes)
  src/                    # React frontend source code
    components/           # React components (UI, forms, dashboards)
    pages/                # Page-level components
    services/             # API service layer
    hooks/                # Custom React hooks
  public/                 # Static assets
  index.html              # Main HTML file
  package.json            # Frontend dependencies
  README.md               # Project documentation
```

