# AI provider architecture

## Product doctrine

**AI interprets intent and language. SceneAxis owns spatial truth.** The AI layer may rewrite deterministic descriptions and return optional current-shot suggestions. It does not author, patch or replace the shared Scene Graph. Positions, rotations, distance, facing, camera parameters, visibility, object identity, screen placement and depth relationships remain immutable inputs to an AI request.

## Contract

`AIProvider` exposes `generateText` and schema-validated `generateStructured`. Optional future `analyzeImage` and `generateImage` methods are declared only as capabilities. V0.98 implements text/structured calls against DeepSeek and OpenAI-compatible chat-completions endpoints.

Requests use a bounded timeout and `AbortController`, check HTTP status, validate response shape and surface concise failures. Structured generation strips an optional Markdown JSON fence, parses JSON and runs a caller-supplied validator before returning data. Provider output is never trusted as scene state.

## Secret and data boundary

The API key is entered in Settings and held only in the runtime settings store. Persistence explicitly omits it; `.jyproject`, IndexedDB, localStorage exports, logs and repository files do not receive the key. Endpoint and model preferences may persist locally because they are not secrets. Scene facts are sent only after a user explicitly requests Director Interpretation or Current Shot Suggestions.

V0.98 has no SceneAxis proxy server, telemetry or cloud storage. Browser CORS policy and provider availability therefore apply. Missing key, network error, timeout, HTTP failure or invalid response produces an inline error while retaining the deterministic local description.

## Future boundary

`StructuredShotScript` and `BlockingSolver` describe a possible future proposal workflow. A solver must return reviewable operations and may not mutate the shared Scene Graph directly. Script, Shot Planning and AI Storyboard are labeled preview-only Coming Soon modules. No autonomous solver or image generation is exposed in this release.
