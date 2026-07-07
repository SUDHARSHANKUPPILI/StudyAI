# Security Policy — StudyAI

## Multi-Tenant Data Isolation

StudyAI enforces **strict user-level data isolation** across all backend services. Every authenticated user can only access their own data. No user can read, modify, or delete another user's resources.

### Architecture

```
┌──────────────┐     Firebase ID Token     ┌──────────────────┐
│  React SPA   │ ────────────────────────▶  │  Flask Backend   │
│  (Vercel)    │                            │  (Render)        │
└──────────────┘                            └────────┬─────────┘
                                                     │
                                            verify_id_token()
                                                     │
                                            ┌────────▼─────────┐
                                            │  Firebase Admin   │
                                            │  SDK (Firestore)  │
                                            └──────────────────┘
```

### How It Works

1. **Authentication**: Firebase Google Sign-In issues an ID token on the frontend.
2. **Token Verification**: The backend `auth_required` decorator calls `firebase_admin.auth.verify_id_token()` to extract the authenticated user's `uid`.
3. **Ownership Tagging**: Every document created in Firestore includes an `ownerUid` field set to the authenticated user's Firebase UID.
4. **Query Scoping**: Every read query filters by `ownerUid == request.user["uid"]`.
5. **Ownership Verification**: Every update/delete operation verifies that the target document's `ownerUid` matches the requesting user's UID before proceeding.

### Collections Protected

| Collection | Isolation Method |
|---|---|
| `users` | Document ID = UID, `ownerUid` field verified on read |
| `materials` | `ownerUid` field, scoped queries, ownership check on update |
| `summaries` | Composite key `{uid}_{materialId}`, `ownerUid` field |
| `flashcards` | Composite key `{uid}_{materialId}`, `ownerUid` field |
| `quizzes` | `ownerUid` field, scoped queries |
| `quiz_results` | `ownerUid` field, scoped queries |
| `study_plans` | Document ID = UID, `ownerUid` field verified on read |
| `analytics` | Document ID = UID, `ownerUid` field verified on read |
| `conversations` | Document ID = UID, `ownerUid` field verified on read/write |

### Firebase Storage Isolation

Upload paths are namespaced by user UID:

```
uploads/{uid}/{filename}
```

This prevents file path collisions and ensures storage-level tenant separation.

### Document Schema

Every Firestore document contains:

| Field | Type | Description |
|---|---|---|
| `ownerUid` | `string` | Firebase UID of the document owner |
| `ownerEmail` | `string` | Email address of the document owner (optional) |
| `createdAt` | `string` | ISO 8601 timestamp of document creation |
| `updatedAt` | `string` | ISO 8601 timestamp of last modification |

### Ownership Violation Handling

- **Read**: Returns empty results (no data leakage).
- **Update**: Returns `false` and logs a warning.
- **AI Generation**: Returns HTTP 400 with `OWNERSHIP_VIOLATION` error code.
- **Chat**: Returns empty message history if ownership mismatch.

## Reporting Vulnerabilities

If you discover a security vulnerability, please open a GitHub issue or contact the maintainer directly.

## Environment Variables

All sensitive configuration is stored in environment variables:

| Variable | Description |
|---|---|
| `GROQ_API_KEY` | Groq API key for Llama 3.3 |
| `FIREBASE_SERVICE_ACCOUNT_KEY` | Firebase Admin SDK service account JSON |
| `JWT_SECRET_KEY` | JWT signing secret |
| `FIREBASE_STORAGE_BUCKET` | Firebase Storage bucket name |

**No secrets are hardcoded in source code.**
