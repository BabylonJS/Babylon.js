# Branch Code Review Instructions

These instructions define the review standards for a branch code review. They specify severity categories and the checklist of rules to enforce.

## Severity Categories

Classify every issue into one of these severity levels:

| Severity     | Meaning                                                                                                                                                                                                                                      |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Critical** | Bugs, runtime crashes, security vulnerabilities, data loss, broken public API contracts, missing side-effect imports that will cause `undefined` at runtime. Must be fixed.                                                                  |
| **Warning**  | Backward compatibility concerns, missing doc comments on public APIs, performance anti-patterns (render-loop allocations, unnecessary `notifyObservers`), missing tests for new APIs, use of deprecated or prohibited APIs. Should be fixed. |
| **Nit**      | Style, naming, minor readability improvements, non-essential suggestions. Fix if convenient.                                                                                                                                                 |

## Review Checklist

Review the diff against **all** of the following. For each item that references an instruction file, read that file in full before checking — it contains the detailed rules:

1. **Correctness** — logic errors, off-by-one, null/undefined access, race conditions, unhandled edge cases.
2. **Security** — injection, unsafe deserialization, prototype pollution, OWASP Top 10.
3. **Backward compatibility** — see `backcompat.instructions.md`. Flag any breaking change to a public API.
4. **Doc comments** — see `comments.instructions.md`. All new or changed public APIs must have complete multi-line doc comments.
5. **Side-effect imports** — see `side-effect-imports.instructions.md`. Any call to a prototype-augmented method on Scene/Engine/ThinEngine/AbstractEngine must have the corresponding side-effect import.
6. **Prohibited APIs** — see `prohibited-apis.instructions.md`. No `Function.bind`, no calls to deprecated APIs.
7. **Performance** — see `performance.instructions.md`. No allocations or `notifyObservers` in the render loop.
8. **Tests** — see `tests.instructions.md`. New APIs should have unit tests; visual changes should have Playwright tests.
9. **Entities** — see `entities.instructions.md`. New scene entities must be exposed in Inspector, serializer, and loader.
10. **glTF extensions** — see `gltf-extensions.instructions.md`. New glTF 2.0 extensions must be registered in the dynamic imports file.
11. **Inspector v2** — see `inspector.instructions.md`. UI code must use shared components, `makeStyles`, Fluent icons, and `ISettingsStore`.
12. **General quality** — dead code, unreachable branches, duplicated logic, overly complex control flow, poor naming.
