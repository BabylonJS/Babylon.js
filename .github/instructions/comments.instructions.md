---
applyTo: "packages/dev/**/*.{ts,tsx}"
---

# Doc Comments

Public APIs should have complete multi-line doc comments describing their behavior, parameters, return values, and any important notes. When reviewing code, flag any public API that is missing doc comments or has incomplete or inaccurate doc comments. In particular, verify that doc comments accurately describe what the function actually does — a comment that describes behavior belonging to a different function or a different call site is worse than no comment at all.
