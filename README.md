# Ajaia - Collaborative Document Editor

## Tech Stack
- Next.js (App Router)
- TipTap (Rich Text Editor)
- Supabase (PostgreSQL Auth & Database)
- Tailwind CSS

## Local Setup
1. Clone the repository
2. Run `npm install`
3. Create a `.env.local` file with your Supabase keys:
   NEXT_PUBLIC_SUPABASE_URL=your_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
4. Run `npm run dev`
5. To run the automated tests: `npm run test`