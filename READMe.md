# Luhlokohla ZCC Church Management System

## Setup Instructions

### 1. Clone the repository
\`\`\`bash
git clone https://github.com/yourusername/church-management.git
cd church-management
\`\`\`

### 2. Create config.js
Copy `config.example.js` to `config.js`:
\`\`\`bash
cp config.example.js config.js
\`\`\`

### 3. Add your API keys
Edit `config.js` and add your Google Apps Script URL and API key.

### 4. Deploy Google Apps Script
- Copy the Apps Script code to script.google.com
- Deploy as web app
- Copy the deployment URL
- Update `config.js` with the URL

### 5. Run locally
Use Live Server or any HTTP server:
\`\`\`bash
npx live-server
\`\`\`

## Security Notes
- Never commit `config.js` to version control
- Keep your API keys secret
- Rotate API keys periodically