---
applyTo: "packages/dev/**/*.{ts,tsx}"
---

# Function.bind

The use of `Function.bind` is prohibited in this codebase due to its negative impact on performance. Instead of using `bind`, use arrow functions or other alternatives to maintain the correct `this` context without incurring the overhead of `bind`. When reviewing code, flag any usage of `Function.bind` and suggest refactoring to avoid it.
