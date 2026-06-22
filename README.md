# Steering Committee

A cooperative robot-programming party game for **2–20 players**, inspired by Quirky Circuits. Your team programs a driving-base robot by secretly picking command cards — no talking allowed during the programming phase! Work together to navigate the robot to the charging station before the battery runs out.

Hosted for free on **Firebase Hosting** with **Firestore** for real-time multiplayer.

---

## How to Play

1. **Host** creates a room and shares the 6-character join code.
2. **Players** join at the hosted URL by entering the code and their name.
3. **Host** selects a scenario and starts the game.
4. **Programming phase** — 🔇 No talking! Each player secretly picks one card from their private hand of 5 and locks it in. Everyone can see who has/hasn't submitted, but not *what* card they chose.
5. **Execution phase** — Cards are shuffled into a random order and execute one by one. Watch the robot move!
6. **Win** by reaching the ⚡ charging station before the battery runs out. **Lose** if the battery hits zero or the robot falls into a pit.
7. Repeat rounds until you win or the battery is exhausted.

### Card Types

| Card | Effect |
|---|---|
| Drive 1 / 2 / 3 | Move forward 1, 2, or 3 spaces |
| Turn Left / Right | Rotate 90° in place |
| U-Turn | Rotate 180° in place |
| Reverse | Move backward 1 space |

Hitting a wall wastes the card but still costs battery. Falling into a pit ends the game immediately.

---

## Scenarios

| Scenario | Grid | Difficulty | Battery |
|---|---|---|---|
| Intro Circuit | 8×8 | Beginner | 40 |
| Left Turn Ahead | 8×8 | Easy | 45 |
| The Gauntlet | 10×10 | Medium | 55 |
| Pit Row | 10×10 | Hard | 50 |
| Championship Circuit | 12×12 | Expert | 70 |

---

## Firebase Setup (required before running)

### 1. Create a Firebase Project

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Click **Add project**, give it a name (e.g. `steering-committee`)
3. Disable Google Analytics if you don't need it → **Create project**

### 2. Enable Firestore

1. In the sidebar: **Build → Firestore Database**
2. Click **Create database**
3. Choose **Start in production mode** (we'll deploy proper rules)
4. Pick a region close to your players → **Done**

### 3. Enable Anonymous Authentication

1. In the sidebar: **Build → Authentication**
2. Click **Get started**
3. Under **Sign-in method** → **Anonymous** → Enable → **Save**

### 4. Register a Web App

1. In **Project Overview** → click the **</>** (Web) icon
2. Give it a nickname (e.g. `steering-committee-web`)
3. Check **Also set up Firebase Hosting** → **Register app**
4. Copy the `firebaseConfig` object — you'll need these values

### 5. Configure Environment Variables

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in your Firebase config values:

```env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
```

> `.env.local` is git-ignored and never committed.

### 6. Deploy Firestore Security Rules

```bash
npm install -g firebase-tools
firebase login
firebase use --add   # select your project, alias it "default"
firebase deploy --only firestore:rules
```

---

## Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). Create a game in one browser tab and join it from another.

---

## Deploy to Firebase Hosting

```bash
npm run build
firebase deploy --only hosting
```

Your game will be live at `https://your-project-id.web.app`.

To deploy everything at once (hosting + Firestore rules):

```bash
firebase deploy
```

## Auto-Deploy on Push to `main` (GitHub Actions)

This repo includes a workflow at `.github/workflows/firebase-deploy.yml` that:

- Runs tests and build on every push to `main`.
- Deploys to Firebase only if those checks pass.
- Uses Node 24 in CI.

Set the following repository secret before using it:

- `GCP_SERVICE_ACCOUNT_EMAIL`: Service account email used for deploys.
  - this can be found under [Service Accounts](https://console.cloud.google.com/iam-admin/serviceaccounts?cloudshell=true&project=steering-committee-game)
- `GCP_WORKLOAD_IDENTITY_PROVIDER`: Full Workload Identity Provider resource name.
  - create the identity pool
    ```bash
    gcloud iam workload-identity-pools create github-actions-pool --project=steering-committee-game --location=global --display-name="GitHub Actions Pool"
     ```
  - give access for the GitHub OIDC provider
    ```bash
    gcloud iam workload-identity-pools providers create-oidc github-provider --project=steering-committee-game --location=global --workload-identity-pool=github-actions-pool --display-name="GitHub Provider" --issuer-uri="https://token.actions.githubusercontent.com" --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository,attribute.ref=assertion.ref" --attribute-condition="assertion.repository=='Lansing-Tech-Studio/steering-committee' && assertion.ref=='refs/heads/main'"
    ```
  - grab the project ID
    ```bash
    gcloud projects describe steering-committee-game --format="value(projectNumber)"
    ```
  - add the policy binding
    ```bash
    gcloud iam service-accounts add-iam-policy-binding github-actions@steering-committee-game.iam.gserviceaccount.com --project=steering-committee-game --role="roles/iam.workloadIdentityUser" --member="principalSet://iam.googleapis.com/projects/648140424313/locations/global/workloadIdentityPools/github-actions-pool/attribute.repository/Lansing-Tech-Studio/steering-committee"
    ```
  - list the providers to set the value
    ```bash
    gcloud iam workload-identity-pools providers list --project=steering-committee-game --location=global --workload-identity-pool=github-actions-pool --format="value(name)"
    ```

The build also needs your Firebase web app config as repository secrets (same values you
use in `.env.local`):

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

Before the auth with work, also need to enable [IAM Service Account Credentials API](https://console.cloud.google.com/apis/api/iamcredentials.googleapis.com/metrics?project=steering-committee-game).

The workflow deploys `hosting`, `firestore.rules`, and `firestore.indexes.json`.

---

## Architecture

```
Host's browser ──── Firestore ──── Player browsers
      │                                    │
  Runs game logic                  Read-only observers
  Deals cards                      Submit card choice
  Simulates robot                  See execution animate
  Writes results back
```

- **No backend server** — the host player's browser runs all game simulation logic.
- **Firestore** stores room state, player lists, private hands, and submissions.
- **Anonymous Auth** gives each player a stable UID for the session.
- **Private hands** — each player's hand is stored in a sub-collection readable only by that UID, so card identities stay hidden even though submission indices are public.

---

## Project Structure

```
src/
  game/
    engine.ts      # Pure robot movement simulation (no Firebase)
    cards.ts       # Card types, deck weights, dealing logic
    scenarios.ts   # 5 built-in map definitions
  hooks/
    useRoom.ts     # Firestore room + players listener
    useHand.ts     # Private hand listener
    useHostLogic.ts # Host-side orchestration (dealing, execution)
  components/
    GameGrid.tsx       # SVG top-down grid renderer
    Hand.tsx           # Player's private card hand
    ProgramQueue.tsx   # Who has/hasn't submitted
    ExecutionReplay.tsx # Step-through animation
    LobbyView.tsx      # Waiting room + scenario picker
    BatteryBar.tsx     # Battery progress display
  pages/
    HomePage.tsx   # Create / Join game
    RoomPage.tsx   # Main game view (routes by phase)
```

---

## Adding Scenarios

Edit [`src/game/scenarios.ts`](src/game/scenarios.ts). Each scenario specifies:

```typescript
{
  id: 'my_scenario',
  name: 'My Scenario',
  description: '...',
  difficulty: 'Medium',
  gridW: 10, gridH: 10,
  startPos: { x: 1, y: 1, facing: 'E' },
  goalPos: { x: 8, y: 8 },
  walls: [
    { x: 3, y: 3, side: 'E' },  // wall on east edge of cell (3,3)
  ],
  pits: [{ x: 5, y: 5 }],
  startBattery: 50,
}
```

Grid coordinates: `(0,0)` = top-left, `x` grows right, `y` grows down.
