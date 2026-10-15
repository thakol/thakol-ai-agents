# Thakol.io AI-assistant agents

Drop-in **agents / skills for your AI coding assistant** that teach it to integrate
[thakol.io](https://thakol.io) authentication into your app — and to point you at the right
runnable starter from [`thakol-samples`](https://github.com/thakol/thakol-samples).

Thakol is an authentication SaaS on a multi-tenant **Keycloak** core, exposed over standard
**OpenID Connect**. These files give your assistant the exact endpoints, per-stack recipes,
and security rules so it can wire up login, logout, and token validation correctly the first time.

## What each agent can do

- **Integrate** thakol auth into *your* app: pick the flow for your stack (SPA + PKCE,
  fullstack, or backend API), set redirect URIs and web origins, validate tokens, handle logout.
- **Passwordless methods**: use the hosted OTP/link page through the same OIDC flow, including original-browser confirmation and signup permissions.
- **Navigate the samples**: choose the matching starter and explain how to run it.

## Install

Pick your platform. Each installs one small, self-contained set of files into your project.

| Platform | One-liner | Or copy this folder |
| --- | --- | --- |
| **Claude Code** | `curl -fsSL https://raw.githubusercontent.com/thakol/thakol-ai-agents/main/install.sh \| sh -s -- claude` | [`claude/`](./claude) → `.claude/` |
| **GitHub Copilot** | `… \| sh -s -- copilot` | [`copilot/`](./copilot) → `.github/` |
| **Codex / AGENTS.md** | `… \| sh -s -- codex` | [`codex/`](./codex) → `AGENTS.md` |
| **Cursor** | `… \| sh -s -- cursor` | [`cursor/`](./cursor) → `.cursor/` |
| **Windsurf** | `… \| sh -s -- windsurf` | [`windsurf/`](./windsurf) → `.windsurf/` |
| **Gemini CLI** | `… \| sh -s -- gemini` | [`gemini/`](./gemini) → `GEMINI.md` |

**Manual install:** clone this repo and copy the contents of your platform's folder into your
project root — the folder already mirrors the exact paths the files need (`.github/…`,
`.cursor/…`, `AGENTS.md`, etc.). Then restart your assistant.

```sh
git clone https://github.com/thakol/thakol-ai-agents
cp -R thakol-ai-agents/copilot/. my-project/      # example: Copilot
# or run the installer from the clone:
thakol-ai-agents/install.sh copilot my-project
```

## Then

1. Request access at <https://thakol.io>, wait for approval, complete the owner setup email, then create an OIDC client in your active workspace.
2. Grab your **issuer** (`https://auth.thakol.io/realms/YOUR_REALM`), **client ID**,
   **client secret** (confidential clients only), and a **redirect URI**.
3. Ask your assistant: *"Add thakol authentication to this app."*

## Repository layout

```
shared/thakol-auth-agent.md   ← single source of truth (edit here)
build.mjs                     ← regenerates every platform file from the source
claude/  copilot/  codex/  cursor/  windsurf/  gemini/   ← per-platform, generated
install.sh                    ← per-platform installer (local clone or curl)
```

Every platform file carries the same content between `<!-- BEGIN:thakol-core -->` and
`<!-- END:thakol-core -->` markers. **Edit only `shared/thakol-auth-agent.md`**, then run:

```sh
npm run build      # regenerate all platform files
npm run check      # CI: fail if any platform file is out of date
```

CI (`.github/workflows/verify.yml`) enforces that the platform files stay in sync.

## Related

- **Runnable samples:** <https://github.com/thakol/thakol-samples>
- **Docs & OIDC reference:** <https://thakol.io>

## License

MIT — see [LICENSE](./LICENSE).

Managed social login and reCAPTCHA support Thakol defaults, customer-owned credentials, and disabled mode. The generated guides explain configuration, shared broker identities, mandatory MFA, and unchanged customer OIDC issuers. See [setup](https://thakol.io/docs/managed-auth).
