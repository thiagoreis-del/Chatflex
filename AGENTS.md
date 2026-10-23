<!-- LOVABLE:BEGIN -->

> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

<!-- LOVABLE:END -->

## Architecture rules

- Ticket and internal-chat uploads identify PDFs from their header and normalize filename/MIME through the shared upload helper. Why: extensionless PDFs must not arrive as generic BIN attachments.

- Conversation day separators use the message timestamp in the viewer's local calendar timezone, matching message times; compute boundaries after search filtering. Why: dates stay consistent and filtered results retain their day context without changing message order.

- VPS deploy builds on the VPS via SSH (fetch exact commit, npm build with node-server preset, PM2 reload) and writes .output/public/deploy-version.json. Why: the GitHub-built artifact flow failed in Actions; the on-VPS build is the proven path.
- System documentation lives in docs with source evidence and an explicit distinction between frontend implementation and verified external behavior. Why: manuals must remain maintainable without inventing backend contracts or exposing technical documents publicly.
- The shared library barrel imports the canonical theme and exposes TooltipProvider. Why: consumers receive base styling and the provider needed for tooltip composition.
- Delegated company exit resolves after restoring the original authenticated platform session; its backup is memory-only and successful server exit must return a non-delegated superadmin. Why: avoids stale UI logout and never persists or invents administrative credentials.
- Account password generation uses a shared browser CSPRNG helper with rejection sampling; generated passwords stay in form memory only. Why: consistent security across company and user creation without persistent credential storage.
- Company creation sends the initial administrator password as the root password field of POST /companies; confirmation is validation-only and never sent. Why: the backend requires explicit credentials, not a default password or an invitation flow.
- Queue writes use a whitelisted server payload; updates read the full queue before merging visible fields. Why: required router fields are sent without resetting hidden schedules, integrations or chatbot associations.
- AppShell owns dynamic viewport height and main scrolling; wide tables/tabs scroll locally and the ticket workspace fills the remaining height with shrinkable panes. Why: every module fits mobile browsers without clipping actions or enlarging the page.
- Folder layout follows the product context: `src/app`, `src/landing`, `src/modules/*`, `src/shared/*`, `src/mocks`; route files in `src/routes` stay thin and import pages. Why: keeps modules self-contained.
- All HTTP goes through `src/shared/api/client.ts`; endpoint paths only in `src/shared/config/endpoints.ts`; env only via `src/shared/config/env.ts`. Why: single place for auth, refresh and errors.
- Access token lives only in `src/shared/auth/token-store.ts` (memory). Why: security rule, refresh token is backend HttpOnly cookie.
- `/app` routes are `ssr: false` and gated by `ensureSession()` in `beforeLoad`. Why: session exists only in browser memory.
- Mocks are dynamically imported by the API client only when `VITE_USE_MOCKS=true`. Why: no silent fake data in production.
- All visible text in `src/shared/i18n/locales/*`; app name via `{{appName}}` default variable. Why: i18n requirement.
- Socket adapter stays disabled (`SOCKET_ENABLED`) until the backend contract is confirmed.
- Incoming message alerts mount once per AppShell session, deduplicate Socket and paginated polling by message ID, and ignore history/outgoing/private messages; browser permission and audio unlocking require user gestures. Why: reliable alerts across modules without exposing customer message text on lock screens.
- Ticket attendant filtering and reply identity defaults use shared pure selection rules; the conversation keeps its own editable sender state independent of message and draft state. Why: changing the selected sender must not clear a conversation or its draft.
- Ticket list and conversation fallback polling share a three-second interval regardless of Socket transport status; focus, visibility and network recovery invalidate ticket data, and company events refresh list/incoming queries. Why: a connected transport does not prove room-event delivery, and returning to the panel must not wait for polling.
