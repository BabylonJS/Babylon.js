const SOURCE_REPOSITORY_ID = 11007313;
const SOURCE_OWNER = "BabylonJS";
const SOURCE_REPO = "Babylon.js";
const SOURCE_REPOSITORY = `${SOURCE_OWNER}/${SOURCE_REPO}`;
const DRAFT_REPOSITORY = "Popov72/pr-response-drafts";
const AUTHOR_ID = 4152247;

function positiveId(value) {
    return Number.isSafeInteger(value) && value > 0;
}

function makeDispatchPayload(eventName, event, pullRequest) {
    if (event.repository?.id !== SOURCE_REPOSITORY_ID || event.repository.full_name !== SOURCE_REPOSITORY || event.sender?.type === "Bot") {
        return null;
    }

    let kind;
    let subject;
    let prNumber;
    switch (eventName) {
        case "pull_request_review_comment":
            if (event.action !== "created") {
                return null;
            }
            kind = "review_comment";
            subject = event.comment;
            prNumber = event.pull_request?.number;
            break;
        case "pull_request_review":
            if (event.action !== "submitted") {
                return null;
            }
            kind = "review";
            subject = event.review;
            prNumber = event.pull_request?.number;
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
        (eventName === "pull_request_review" && (typeof subject.body !== "string" || !subject.body.trim())) ||
        (typeof subject.body === "string" && subject.body.includes("<!-- pr-response-notice:")) ||
        pullRequest.number !== prNumber ||
        pullRequest.base?.repo?.full_name !== SOURCE_REPOSITORY ||
        pullRequest.user?.id !== AUTHOR_ID ||
        pullRequest.state !== "open" ||
        !/^[0-9a-f]{40}$/.test(pullRequest.head?.sha || "")
    ) {
        return null;
    }

    return {
        source_repository_id: SOURCE_REPOSITORY_ID,
        source_owner: SOURCE_OWNER,
        source_repo: SOURCE_REPO,
        pr_number: prNumber,
        kind,
        event_id: subject.id,
    };
}

module.exports = { SOURCE_REPOSITORY, DRAFT_REPOSITORY, makeDispatchPayload };
