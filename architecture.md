# Architecture & Product Judgment

## Stack Choices
- **Next.js & React:** Chosen for rapid UI development and seamless API routing.
- **TipTap:** A headless wrapper around ProseMirror. It provides the exact primitive needed for rich text editing without enforcing a heavy UI, allowing me to build a custom toolbar quickly.
- **Supabase:** Used for rapid backend deployment, handling both data persistence and row-level-like filtering for shared documents.

## Deliberate Scope Cuts (Tradeoffs)
To ensure high quality within the 4-6 hour timebox, I made the following product decisions:
1. **File Upload Limit:** Restricted imports to `.txt` and `.md`. Implementing `.docx` parsing requires heavy dependencies (like `mammoth.js`) which bloated the scope. Native browser `FileReader` handles text efficiently.
2. **Deletion Flow:** Omitted document deletion to focus deeply on the core editing, sharing, and creation loop. 
3. **Simple Auth Simulation:** Used email-based tracking for ownership and sharing rather than a complex OAuth flow.