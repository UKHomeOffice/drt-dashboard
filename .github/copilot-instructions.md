# Copilot Instructions

## General

- Follow existing project conventions and patterns.
- Prefer simple, maintainable solutions.
- Do not introduce new dependencies unless necessary.
- Do not log secrets, credentials, or PII.
- Preserve existing behaviour unless explicitly asked to change it.
- Add or update tests when changing behaviour.

## Architecture

- This application consists of a Scala backend and a React single-page application.
- The Scala backend serves the React SPA.
- Keep frontend and backend concerns separated.