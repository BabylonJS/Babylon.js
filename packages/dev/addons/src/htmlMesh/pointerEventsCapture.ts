import { Tools } from "core/Misc/tools";

// A capture management system to ensure that the correct object has the pointer
// events by eliminating race conditions that can cause the pointer events to be
// released by a different object after they are captured leaving no object
// as the owner.  It does this by queueing requests and only allowing
// capture when the current capture owner releases pointer events.

type CaptureReleaseCallback = () => void;

type CaptureReleaseCallbacks = {
    capture: CaptureReleaseCallback;
    release: CaptureReleaseCallback;
};

let captureRequestQueue: string[] = [];

// Key is request id, value is object with capture and release callbacks
const pendingRequestCallbacks: Map<string, CaptureReleaseCallbacks> = new Map();

// Keep track of release requests with no matching capture request
// in case the release request arrived before the capture to avoid
// the capture request never getting released.
let unmatchedReleaseRequests: string[] = [];

let currentOwner: string | null = null; // Called on first capture or release request

/**
 * Get the id of the object currently capturing pointer events
 * @returns The id of the object currently capturing pointer events
 * or null if no object is capturing pointer events
 */
export const getCapturingId = () => {
    return currentOwner;
};

/**
 * Request that the object with the given id capture pointer events.  If there is no current
 * owner, then the request is granted immediately.  If there is a current owner, then the request
 * is queued until the current owner releases pointer events.
 * @param requestId An id to identify the request.  This id will be used to match the capture
 * request with the release request.
 * @param captureCallback The callback to call when the request is granted and the object is capturing
 * @param releaseCallback The callback to call when the object is no longer capturing pointer events
 */
export const requestCapture = (requestId: string, captureCallback: CaptureReleaseCallback, releaseCallback: CaptureReleaseCallback) => {
    debugLog(`In pointerEventsCapture.requestCapture - Pointer events capture requested for ${requestId}`);

    // If there is a release for this request, then ignore the request
    if (removeUnmatchedRequest(requestId)) {
        debugLog(`In pointerEventsCapture.requestCapture - Capture request matched previous release request ${requestId}.  Cancelling capture request`);
        return;
    } else if (requestId !== currentOwner) {
        // if the request is not already in the queue, add it to the queue
        enqueueCaptureRequest(requestId, captureCallback, releaseCallback);
    }

    if (!currentOwner) {
        // If there is no current owner, go ahead and grant the request
        transferPointerEventsOwnership();
    }
    // If the request id is the current owner, do nothing
};

/**
 * Release pointer events from the object with the given id.  If the object is the current owner
 * then pointer events are released immediately.  If the object is not the current owner, then the
 * associated capture request is removed from the queue.  If there is no matching capture request
 * in the queue, then the release request is added to a list of unmatched release requests and will
 * negate the next capture request with the same id.  This is to guard against the possibility that
 * the release request arrived before the capture request.
 * @param requestId The id which should match the id of the capture request
 */
export const requestRelease = (requestId: string | null) => {
    debugLog(`In pointerEventsCapture.requestRelease - Pointer events release requested for ${requestId}`);

    // if the requestId is the current capture holder release it
    if (!requestId || requestId === currentOwner) {
        transferPointerEventsOwnership();
    } else if (cancelRequest(requestId)) {
        // if the request is in the queue, but not the current capture holder, remove it and it's callbacks
        pendingRequestCallbacks.delete(requestId);
    } else {
        debugLog(`In pointerEventsCapture.requestRelease - Received release request ${requestId} but no matching capture request was received`);
        // request was not current and not in queue, likely because we received a release
        // request before the capture.  Add it to the unmatched list to guard against this possibility
        if (!unmatchedReleaseRequests.includes(requestId)) {
            unmatchedReleaseRequests.push(requestId);
        }
    }
};

/**
 * Relase pointer events from the current owner
 */
export const releaseCurrent = () => {
    requestRelease(currentOwner);
};

const enqueueCaptureRequest = (requestId: string, capture: CaptureReleaseCallback, release: CaptureReleaseCallback) => {
    debugLog(`In pointerEventsCapture.enqueueCaptureRequest - Enqueueing capture request for  ${requestId}`);
    if (!captureRequestQueue.includes(requestId)) {
        captureRequestQueue.push(requestId);
        pendingRequestCallbacks.set(requestId, { capture, release });
    }
};

// Removes the request from the queue if it exists.  Returns true
// if the request was found and removed, otherwise false
const cancelRequest = (requestId: string | null) => {
    let removed = false;
    captureRequestQueue = captureRequestQueue.filter((id) => {
        if (id !== requestId) {
            return true;
        } else {
            removed = true;
            debugLog(`In pointerEventsCapture.cancelRequest - Canceling pointer events capture request ${requestId}`);
            return false;
        }
    });
    return removed;
};

const removeUnmatchedRequest = (requestId: string) => {
    let removed = false;
    unmatchedReleaseRequests = unmatchedReleaseRequests.filter((id) => {
        if (id !== requestId) {
            return true;
        } else {
            removed = true;
            return false;
        }
    });
    return removed;
};

const transferPointerEventsOwnership = () => {
    const newOwnerId = nextCaptureRequest();
    debugLog(`In pointerEventsCapture.transferPointerEventsOwnership - Transferrring pointer events from ${currentOwner} to ${newOwnerId}`);
    // Release the current owner
    doRelease();
    if (newOwnerId) {
        doCapture(newOwnerId);
    }
};

const doRelease = () => {
    debugLog(`In pointerEventsCapture.doRelease - Releasing pointer events from ${currentOwner}`);
    if (currentOwner) {
        // call the release callback
        pendingRequestCallbacks.get(currentOwner)?.release();
        // And remove the callbacks
        pendingRequestCallbacks.delete(currentOwner);
        currentOwner = null;
    }
};

const doCapture = (newOwnerId: string) => {
    if (newOwnerId) {
        // call the capture callback
        pendingRequestCallbacks.get(newOwnerId)?.capture();
    }
    currentOwner = newOwnerId;
    debugLog(`In pointerEventsCapture.doCapture - Pointer events now captured by ${newOwnerId}`);
};

const nextCaptureRequest = () => {
    return captureRequestQueue.length > 0 ? captureRequestQueue.shift() : null;
};

// #region Debugging support
declare global {
    interface Window {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        "pointer-events-capture-debug": boolean | null;
    }
}

const debugLog = (message: string) => {
    // If we are runnning in a test runner (in node, so window is not defined)
    // or if the debug flag is set, then log the message
    if (typeof window === "undefined" || window["pointer-events-capture-debug"]) {
        Tools.Log(
            `${performance.now()} - game.scene.pointerEvents - ${message}\ncurrentOwner: ${currentOwner}\nqueue: ${captureRequestQueue}\nunmatched: ${unmatchedReleaseRequests}`
        );
    }
};
// #endregion Debugging support
