## ✨ Features

- **$N$-Concurrent Isolated Rooms:** Dynamic room sandboxing utilizing a JavaScript `Map` data structure. Multiple separate friend groups can communicate concurrently on the same server instance via unique room codes.

- **Transient Ephemerality (Zero-Persistence):** No database layer. Chat history and assets are cached strictly within system volatile memory (RAM). When the designated host triggers a `stop_room` action, the entire sandbox is garbage-collected—instantly destroying all logs forever.

- **Binary-to-Text Asset Pipeline:** Direct image streaming over the existing socket pipeline by translating binary image uploads into **Base64-encoded Data URLs** via the JavaScript `FileReader` API.

- **Session Hydration Loop:** Seamless user experience across accidental tab closures or page updates. The frontend utilizes `localStorage` to preserve cryptographic session metadata and automatically executes a synchronization handshake to fetch historical data from the server.

- **Asymmetric Discord-Inspired UI:** Sleek, low-contrast dark-mode theme utilizing CSS variables and modern flex layouts. Layout nodes adjust dynamically based on message authorship (sender messages anchor to the right with custom indigo highlights; receiver messages anchor to the left).

---

## 📂 File Directory Structure

```text
ws-chat-app/
├── chat-backend/             # Deployed independently to Render/Fly.io
│   ├── .gitignore            # Configured to omit heavy node_modules tracking
│   ├── package.json          # Production dependencies mapping & scripts
│   ├── package-lock.json     # Precise dependency version locking
│   └── server.js             # Stateful WebSocket engine & CORS middleware
│
└── chat-frontend/            # Deployed independently to Vercel
    ├── index.html            # Sleek minimalist interface layer
    ├── style.css             # Discord-inspired dark theme stylesheet
    └── app.js                # Client networking engine & file reader
```
