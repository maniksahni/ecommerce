# Firestore gRPC security override

## Change

The Firebase 12.18.0 Node SDK resolves `@firebase/firestore@4.17.1` to `@grpc/grpc-js@1.9.16`. This produced four dependency-chain findings from two gRPC advisories. A scoped npm override replaces only Firestore's gRPC dependency with 1.14.6.

Preserved installed versions: Firebase 12.18.0, Firebase Admin 14.5.0, Firestore 4.17.1. Admin's existing gRPC 1.14.5 paths remain unchanged. No 1.9.16 copy remains in the installed tree or lockfile. No production configuration, routes, catalogue or storefront code changed.

Advisories: [authentication context](https://github.com/advisories/GHSA-m9gg-hp2v-232j) and [error disclosure](https://github.com/advisories/GHSA-f596-whhp-79r4). Their patched release lines include 1.14.5; the overridden path uses 1.14.6.

## Validation

- `npm install --package-lock-only`, followed by clean `npm ci`: successful.
- `npm ls @grpc/grpc-js --all`: Firestore 1.14.6; Admin paths 1.14.5; no vulnerable nested copy.
- `npm audit` and `npm audit --omit=dev`: zero reported vulnerabilities at verification time.
- `npm test`: catalogue, admin and security suites passed.
- `npm run test:mobile` against localhost: 502 checks, zero failures across 11 mobile/tablet sizes, all catalogue detail pages and authenticated read-only admin screens.
- `npm run build`: successful; 114 product routes and 15 collection routes generated.
- `npm run test:grpc`: actual installed Node Firebase SDK with local Authentication/Firestore emulators and the repository's Firestore rules. Passed unauthenticated write denial, administrator account creation/authentication, read/write, transaction, realtime listener, deletion, sign-out access revocation and fresh sign-in.
- `npm run test:realtime` against localhost: 32 Chrome/WebKit checks passed. Covers cloud catalogue add/edit/delete, price changes, sold-out/restock, cart pricing, checkout rejection, order creation/confirmation and tracking. This suite uses browser fixtures, not production writes.

The public browser currently imports its Firebase SDK from Google's CDN, so browser checks alone do not validate the npm gRPC override. The emulator test specifically exercises the affected Node SDK/gRPC transport. Mobile tests also exercise existing production authentication and catalogue reads; this change makes no production writes.

## Reproduce the transport test

Run `npm run test:grpc` with a supported Java installation available in PATH (verified here with Java 22) for Firebase emulators. It uses only the `demo-shivara-grpc` project and checks loopback emulator endpoints before initializing the SDK. No live credentials are required. Its expected permission-denied logs verify access controls.

Keep this override until an upstream Firestore release resolves to a patched gRPC version. Before removing it, regenerate the lockfile and rerun audits, the transport test and commerce checks.

This branch is prepared for PR review only. It has not been merged or deployed.
