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

let CaptureRequestQueue: string[] = [];

// Key is request id, value is object with capture and release callbacks
const PendingRequestCallbacks: Map<string, CaptureReleaseCallbacks> = new Map();

// Keep track of release requests with no matching capture request
// in case the release request arrived before the capture to avoid
// the capture request never getting released.
let UnmatchedReleaseRequests: string[] = [];

let CurrentOwner: string | null = null; // Called on first capture or release request

/**
 * Get the id of the object currently capturing pointer events
 * @returns The id of the object currently capturing pointer events
 * or null if no object is capturing pointer events
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const getCapturingId = () => {
    return CurrentOwner;
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
// eslint-disable-next-line @typescript-eslint/naming-convention
export const requestCapture = (requestId: string, captureCallback: CaptureReleaseCallback, releaseCallback: CaptureReleaseCallback) => {
    DebugLog(`In pointerEventsCapture.requestCapture - Pointer events capture requested for ${requestId}`);

    // If there is a release for this request, then ignore the request
    if (RemoveUnmatchedRequest(requestId)) {
        DebugLog(`In pointerEventsCapture.requestCapture - Capture request matched previous release request ${requestId}.  Cancelling capture request`);
        return;
    } else if (requestId !== CurrentOwner) {
        // if the request is not already in the queue, add it to the queue
        EnqueueCaptureRequest(requestId, captureCallback, releaseCallback);
    }

    if (!CurrentOwner) {
        // If there is no current owner, go ahead and grant the request
        TransferPointerEventsOwnership();
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
// eslint-disable-next-line @typescript-eslint/naming-convention
export const requestRelease = (requestId: string | null) => {
    DebugLog(`In pointerEventsCapture.requestRelease - Pointer events release requested for ${requestId}`);

    // if the requestId is the current capture holder release it
    if (!requestId || requestId === CurrentOwner) {
        TransferPointerEventsOwnership();
    } else if (CancelRequest(requestId)) {
        // if the request is in the queue, but not the current capture holder, remove it and it's callbacks
        PendingRequestCallbacks.delete(requestId);
    } else {
        DebugLog(`In pointerEventsCapture.requestRelease - Received release request ${requestId} but no matching capture request was received`);
        // request was not current and not in queue, likely because we received a release
        // request before the capture.  Add it to the unmatched list to guard against this possibility
        if (!UnmatchedReleaseRequests.includes(requestId)) {
            UnmatchedReleaseRequests.push(requestId);
        }
    }
};

/**
 * Release pointer events from the current owner
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export const releaseCurrent = () => {
    requestRelease(CurrentOwner);
};

const EnqueueCaptureRequest = (requestId: string, capture: CaptureReleaseCallback, release: CaptureReleaseCallback) => {
    DebugLog(`In pointerEventsCapture.enqueueCaptureRequest - Enqueueing capture request for  ${requestId}`);
    if (!CaptureRequestQueue.includes(requestId)) {
        CaptureRequestQueue.push(requestId);
        PendingRequestCallbacks.set(requestId, { capture, release });
    }
};

// Removes the request from the queue if it exists.  Returns true
// if the request was found and removed, otherwise false
const CancelRequest = (requestId: string | null) => {
    let removed = false;
    CaptureRequestQueue = CaptureRequestQueue.filter((id) => {
        if (id !== requestId) {
            return true;
        } else {
            removed = true;
            DebugLog(`In pointerEventsCapture.cancelRequest - Canceling pointer events capture request ${requestId}`);
            return false;
        }
    });
    return removed;
};

const RemoveUnmatchedRequest = (requestId: string) => {
    let removed = false;
    UnmatchedReleaseRequests = UnmatchedReleaseRequests.filter((id) => {
        if (id !== requestId) {
            return true;
        } else {
            removed = true;
            return false;
        }
    });
    return removed;
};

const TransferPointerEventsOwnership = () => {
    const newOwnerId = NextCaptureRequest();
    DebugLog(`In pointerEventsCapture.transferPointerEventsOwnership - Transferrring pointer events from ${CurrentOwner} to ${newOwnerId}`);
    // Release the current owner
    DoRelease();
    if (newOwnerId) {
        DoCapture(newOwnerId);
    }
};

const DoRelease = () => {
    DebugLog(`In pointerEventsCapture.doRelease - Releasing pointer events from ${CurrentOwner}`);
    if (CurrentOwner) {
        // call the release callback
        PendingRequestCallbacks.get(CurrentOwner)?.release();
        // And remove the callbacks
        PendingRequestCallbacks.delete(CurrentOwner);
        CurrentOwner = null;
    }
};

const DoCapture = (newOwnerId: string) => {
    if (newOwnerId) {
        // call the capture callback
        PendingRequestCallbacks.get(newOwnerId)?.capture();
    }
    CurrentOwner = newOwnerId;
    DebugLog(`In pointerEventsCapture.doCapture - Pointer events now captured by ${newOwnerId}`);
};

const NextCaptureRequest = () => {
    return CaptureRequestQueue.length > 0 ? CaptureRequestQueue.shift() : null;
};

// #region Debugging support
declare global {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    interface Window {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        "pointer-events-capture-debug": boolean | null;
    }
}

const DebugLog = (message: string) => {
    // If we are runnning in a test runner (in node, so window is not defined)
    // or if the debug flag is set, then log the message
    if (typeof window === "undefined" || window["pointer-events-capture-debug"]) {
        Tools.Log(
            `${performance.now()} - game.scene.pointerEvents - ${message}\ncurrentOwner: ${CurrentOwner}\nqueue: ${CaptureRequestQueue}\nunmatched: ${UnmatchedReleaseRequests}`
        );
    }
};
// #endregion Debugging support
