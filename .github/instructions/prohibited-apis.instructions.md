---
applyTo: "packages/dev/**/*.{ts,tsx}"
---

# Function.bind

The use of `Function.bind` is prohibited in this codebase due to its negative impact on performance. Instead of using `bind`, use arrow functions or other alternatives to maintain the correct `this` context without incurring the overhead of `bind`. When reviewing code, flag any usage of `Function.bind` and suggest refactoring to avoid it.

# Deprecated APIs

Never call or reference functions, methods, properties, or classes marked with `@deprecated` in their JSDoc/TSDoc comments. The TypeScript compiler and most editors show deprecated symbols with a ~~strikethrough~~, but this is only a visual hint — it does **not** produce a compile error, so extra vigilance is required.

When writing or reviewing code:

1. **Check before you use** — inspect the documentation of any API you are about to call. If it carries a `@deprecated` tag, do not use it.
2. **Use the recommended replacement** — the deprecation notice almost always names the successor API. Use that instead. If no replacement is documented, ask the user for guidance before proceeding.
3. **Do not introduce new calls to deprecated APIs** — even if existing code in the same file already calls them. New code must use the current API.
4. **Do not suppress deprecation warnings** — if a linter or editor flags a deprecated usage, fix it rather than silencing the warning.
5. **When reviewing code, flag any usage of a deprecated API** and suggest the recommended replacement.
