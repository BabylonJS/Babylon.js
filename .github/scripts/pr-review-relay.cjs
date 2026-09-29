const SOURCE_REPOSITORY = "BabylonJS/Babylon.js";
const DRAFT_REPOSITORY = "Popov72/pr-review-drafts";
const AUTHOR_ID = 4152247;

function positiveId(value) {
    return Number.isSafeInteger(value) && value > 0;
}

function makeDispatchPayload(eventName, event, pullRequest) {
    if (event.repository?.full_name !== SOURCE_REPOSITORY || event.sender?.type === "Bot") {
        return null;
    }

    let kind;
    let subject;
    let prNumber;
    let reviewId = null;

    switch (eventName) {
        case "pull_request_review_comment":
            if (event.action !== "created") {
                return null;
            }
            kind = "review_comment";
            subject = event.comment;
            prNumber = event.pull_request?.number;
            reviewId = event.comment?.pull_request_review_id || null;
            break;
        case "pull_request_review":
            if (event.action !== "submitted") {
                return null;
            }
            kind = "review";
            subject = event.review;
            prNumber = event.pull_request?.number;
            reviewId = event.review?.id;
            break;
        case "issue_comment":
            if (event.action !== "created" || !event.issue?.pull_request) {
                return null;
            }
            kind = "issue_comment";
            subject = event.comment;
            prNumber = event.issue.number;
            break;
        default:
            return null;
    }

    if (
        !positiveId(prNumber) ||
        !positiveId(subject?.id) ||
        !positiveId(subject.user?.id) ||
        subject.user.type !== "User" ||
        subject.user?.id === AUTHOR_ID ||
        pullRequest.number !== prNumber ||
        pullRequest.base?.repo?.full_name !== SOURCE_REPOSITORY ||
        pullRequest.user?.id !== AUTHOR_ID ||
        pullRequest.state !== "open" ||
        !/^[0-9a-f]{40}$/.test(pullRequest.head?.sha || "")
    ) {
        return null;
    }

    return {
        source_repository: SOURCE_REPOSITORY,
        pr_number: prNumber,
        kind,
        event_id: subject.id,
        review_id: positiveId(reviewId) ? reviewId : null,
        source_comment_id: kind === "review" ? null : subject.id,
        head_sha: pullRequest.head.sha,
    };
}

module.exports = { SOURCE_REPOSITORY, DRAFT_REPOSITORY, makeDispatchPayload };
