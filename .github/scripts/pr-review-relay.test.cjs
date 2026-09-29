const assert = require("node:assert/strict");
const test = require("node:test");
const { makeDispatchPayload, SOURCE_REPOSITORY, DRAFT_REPOSITORY } = require("./pr-review-relay.cjs");

const pullRequest = {
    number: 42,
    state: "open",
    user: { id: 4152247 },
    base: { repo: { full_name: SOURCE_REPOSITORY } },
    head: { sha: "a".repeat(40) },
};
const repository = { id: 11007313, full_name: SOURCE_REPOSITORY };
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
        source_repository_id: 11007313,
        source_owner: "BabylonJS",
        source_repo: "Babylon.js",
        pr_number: 42,
        kind: "review_comment",
        event_id: 100,
    });
});

test("relays a submitted review and top-level PR comment with exactly six IDs", () => {
    const review = { repository, sender, action: "submitted", pull_request: { number: 42 }, review: { id: 201, user: reviewer, body: "Please fix this" } };
    const comment = { repository, sender, action: "created", issue: { number: 42, pull_request: {} }, comment: { id: 301, user: reviewer } };
    for (const [eventName, input, kind, eventId] of [
        ["pull_request_review", review, "review", 201],
        ["issue_comment", comment, "issue_comment", 301],
    ]) {
        assert.deepEqual(makeDispatchPayload(eventName, input, pullRequest), {
            source_repository_id: 11007313,
            source_owner: "BabylonJS",
            source_repo: "Babylon.js",
            pr_number: 42,
            kind,
            event_id: eventId,
        });
    }
});

test("skips submitted reviews without a nonempty body", () => {
    const event = { repository, sender, action: "submitted", pull_request: { number: 42 }, review: { id: 200, user: reviewer } };
    for (const body of [undefined, null, "", " \n\t"]) {
        assert.equal(makeDispatchPayload("pull_request_review", { ...event, review: { ...event.review, body } }, pullRequest), null);
    }
    assert.equal(makeDispatchPayload("pull_request_review", { ...event, review: { ...event.review, body: " Feedback " } }, pullRequest).event_id, 200);
});

test("ignores regular issue comments, own comments, bot comments, notices, and unrelated events", () => {
    const event = { repository, sender, action: "created", issue: { number: 42 }, comment: { id: 301, user: reviewer } };
    assert.equal(makeDispatchPayload("issue_comment", event, pullRequest), null);
    event.issue.pull_request = {};
    event.comment.user = { id: 4152247, type: "User" };
    assert.equal(makeDispatchPayload("issue_comment", event, pullRequest), null);
    event.comment.user = reviewer;
    event.sender = { type: "Bot" };
    assert.equal(makeDispatchPayload("issue_comment", event, pullRequest), null);
    event.sender = sender;
    event.comment.body = "Report ready <!-- pr-response-notice:11007313-review_comment-123 -->";
    assert.equal(makeDispatchPayload("issue_comment", event, pullRequest), null);
    event.comment.body = "";
    event.comment.user = { id: 55, type: "Bot" };
    assert.equal(makeDispatchPayload("issue_comment", event, pullRequest), null);
    assert.equal(makeDispatchPayload("pull_request", event, pullRequest), null);
});

test("ignores other authors, other base repositories, closed PRs, and malformed IDs", () => {
    const event = { repository, sender, action: "submitted", pull_request: { number: 42 }, review: { id: 201, user: reviewer, body: "Please fix this" } };
    assert.equal(makeDispatchPayload("pull_request_review", event, { ...pullRequest, user: { id: 1 } }), null);
    assert.equal(makeDispatchPayload("pull_request_review", event, { ...pullRequest, base: { repo: { full_name: "fork/repo" } } }), null);
    assert.equal(makeDispatchPayload("pull_request_review", event, { ...pullRequest, state: "closed" }), null);
    assert.equal(makeDispatchPayload("pull_request_review", { ...event, repository: { ...repository, full_name: "fork/repo" } }, pullRequest), null);
    assert.equal(makeDispatchPayload("pull_request_review", { ...event, review: { ...event.review, id: "201" } }, pullRequest), null);
    assert.equal(makeDispatchPayload("pull_request_review", { ...event, repository: { ...repository, id: 1 } }, pullRequest), null);
});

test("fork PRs are read through the base repository without executing fork code", () => {
    const event = { repository, sender, action: "submitted", pull_request: { number: 42 }, review: { id: 201, user: reviewer } };
    assert.equal(
        makeDispatchPayload("pull_request_review", { ...event, review: { ...event.review, body: "Please adjust this" } }, {
            ...pullRequest,
            head: { sha: "b".repeat(40), repo: { full_name: "someone/fork" } },
        }).event_id,
        201
    );
});

test("ignores edit events and malformed reviewers", () => {
    const event = { repository, sender, action: "edited", pull_request: { number: 42 }, review: { id: 201, user: reviewer, body: "Please fix this" } };
    assert.equal(makeDispatchPayload("pull_request_review", event, pullRequest), null);
    event.action = "submitted";
    event.review.user = null;
    assert.equal(makeDispatchPayload("pull_request_review", event, pullRequest), null);
});

test("targets the private response worker with its versioned event type", () => {
    const workflow = require("node:fs").readFileSync(require("node:path").join(__dirname, "../workflows/pr-review-draft-relay.yml"), "utf8");
    assert.equal(DRAFT_REPOSITORY, "Popov72/pr-response-drafts");
    assert.match(workflow, /event_type: "pr-response-request-v1"/);
    assert.match(workflow, /client_payload: payload/);
});
