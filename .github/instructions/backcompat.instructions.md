---
applyTo: "packages/dev/**/*.{ts,tsx}"
---

All public APIs that are exported from a package's root index file (except those prefixed with an underscore) are considered public APIs.

# Compile-time Backward Compatibility

Public APIs should maintain backward compatibility. Changes to public APIs that would cause a compile or runtime error should be avoided. When reviewing code, check if any changes to public APIs would break backward compatibility. If so, add a review comment explaining the breaking change and suggest an alternative approach that maintains backward compatibility.

Examples of breaking changes:

- Adding a required parameter to an existing public API.
- Adding an optional parameter before existing parameters in an existing public API.
- Removing a public API.

# Runtime Backward Compatibility

Public APIs should not have breaking implementation changes. The behavior should not change in ways that would cause existing code using the API to break or behave differently. When reviewing code, check if any changes to public APIs would break runtime compatibility. If so, add a review comment explaining the breaking change and suggest an alternative approach that maintains runtime compatibility.
