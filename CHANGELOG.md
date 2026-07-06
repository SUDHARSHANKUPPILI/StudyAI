# Changelog

All notable changes to the **StudyAI** project are documented in this file.

---

## [2.0.0] - Production Release & Security Hardening (Current)

### Added
- **Firebase Google Authentication**: Integrated Google Sign-In as the primary authentication provider using `signInWithPopup(auth, googleProvider)`.
- **Session Observer**: Added `onAuthStateChanged` to dynamically monitor token state, refresh tokens, and preserve user credentials across reloads.
- **Server-Side Token Verification**: Secure cryptographical token verification on the backend using `auth.verify_id_token(token)` via the Firebase Admin SDK.
- **Environment Service Account Keys**: Supported injecting the entire service account credentials JSON string via `FIREBASE_CREDENTIALS_JSON` on Render.
- **Render Python Version Pinned**: Configured `.python-version` and `PYTHON_VERSION` in `render.yaml` to pin Python to `3.11.9`, resolving the new `pydantic-core` compiler error.
- **Project Structure Cleanup**: Deleted obsolete App Engine folders (`hello-gae/`) and test Java files (`FactorialRange.java`, `nest.java`, etc.) to keep the codebase focused.

---

## [1.2.0] - DevOps & Git Setup

### Added
- **Render Blueprints**: Generated `render.yaml` in the root workspace to automate multi-service cloud builds.
- **Root Gitignore**: Added custom exclusions for `.env`, cache folders, and private credentials.
- **Local Dev Tunnel**: Implemented reverse SSH tunnel shell commands via `localhost.run` for external testing of local dev ports.
- **Startup Configuration Verifier**: Implemented `verify_startup_config` inside `backend/config.py` to assert vital variables are present at boot.

---

## [1.1.0] - AI Services & Formatting Refinement

### Added
- **Marked Markdown Rendering**: Replaced manual regex matching with `marked.js` to render summaries and study guides cleanly.
- **Context-Aware AI Tutor**: Linked `material_id` to conversational routes. The backend now retrieves the study document text dynamically and appends it to the LLM system prompt context.
- **Groq JSON Array Extraction**: Refactored `generate_flashcards` and `generate_quiz` inside `groq_service.py` to extract raw arrays from nested JSON shapes.

---

## [1.0.0] - Initial Release

### Added
- **Flask REST API**: Minimal factory-pattern backend.
- **React UI**: Basic mock-themed interface.
- **Document Extractors**: Document ingestion logic using PyPDF and python-docx.
- **Firebase client stub**: Basic in-memory fallback helper.
