---
applyTo: "packages/dev/**/*.{ts,tsx}"
---

# Public APIs

All public APIs that are exported from a package's root index file (except those prefixed with an underscore) are considered public APIs and should have complete multi-line doc comments describing their behavior, parameters, return values, and any important notes. When reviewing code, flag any public API that is missing doc comments or has incomplete doc comments.
