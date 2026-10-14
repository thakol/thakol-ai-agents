---
trigger: model_decision
description: Integrate thakol.io (OIDC / Keycloak) authentication — login, logout, token validation, redirect setup, and choosing a thakol-samples starter.
---

<!-- BEGIN:thakol-core -->

# Thakol.io authentication integration

You are helping a developer add **thakol.io** authentication to their application, or
adapt one of the official thakol starter samples. Thakol is an authentication SaaS built
on a multi-tenant **Keycloak** core and exposed over standard **OpenID Connect (OIDC)**.
If you know OIDC, you already know how to integrate thakol — this guide gives you the
exact values, endpoints, per-stack recipes, and the security rules that matter.

Two things you can do:

1. **Integrate** — wire thakol login, logout, and token validation into the developer's own app.
2. **Navigate the samples** — point them at the right runnable starter and explain how to run it.

Always prefer the OIDC **discovery document** and the developer's real dashboard values over
anything hardcoded. Never invent a client ID, secret, realm, or redirect URI — ask for it or
read it from their environment.

## Configuration values (from the Thakol dashboard)

Every integration needs these. The developer gets them at <https://thakol.io> → their workspace.

| Value | Meaning | Example |
| --- | --- | --- |
| **Issuer / Authority** | The workspace realm URL. This is the OIDC issuer. | `https://auth.thakol.io/realms/YOUR_REALM` |
| **Client ID** | The OIDC client registered for this app. | `my-web-app` |
| **Client Secret** | Confidential (server-side) clients only. **Never** ship it to a browser. | `••••••••` |
| **Redirect URI** | Where thakol sends the user back after login. Must **exactly** match a value registered on the client. | `http://localhost:3000/api/auth/callback` |

Local development can point the issuer at a local Keycloak instead:
`http://localhost:8080/realms/YOUR_REALM`.

## Dashboard setup (do this first)

1. **Request workspace access** at <https://thakol.io>. Access is invitation-only/approval-gated; the request itself provisions nothing. Wait for platform approval, complete the owner setup email, then use the active workspace dashboard.
2. **Create an OIDC client** for the app. Choose the client type by where the code runs:
   - **Public** client for browser-only SPAs (no secret; PKCE required).
   - **Confidential** client for anything with a server (has a secret).
3. **Register the exact Redirect URI(s)** the app will use (and post-logout redirect URIs).
4. For SPAs, **set Web Origins** to the app's origin for CORS (e.g. `http://localhost:3000`).
5. **Copy the discovery URL**: `<ISSUER>/.well-known/openid-configuration`.

## Hosted passwordless methods

Workspace owners can enable **Email code (passwordless)** and **Email login link (passwordless)**
under Settings → Advanced → Sign-In Methods. Codes and links have independent signup permissions;
creating new application users additionally requires application self-registration. Email proof
creates an application account only after successful verification, not a dashboard administrator.

Use the same OIDC authorization redirect and callback for password, OTP and links. Do not build a
separate passwordless token endpoint, collect a Thakol password/code in the app, forward a magic
link to a backend, or remove PKCE/state checks. The hosted page handles the credential method.
Codes and links expire after five minutes and are single-use. Links open in the original browser
and profile, show the email address, and require **Confirm sign-in**; GET/HEAD previews do not log
in. If the app stores OIDC state per tab, use the original sign-in tab. Never log sign-in links,
codes, callback codes or full tokens.

Enrolled authenticator-app users are challenged after primary login. **Known rollout gap:** the
workspace require-TOTP-for-every-user setting currently misses existing unenrolled application
users. Confirm enrollment explicitly and check the latest roadmap before claiming universal MFA.
Passkeys, SMS and guided SAML are planned, not supported options to fabricate in an integration.

Guides: <https://thakol.io/docs/email-otp>, <https://thakol.io/docs/email-links>,
<https://thakol.io/roadmap>. Real inbox and client callback verification are rollout requirements.

## Endpoints

Fetch these from discovery rather than hardcoding — they are stable but discovery is the contract:

```
GET  <ISSUER>/.well-known/openid-configuration
```

returns (Keycloak paths shown for reference):

| Endpoint | Purpose | Path |
| --- | --- | --- |
| `authorization_endpoint` | Start login | `<ISSUER>/protocol/openid-connect/auth` |
| `token_endpoint` | Exchange code for tokens | `<ISSUER>/protocol/openid-connect/token` |
| `userinfo_endpoint` | Fetch profile claims | `<ISSUER>/protocol/openid-connect/userinfo` |
| `jwks_uri` | Public keys for token signature verification | `<ISSUER>/protocol/openid-connect/certs` |
| `end_session_endpoint` | Logout | `<ISSUER>/protocol/openid-connect/logout` |

Scopes: request `openid profile email`, plus `offline_access` if you need refresh tokens.

## Pick the flow by where the code runs

| App shape | Client type | Flow | Golden rule |
| --- | --- | --- | --- |
| **Browser SPA** (React, Angular, vanilla) | Public | Authorization Code **+ PKCE** | No client secret in the browser. Ever. |
| **Fullstack** (Next.js, server-rendered) | Confidential | Authorization Code, server-side session | Secret and tokens stay on the server. |
| **Backend / API** (Express, FastAPI, Go) | Confidential | Validate incoming bearer JWTs via JWKS | Verify signature, `iss`, `aud`, `exp` on every request. |

## Per-stack recipes (each maps to a runnable sample)

Match the developer's stack to the sample that already implements it, mirror its structure,
and fill in their dashboard values. All samples: <https://github.com/thakol/thakol-samples>

| Stack | Sample | Auth library | Notes |
| --- | --- | --- | --- |
| Vanilla JS SPA | [`vanilla-js`](https://github.com/thakol/thakol-samples/tree/main/vanilla-js) | `oidc-client-ts` | Auth Code + PKCE, token storage |
| React SPA | [`react-js`](https://github.com/thakol/thakol-samples/tree/main/react-js) | `oidc-client-ts` | `useAuth` hook, context provider |
| Angular SPA | [`angular`](https://github.com/thakol/thakol-samples/tree/main/angular) | `angular-oauth2-oidc` | Route guards, user claims |
| Next.js (App Router) | [`nextjs`](https://github.com/thakol/thakol-samples/tree/main/nextjs) | `next-auth` (Auth.js) | Server/client session gating |
| Node / Express API | [`nodejs-express`](https://github.com/thakol/thakol-samples/tree/main/nodejs-express) | `express-openid-connect` | Server sessions, API middleware |
| Python / FastAPI | [`python-fastapi`](https://github.com/thakol/thakol-samples/tree/main/python-fastapi) | `authlib` | Login/callback + token verify |
| Go / net/http | [`go-http`](https://github.com/thakol/thakol-samples/tree/main/go-http) | `go-oidc` + `oauth2` | Manual state + JWKS verification |

If the developer's framework isn't listed, pick the closest by shape (SPA → `react-js`,
fullstack → `nextjs`, API → the language's backend sample) and adapt.

## Validating tokens on a backend

For any API that trusts a thakol access token, on **every** request:

1. Read the `Authorization: Bearer <jwt>`.
2. Verify the signature against `jwks_uri` (cache the JWKS; keys rotate).
3. Check `iss` equals your issuer exactly, `aud` includes your client/API, and `exp` is in the future.
4. Authorize on claims (`realm_access.roles`, `scope`, `email_verified`) — never trust an unverified token body.

Never accept a token just because it decodes. Decoding is not verification.

## Logout

Redirect the user to `end_session_endpoint` with `id_token_hint=<id_token>` and
`post_logout_redirect_uri=<registered-url>`, then clear the local/server session. The
post-logout URL must be registered on the client, exactly.

## Security rules (do / don't)

- **Do** use Authorization Code + PKCE for browser SPAs; **don't** use the implicit flow.
- **Don't** put the client secret in any browser-delivered code, public repo, or `NEXT_PUBLIC_*` var.
- **Do** register redirect URIs and web origins **exactly** — no trailing slash on web origins
  (`https://app.example.com`, not `https://app.example.com/`), or CORS will silently fail.
- **Do** serve over HTTPS in production and set cookies `HttpOnly`, `Secure`, `SameSite`.
- **Do** validate `iss`/`aud`/`exp` and the signature on every API call.
- **Do** keep access-token lifetimes short and use refresh tokens (`offline_access`) server-side.
- **Do** rotate a client secret immediately if it is ever exposed.

## Common errors and fixes

| Symptom | Cause | Fix |
| --- | --- | --- |
| `Invalid parameter: redirect_uri` | The app's redirect URI isn't registered, or differs (scheme/port/trailing slash). | Register the exact URI on the client in the dashboard. |
| `unauthorized_client` / `invalid_client` | Wrong client ID, wrong secret, or public/confidential mismatch. | Recheck client ID/secret and the client's access type. |
| CORS error on token/userinfo from a SPA | Web Origins not set (or has a trailing slash). | Add the app origin to Web Origins, exact, no trailing slash. |
| `PKCE code challenge required` | Public client without PKCE. | Enable PKCE in the OIDC library (S256). |
| API rejects a valid-looking token | `aud`/`iss` mismatch or unverified signature. | Verify against `jwks_uri` and check `iss`/`aud`. |

## Usage / billing note

Thakol records successful LOGIN/REGISTER events as **1 usage token** each
from the workspace's balance. The free launch plan includes a **1,000,000-token grant**, and
during launch authentication continues to succeed even at a zero balance — so integration and
testing are never blocked by usage. The developer can watch usage on the dashboard. Sends, resends, failed proofs and link previews do not count as successful authentication. Delivery is currently best effort; do not implement paid-billing guarantees from this counter.

## How to work with the developer

1. Identify the stack and where auth code runs (browser vs server vs API).
2. Confirm they have created a workspace + OIDC client and have the issuer, client ID,
   (secret if confidential), and a redirect URI.
3. Point them at the matching sample; mirror its structure in their app.
4. Put secrets in environment variables, never in source or client bundles.
5. Register the redirect URI(s) and web origins in the dashboard, exactly.
6. Verify end to end: login → callback → session/token → protected resource → logout. For passwordless, also test controlled-inbox delivery, invalid/expired proof, link confirmation/replay and recovery. Test both enrolled and unenrolled users if MFA is required.

<!-- END:thakol-core -->
