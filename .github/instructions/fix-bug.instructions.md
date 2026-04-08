# Fix Bug Instructions

When fixing a bug, the input may be a GitHub issue number (e.g. `#1234` or just `1234`).
If an issue number is provided:

1. **Look up the issue** on the public GitHub repository (`BabylonJS/Babylon.js`) using
   the GitHub tools. Read the issue title, body, and comments to understand the bug.
2. **Extract repro information** — Bug reports follow a template with these sections:
   - **Repro** — a playground link and/or steps to reproduce.
   - **Expected result** — what should happen.
   - **Current result** — what actually happens.
   - **Screenshots** — visual evidence, if any.
   - **Additional context** — environment details, related issues, etc.
3. **Check issue comments** for additional context, workarounds, or narrowed-down root
   causes contributed by community members or maintainers.
4. **Use the repro information** to understand the failure, write a regression test that
   demonstrates the bug, confirm the test fails, then fix the bug.

If the input is a description of a bug rather than an issue number, proceed directly with
the description as-is.
