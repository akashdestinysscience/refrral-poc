# Referral Demo

A pure front-end demo of a referral program: signup with a referral code,
a dashboard to view/copy your own code and simulate a reward-triggering
event, and an admin view to see the full picture. No backend — all
"database" state lives in `localStorage` and is shared across browser
tabs.

## Running it

```bash
npm install
npm run dev
```

Open the printed local URL (e.g. `http://localhost:5173`).

## How it works

- `src/db.js` — the "database": users and referrals, stored in
  `localStorage`. Handles referral code generation, code lookup, and
  reward crediting.
- `src/DataContext.jsx` — a React Context wrapping `db.js` that re-renders
  consumers when data changes, including changes made in *other* tabs
  (via the browser's `storage` event).
- `src/pages/Signup.jsx`, `Dashboard.jsx`, `Admin.jsx` — the three views,
  wired up with React Router.

Each browser tab has its own "session" (`sessionStorage`), so you can be
logged in as a different user in each tab while all tabs share the same
underlying user/referral data.

## Testing the referral flow manually

1. **Sign up as Priya** — go to `/`, sign up with no referral code. You'll
   land on the dashboard with a freshly generated referral code, e.g.
   `NT9K2XP`.
2. **Copy Priya's referral link** from the dashboard ("Copy link"), or just
   note the code shown.
3. **Open the link as Rahul** — open a new tab (or an incognito window) and
   navigate to `/signup?ref=NT9K2XP` (paste the copied link, or type the
   `?ref=` param manually).
4. **Sign up as Rahul** on that page. You should see a banner: "You were
   invited by NT9K2XP". After submitting, a referral relationship is
   created behind the scenes with status `pending`.
5. **On Rahul's dashboard**, click **"Simulate: Complete first paid
   consultation"**.
6. **Check both wallets** — Priya's dashboard (in her original tab/window)
   and Rahul's dashboard should now show credited wallet balances, and the
   referral status flips to `rewarded`.
7. **Go to `/admin`** to see the full users table and the referral
   relationships table, including the now-`rewarded` relationship between
   Priya and Rahul.

### Edge cases to try

- **Self-referral**: try signing up with your own email while your own
  referral code is in the URL — you'll get an error and the signup is
  blocked.
- **Unknown referral code**: navigate to `/signup?ref=NOTREAL` — signup
  proceeds normally with no error and no referral relationship created.
