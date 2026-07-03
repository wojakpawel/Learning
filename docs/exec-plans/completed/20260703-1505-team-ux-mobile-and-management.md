# Improve team UX, mobile layout, and team management

**IMPLEMENTER INSTRUCTION: Keep this plan up to date as you work.**
After each significant step, update the `Progress` section with what was done and what's next. If context is lost or you are interrupted, the plan must contain everything needed to resume. Treat the plan as the single source of truth for this work.

This ExecPlan is a living document. The sections `Progress`, `Surprises & Discoveries`, `Decision Log`, and `Outcomes & Retrospective` must be kept up to date as work proceeds.

Reference: This plan follows conventions from `AGENTS.md`, `docs/ARCHITECTURE.md`, and `docs/exec-plans/create-plan-file.md`.

## Purpose / Big Picture

The app supports teams and shared tasks, but team management is limited and the UI does not adapt well to phones. After this work, users see clearer loading feedback during slow actions, the layout works on narrow screens, team tasks show who created them (when it is someone else), and each team has a collapsible member list. Team owners can kick members and delete the whole team (including its tasks). Non-owner members can leave a team.

Prove it works by logging in on a phone-sized viewport (or DevTools), expanding a team's member list, seeing another user's task labeled with their username, kicking a member as owner, leaving as a member, and deleting a team — confirming team tasks disappear for all users.

## Assumptions

- No schema migration is required for kick/leave/delete; existing `ON DELETE CASCADE` on `tasks.team_id`, `team_members.team_id`, and `team_invitations.team_id` is sufficient when a team row is deleted.
- Team owners **cannot leave** without deleting the team (they must use delete team instead).
- Owners **cannot kick themselves**; delete team is the exit path for owners.
- Member list is fetched on demand when the user expands a team (not on initial teams load).
- Loading states use existing patterns (`loading-message`, disabled buttons, optional `mutating` text like "Please wait...") — no new spinner library.
- Mobile pass targets viewports **≤ 480px** width; desktop layout stays as-is.

## Open Questions

None at plan authoring time. Decisions are in the Decision Log.

## Progress

- [x] (done) Milestone 1: Team members API, leave, kick, delete team
- [x] (done) Milestone 2: Task creator username in API and UI
- [x] (done) Milestone 3: Collapsible member list and team management UI in Teams.jsx
- [x] (done) Milestone 4: Loading states across auth, teams, invitations, tasks
- [x] (done) Milestone 5: Mobile CSS pass and docs update

## Surprises & Discoveries

- Observation: No schema migration needed; existing FK cascades handled team delete correctly.
  Evidence: `tasks.team_id REFERENCES teams(id) ON DELETE CASCADE` in `server/db/schema.sql`.

## Outcomes & Retrospective

All five milestones shipped. New team endpoints (members, kick, leave, delete), task creator attribution, collapsible member UI, loading polish, and mobile breakpoints at 480px. `npm run lint` and `npm run build` pass.

## Decision Log

- Decision: Add `GET /api/teams/:teamId/members` returning `{ userId, username, isOwner, joinedAt }[]`; members only.
  Rationale: On-demand load when user expands member list; avoids bloating `GET /api/teams`.
  Date/Author: 2026-07-03 / plan author

- Decision: `DELETE /api/teams/:teamId/members/:userId` — owner only; cannot remove self.
  Rationale: "Kick" is an owner action; owner exits via team delete.
  Date/Author: 2026-07-03 / plan author

- Decision: `DELETE /api/teams/:teamId` — owner only; relies on FK cascade to remove `team_members`, `team_invitations`, and `tasks` for that team.
  Rationale: User requirement; no orphan team tasks.
  Date/Author: 2026-07-03 / plan author

- Decision: `POST /api/teams/:teamId/leave` — any member who is **not** the owner.
  Rationale: Non-owners can leave; owners use delete team.
  Date/Author: 2026-07-03 / plan author

- Decision: Task list includes `createdByUsername`; UI shows "Created by {username}" only when `createdByUserId !== currentUser.id`.
  Rationale: User asked not to show creator when the active user is the creator.
  Date/Author: 2026-07-03 / plan author

- Decision: Member list hidden by default; toggle via "Members (N)" button per team row; only one team expanded at a time (optional but keeps mobile tidy).
  Rationale: User asked for on-click, not always visible.
  Date/Author: 2026-07-03 / plan author

- Decision: Pending invitations for a kicked user are left as-is (historical `accepted`/`rejected`/`pending` rows unaffected); kicking only removes `team_members` row. Pending invites to kicked user can still be accepted only if re-invited after kick — if pending exists from before kick, accept should fail if not a member path — verify: after kick, user is not in team_members; old pending invite could still be accepted. **Mitigation:** on kick, delete any `pending` invitations for that user on that team.
  Rationale: Prevents re-join via stale pending invite without owner action.
  Date/Author: 2026-07-03 / plan author


Stack: React 19 + Vite frontend (`src/`), Express API (`server/`), PostgreSQL, JWT auth. Run with `npm run dev:all`.

**Relevant files:**

- `server/routes/teams.js` — create/list teams, invite
- `server/routes/tasks.js` — list/create/delete tasks; uses `mapTaskRow` in `server/lib/tasks.js`
- `server/db/schema.sql` — `teams`, `team_members`, `tasks` with `ON DELETE CASCADE` on `tasks.team_id`
- `src/Teams.jsx` — team list, create, invite
- `src/ToDo.jsx` — task list with team badges and `canComplete`
- `src/Invitations.jsx`, `src/Auth.jsx`, `src/Form.jsx`
- `src/styles.css` — global styles; `index.html` already has viewport meta

**Terms:**

- **Kick** — owner removes another member from `team_members`.
- **Leave** — non-owner removes themselves from `team_members`.
- **Delete team** — owner deletes the `teams` row; cascades remove members, invitations, and team tasks.

**Target API additions:**

    GET    /api/teams/:teamId/members     → 200 [{ userId, username, isOwner, joinedAt }]
    DELETE /api/teams/:teamId/members/:userId   → 204 (owner kicks member)
    POST   /api/teams/:teamId/leave       → 204 (non-owner leaves)
    DELETE /api/teams/:teamId             → 204 (owner deletes team + cascaded tasks)

**Task list change (`GET /api/tasks`):**

Each task gains:

    createdByUsername: string
    showCreator: boolean   // true when createdByUserId !== req.userId (server-computed)

UI uses `showCreator` and `createdByUsername` to render "Created by alice" under team tasks (and personal if ever created by another user — unlikely today).

## Plan of Work

### Milestone 1: Team members API, leave, kick, delete team

Extend `server/routes/teams.js` (all routes behind existing `requireAuth` on `/api/teams`).

**GET `/:teamId/members`**

- Verify `isTeamMember(teamId, req.userId)` else `404`
- Query:

        SELECT u.id, u.username, tm.joined_at, (t.owner_id = u.id) AS is_owner
        FROM team_members tm
        INNER JOIN users u ON u.id = tm.user_id
        INNER JOIN teams t ON t.id = tm.team_id
        WHERE tm.team_id = $1
        ORDER BY is_owner DESC, tm.joined_at ASC

- Return camelCase JSON array

**DELETE `/:teamId/members/:userId`**

- Owner only (`403` otherwise)
- Cannot kick self (`400`)
- Target must be a member (`404` if not)
- Transaction: delete pending invitations for `(teamId, targetUserId)`; delete from `team_members`
- Return `204`

**POST `/:teamId/leave`**

- Member who is not owner (`403` if owner — message: "Team owner cannot leave. Delete the team instead.")
- Delete own `team_members` row
- Return `204`

**DELETE `/:teamId`**

- Owner only
- `DELETE FROM teams WHERE id = $1 AND owner_id = $2` — `404` if no row
- Cascade removes tasks (verify no code path blocks this)
- Return `204`

Add `src/api/teams.js` methods: `listTeamMembers`, `kickMember`, `leaveTeam`, `deleteTeam`.

### Milestone 2: Task creator username in API and UI

Update `server/routes/tasks.js` list (and create) query to join creator username:

        INNER JOIN users creator ON creator.id = t.created_by_user_id

Pass `creator_username` into `mapTaskRow`.

Update `server/lib/tasks.js` `mapTaskRow`:

    createdByUsername: row.creator_username
    showCreator: row.created_by_user_id !== userId

Update `src/ToDo.jsx` — when `task.showCreator`, render:

    <p className="task-meta">Created by {task.createdByUsername}</p>

Place inside `task-card` below team badge, above task title.

### Milestone 3: Collapsible member list and team management UI

Refactor `src/Teams.jsx`:

**State per team:**

- `expandedTeamId` — which team's member panel is open (null = none)
- `membersByTeamId` — cached member arrays
- `membersLoadingTeamId` — loading indicator for fetch
- `membersError` — optional error string

**UI per team row:**

- Team name + Owner badge (unchanged)
- Button: `Members ({count})` — if count unknown until expand, first expand fetches and sets count; or add `memberCount` to `GET /api/teams` in a small follow-up query optional — **simpler:** show "Members" until loaded, then "Members (3)"
- When expanded:
  - Loading: "Loading members..."
  - List usernames with Owner badge on owner row
  - Owner sees **Kick** next to each non-owner member (confirm: `window.confirm` or inline "Kick?" — use `confirm()` for minimal scope)
  - Owner sees **Delete team** button (destructive style, confirm dialog)
  - Non-owner sees **Leave team** button (confirm dialog)
- Invite row stays visible for owners (below member list or above — keep above member list)

**After kick / leave / delete:**

- Call `onTeamsUpdate` refresh via `loadTeams()`
- If deleted or left current team, collapse panel
- `onMembershipChange()` from parent to refresh tasks

Wire new API calls from `src/api/teams.js`.

### Milestone 4: Loading states

Audit and add consistent loading UX:

| Location | Loading behavior |
|----------|------------------|
| `Auth.jsx` | Already has `submitting` — keep |
| `Invitations.jsx` | Add `mutating` disabled on buttons; show "Accepting..." / "Rejecting..." on active button optional |
| `Teams.jsx` | `mutating` on create/invite/kick/leave/delete; disable form during create |
| `ToDo.jsx` | Show subtle loading on **Done!** row or disable all Done buttons while `mutating` (already disables); add loading to initial panel if teams empty and tasks loading |
| `App.jsx` | Keep bootstrap "Loading..." |
| Member fetch | `membersLoadingTeamId === team.id` shows inline loader |

Optional shared class `.is-loading` on buttons: reduced opacity + `cursor: wait`.

Do not add a spinner package.

### Milestone 5: Mobile CSS pass and docs

Update `src/styles.css` with `@media (max-width: 480px)`:

- Reduce `#root` padding to `16px 12px`
- Reduce `.app-shell` padding to `24px 18px`, border-radius `24px`
- `.task-item` — `grid-template-columns: 1fr`; stack Done button below card
- `.invitation-item` — single column; actions full-width
- `.invite-row` — single column
- `.invitation-actions`, `.team-actions` — flex wrap; buttons `min-height: 44px` for touch
- `.user-bar` — stack vertically
- Ensure `select`, inputs `font-size: 16px` on mobile (prevents iOS zoom)

Manual check: Chrome DevTools iPhone SE / 390px width — no horizontal scroll, readable text, tappable buttons.

Update `docs/ARCHITECTURE.md` and `README.md` features (same PR). Do not link to this plan from canonical docs.

Run `npm run lint` and `npm run build`.

## Concrete Steps

    npm run dev:all

Manual API checks (replace tokens and IDs):

    curl -s http://127.0.0.1:3001/api/teams/$TEAM_ID/members \
      -H "Authorization: Bearer $TOKEN"

    curl -s -X DELETE http://127.0.0.1:3001/api/teams/$TEAM_ID/members/$USER_ID \
      -H "Authorization: Bearer $OWNER_TOKEN"

    curl -s -X POST http://127.0.0.1:3001/api/teams/$TEAM_ID/leave \
      -H "Authorization: Bearer $MEMBER_TOKEN"

    curl -s -X DELETE http://127.0.0.1:3001/api/teams/$TEAM_ID \
      -H "Authorization: Bearer $OWNER_TOKEN"

    npm run lint
    npm run build

## Validation and Acceptance

**Task creator**

1. Alice creates team task. Bob (member) sees "Created by alice" on that task.
2. Alice sees her own team task — no creator line shown.

**Member list**

1. Teams show "Members" toggle, collapsed by default.
2. Click expands list with correct usernames; click again collapses.
3. Only one team expanded at a time (if implemented).

**Kick / leave / delete**

1. Owner kicks bob — bob's team list no longer includes team; bob's team tasks for that team gone.
2. Bob (member) leaves — same effect for bob.
3. Owner deletes team — team gone for all members; all team tasks gone (verify in DB or UI).
4. Owner cannot leave via leave endpoint (error message shown).
5. Owner cannot kick self.

**Loading**

1. During create team / accept invite / delete team, buttons disabled and user sees wait state (no double-submit).

**Mobile**

1. At 375px width: no horizontal overflow; task cards and buttons usable.
2. Touch targets feel adequate (44px min height on primary actions).

**Regression**

1. Personal tasks, invitations, login still work.
2. `npm run lint` and `npm run build` pass.

## Idempotence and Recovery

- Kick/delete/leave are idempotent-safe: deleting absent member returns `404`.
- Delete team twice: second call `404`.
- Re-run `npm run db:migrate` unchanged — no new migrations.

## Artifacts and Notes

Example member row:

    { "userId": "...", "username": "bob", "isOwner": false, "joinedAt": "2026-07-03T..." }

Example task with creator:

    {
      "id": "...",
      "name": "Shared task",
      "scope": "team",
      "teamName": "alpha",
      "createdByUserId": "...",
      "createdByUsername": "alice",
      "showCreator": true,
      "canComplete": false
    }

## Interfaces and Dependencies

**`server/lib/tasks.js` — updated `mapTaskRow`**

    showCreator: row.created_by_user_id !== userId,
    createdByUsername: row.creator_username,

**`src/api/teams.js` additions**

    listTeamMembers(teamId)
    kickMember(teamId, userId)
    leaveTeam(teamId)
    deleteTeam(teamId)

**Files changed (checklist)**

    server/routes/teams.js
    server/routes/tasks.js
    server/lib/tasks.js
    src/api/teams.js
    src/Teams.jsx
    src/ToDo.jsx
    src/Invitations.jsx
    src/Auth.jsx          (minor loading polish if needed)
    src/Form.jsx          (optional disabled label)
    src/styles.css
    docs/ARCHITECTURE.md
    README.md

---

Plan completed 2026-07-03.
