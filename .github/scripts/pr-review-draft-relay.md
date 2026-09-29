# Private PR review drafts: public relay

The workflow in `.github/workflows/pr-review-draft-relay.yml` relays **IDs only** for new inline review comments, submitted reviews, and top-level PR comments on open BabylonJS/Babylon.js pull requests authored by GitHub user ID `4152247` (`Popov72`). It does not send reviewer text, call an AI model, modify PR code, or post comments. The separate worker and draft reports belong in the **private** `Popov72/pr-review-drafts` repository; do not move its agent workflow or artifacts here. A public Actions artifact would not keep drafts private.

Before merging/enabling the relay:

1. Install and validate the private worker on its default branch. Check its owner access, model billing, notice credential, draft storage, and output privacy first.
2. An authorized BabylonJS administrator must create the Actions secret `PR_REVIEW_DISPATCH_TOKEN` with a **dedicated, narrowly scoped** credential that can call `POST /repos/Popov72/pr-review-drafts/dispatches` (fine-grained PAT: private draft repository **Contents: write**; a GitHub App installation token with equivalent access is also suitable). Do not use a broad OAuth session token or commit the credential. The source workflow's `GITHUB_TOKEN` can read BabylonJS pull requests but cannot dispatch to another repository.
3. Verify BabylonJS Actions policy permits the workflow, then test an eligible PR review and check the private report and the fixed public notice. GitHub does not run a comment-event workflow until the workflow file is on the default branch.

The relay rejects bot and PR-author comments; the private worker must independently revalidate all event IDs, author identity, PR head SHA, review freshness, and publication state. Fork PR code must be treated as untrusted data, never executed in a privileged job. Missing credentials fail eligible events explicitly instead of producing a success-shaped result. Avoid posting draft replies, creating pending reviews, or changing the PR branch before the author manually approves and applies a proposal.

References: [GitHub Actions review/comment events](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows), [repository dispatch permissions](https://docs.github.com/en/rest/repos/repos#create-a-repository-dispatch-event), [Actions artifact access](https://docs.github.com/en/rest/actions/artifacts).
