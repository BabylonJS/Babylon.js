const assert = require("node:assert/strict");
const test = require("node:test");
const { makeDispatchPayload, SOURCE_REPOSITORY } = require("./pr-review-relay.cjs");

const pullRequest = {
    number: 42,
    state: "open",
    user: { id: 4152247 },
    base: { repo: { full_name: SOURCE_REPOSITORY } },
    head: { sha: "a".repeat(40) },
};
const repository = { full_name: SOURCE_REPOSITORY };
const sender = { type: "User" };
const reviewer = { id: 123, type: "User" };

test("relays an inline review comment without its body", () => {
    const event = {
        repository,
        sender,
        action: "created",
        pull_request: { number: 42 },
        comment: { id: 100, pull_request_review_id: 200, user: reviewer, body: "private draft input" },
    };
    assert.deepEqual(makeDispatchPayload("pull_request_review_comment", event, pullRequest), {
        source_repository: SOURCE_REPOSITORY,
        pr_number: 42,
        kind: "review_comment",
        event_id: "review:200",
        review_id: 200,
        source_comment_id: 100,
        head_sha: "a".repeat(40),
    });
});

test("relays a submitted review and top-level PR comment", () => {
    const review = { repository, sender, action: "submitted", pull_request: { number: 42 }, review: { id: 201, user: reviewer } };
    const comment = { repository, sender, action: "created", issue: { number: 42, pull_request: {} }, comment: { id: 301, user: reviewer } };
    assert.equal(makeDispatchPayload("pull_request_review", review, pullRequest).event_id, "review:201");
    assert.equal(makeDispatchPayload("issue_comment", comment, pullRequest).event_id, "issue_comment:301");
});

test("coalesces the submitted review and its inline comments under one event ID", () => {
    const review = { repository, sender, action: "submitted", pull_request: { number: 42 }, review: { id: 200, user: reviewer } };
    const comment = {
        repository,
        sender,
        action: "created",
        pull_request: { number: 42 },
        comment: { id: 100, pull_request_review_id: 200, user: reviewer },
    };
    assert.equal(makeDispatchPayload("pull_request_review", review, pullRequest).event_id, makeDispatchPayload("pull_request_review_comment", comment, pullRequest).event_id);
});

test("ignores regular issue comments, own comments, bot comments, and unrelated events", () => {
    const event = { repository, sender, action: "created", issue: { number: 42 }, comment: { id: 301, user: reviewer } };
    assert.equal(makeDispatchPayload("issue_comment", event, pullRequest), null);
    event.issue.pull_request = {};
    event.comment.user = { id: 4152247, type: "User" };
    assert.equal(makeDispatchPayload("issue_comment", event, pullRequest), null);
    event.comment.user = reviewer;
    event.sender = { type: "Bot" };
    assert.equal(makeDispatchPayload("issue_comment", event, pullRequest), null);
    assert.equal(makeDispatchPayload("pull_request", event, pullRequest), null);
});

test("ignores other authors, other base repositories, closed PRs, and malformed IDs", () => {
    const event = { repository, sender, action: "submitted", pull_request: { number: 42 }, review: { id: 201, user: reviewer } };
    assert.equal(makeDispatchPayload("pull_request_review", event, { ...pullRequest, user: { id: 1 } }), null);
    assert.equal(makeDispatchPayload("pull_request_review", event, { ...pullRequest, base: { repo: { full_name: "fork/repo" } } }), null);
    assert.equal(makeDispatchPayload("pull_request_review", event, { ...pullRequest, state: "closed" }), null);
    assert.equal(makeDispatchPayload("pull_request_review", { ...event, review: { id: "201", user: reviewer } }, pullRequest), null);
});

test("fork PRs are read through the base repository without executing fork code", () => {
    const event = { repository, sender, action: "submitted", pull_request: { number: 42 }, review: { id: 201, user: reviewer } };
    assert.equal(
        makeDispatchPayload("pull_request_review", event, { ...pullRequest, head: { sha: "b".repeat(40), repo: { full_name: "someone/fork" } } }).head_sha,
        "b".repeat(40)
    );
});

test("ignores edit events and malformed reviewers", () => {
    const event = { repository, sender, action: "edited", pull_request: { number: 42 }, review: { id: 201, user: reviewer } };
    assert.equal(makeDispatchPayload("pull_request_review", event, pullRequest), null);
    event.action = "submitted";
    event.review.user = null;
    assert.equal(makeDispatchPayload("pull_request_review", event, pullRequest), null);
});
