# Sentra: Hybrid Crypto File Encryption Platform

Sentra is a secure, privacy-focused platform for sharing, encrypting, and managing files using hybrid cryptography (AES + RSA). It features:

- End-to-end encryption for files using AES-256 and RSA
- Self-destructing files and robust cloud cleanup
- Outbox/Inbox UI for sent and received files
- Strict authentication and user management
- MongoDB Atlas backend with automated cleanup triggers
- Modern React + Vite frontend
- Flask backend with modular crypto services

## Features
- **Hybrid Encryption:** Combines symmetric (AES) and asymmetric (RSA) encryption for strong security.
- **Self-Destruct Files:** Files can be set to delete from the cloud after download.
- **Automated Cleanup:** MongoDB Atlas Triggers and scheduled jobs ensure no orphaned data remains.
- **User-Friendly UI:** Outbox and Inbox tabs, file status, download tracking, and notifications.
- **Strict Authentication:** JWT-based user sessions and access control.
- **No Compression:** All compression logic removed for data integrity.

## Tech Stack
- **Frontend:** React (TypeScript), Vite, Tailwind CSS
- **Backend:** Flask (Python), MongoDB Atlas
- **Crypto:** AES-256, RSA, modular Python crypto services

## Getting Started
1. Clone the repo: `git clone https://github.com/Prathmesh-D/hybrid-crypto-file-encryption.git`
2. Install frontend dependencies: `npm install`
3. Install backend dependencies: `pip install -r requirements.txt`
4. Configure MongoDB Atlas and environment variables
5. Run frontend: `npm run dev`
6. Run backend: `flask run`

## Repository Structure
- `frontend/` - React UI code
- `backend/` - Flask API and crypto services
- `crypto/` - Modular cryptography logic
- `public/` - Static assets

## License
MIT

---

For more details, see the documentation in each folder or open an issue on GitHub.