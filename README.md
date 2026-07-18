# Screenly

Screenly is a custom Netflix-inspired movie catalog. Administrators curate every movie and users sign in to play the saved YouTube video inside the app.

- `mobile/` — Expo app for Android, iOS, and web
- `backend/` — Express, MongoDB, JWT authentication, admin seeding, and movie CRUD API

## Environment

Create `backend/.env` from `backend/.env.example` and configure:

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/screenly
JWT_SECRET=replace_with_at_least_32_random_characters
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=replace_with_a_private_admin_password
CLIENT_ORIGIN=http://localhost:8081
TRUST_PROXY=0
```

The server creates or updates the administrator from these private environment values at startup. Never add them to the Expo environment: every `EXPO_PUBLIC_` value is visible to users.

Copy `mobile/.env.example` to `mobile/.env.local` when a custom backend URL is needed. Android Studio emulators automatically translate `localhost` to `10.0.2.2`.

## Run

```powershell
cd backend
npm install
npm run dev

cd ../mobile
npm install
npx expo start --clear
```

Sign in with the administrator configured in `backend/.env`. The dedicated Screenly Console includes:

- Overview statistics for movies, members, new registrations, total plays, weekly plays, featured titles, categories, and top movies
- Catalog search, live/draft filtering, movie creation, editing, publishing, featuring, and deletion
- Member search, administrator roles, account suspension/restoration, and account removal

Movie records include a title, description, category, poster URL, optional backdrop, cast, director, year, duration, rating, language, genres, and a YouTube watch/embed link. Screenly extracts the video ID and plays it in a landscape full-screen player; no YouTube Data API key is required.

Environment files, dependencies, build output, signing material, local uploads, and editor metadata are excluded by Git.
