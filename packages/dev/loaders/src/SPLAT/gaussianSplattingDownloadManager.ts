import { Tools } from "core/Misc/tools";
import { type IFileRequest } from "core/Misc/fileRequest";

/**
 * Options for {@link GaussianSplattingDownloadManager}.
 */
export interface IGaussianSplattingDownloadManagerOptions {
    /** Maximum number of downloads allowed to run at the same time. PlayCanvas default `2`. */
    maxConcurrent?: number;
    /** Number of times a failed download is retried before rejecting. PlayCanvas default `2` (3 attempts total). */
    maxRetries?: number;
}

/** Identifies a group of related downloads so they can be cancelled together. */
export type DownloadGroupId = string | number;

/**
 * A queued, concurrency-capped download task.
 */
interface IDownloadTask {
    url: string;
    consumers: Set<IDownloadConsumer>;
    // Set once the task is settled (resolved/rejected/cancelled) so it is never settled twice.
    settled: boolean;
    // Set when the task has been cancelled so an in-flight download discards its eventual result.
    cancelled: boolean;
    // True once the task has been pulled from the queue and counted against the concurrency cap.
    started: boolean;
    // True once the task's concurrency slot has been released (so it is released exactly once).
    slotReleased: boolean;
    // The in-flight HTTP request for the current attempt, used to abort the download on cancellation.
    request?: IFileRequest;
    // Rejects the current attempt's promise so an aborted download unwinds immediately (abort() does not
    // fire the error callback, so the awaited attempt would otherwise hang).
    cancelAttempt?: (reason: any) => void;
}

interface IDownloadConsumer {
    task: IDownloadTask;
    groupId?: DownloadGroupId;
    promise: Promise<ArrayBuffer>;
    resolve: (data: ArrayBuffer) => void;
    reject: (reason: any) => void;
}

/**
 * Throttles the file downloads issued while streaming a Gaussian Splatting LOD scene.
 *
 * Mirrors the PlayCanvas gsplat asset loader: at most {@link maxConcurrent} downloads run at once, the
 * rest wait in a FIFO queue, each failed download is retried up to {@link maxRetries} times, and requests
 * are idempotent — concurrent (queued or in-flight) requests for the same URL share a single download.
 *
 * Downloads can be tagged with a group id and cancelled together via {@link cancelGroup}: when a node's
 * target LOD changes before its file finishes loading, the streamer cancels that file's now-unneeded
 * downloads. A shared URL keeps downloading for consumers in other groups; its underlying HTTP request
 * is aborted (or its queued task dropped) only when no consumers remain.
 *
 * Without this throttling, every on-demand LOD decode fans out into many parallel image fetches, so the
 * browser opens dozens of simultaneous connections that compete for bandwidth and delay the splats the
 * camera actually needs.
 * @experimental
 */
export class GaussianSplattingDownloadManager {
    /** Maximum number of downloads allowed to run at the same time. */
    public readonly maxConcurrent: number;
    /** Number of times a failed download is retried before rejecting. */
    public readonly maxRetries: number;

    private _activeCount = 0;
    private readonly _queue: IDownloadTask[] = [];
    // Idempotency: maps a URL to its task while the download is queued or in flight. The entry is removed
    // once the download settles so a later request (after the bytes were consumed) downloads again.
    private readonly _pending = new Map<string, IDownloadTask>();
    // Maps each group to its outstanding callers, not to shared URL tasks.
    private readonly _groups = new Map<DownloadGroupId, Set<IDownloadConsumer>>();
    private _disposed = false;

    /**
     * Creates a download manager.
     * @param options concurrency and retry limits
     */
    public constructor(options?: IGaussianSplattingDownloadManagerOptions) {
        this.maxConcurrent = Math.max(1, options?.maxConcurrent ?? 2);
        this.maxRetries = Math.max(0, options?.maxRetries ?? 2);
    }

    /**
     * Whether there are no downloads queued or in flight.
     */
    public get isIdle(): boolean {
        return this._pending.size === 0;
    }

    /**
     * Downloads a file as an `ArrayBuffer`, queued behind the concurrency cap and retried on failure.
     * Concurrent requests for the same URL resolve from a single shared download.
     * @param url the file URL to download
     * @param groupId optional group tag so related downloads can be cancelled together via {@link cancelGroup}
     * @returns a promise resolving with the downloaded bytes
     */
    public async loadFileAsync(url: string, groupId?: DownloadGroupId): Promise<ArrayBuffer> {
        if (this._disposed) {
            throw new Error("GaussianSplattingDownloadManager has been disposed.");
        }
        let task = this._pending.get(url);
        const newTask = !task;
        if (!task) {
            task = { url, consumers: new Set<IDownloadConsumer>(), settled: false, cancelled: false, started: false, slotReleased: false };
            this._pending.set(url, task);
            this._queue.push(task);
        }
        const consumer = { task, groupId } as IDownloadConsumer;
        consumer.promise = new Promise<ArrayBuffer>((resolve, reject) => {
            consumer.resolve = resolve;
            consumer.reject = reject;
        });
        task.consumers.add(consumer);
        if (groupId !== undefined) {
            let consumers = this._groups.get(groupId);
            if (!consumers) {
                consumers = new Set<IDownloadConsumer>();
                this._groups.set(groupId, consumers);
            }
            consumers.add(consumer);
        }
        if (newTask) {
            this._pump();
        }
        return await consumer.promise;
    }

    /**
     * Cancels a single pending download by URL. A queued download is dropped before it starts; an in-flight
     * download has its underlying HTTP request aborted and its concurrency slot freed. No-op if the URL is
     * not currently pending.
     * @param url the URL to cancel
     */
    public cancel(url: string): void {
        const task = this._pending.get(url);
        if (!task) {
            return;
        }
        this._abort(task, new Error(`GaussianSplattingDownloadManager: download cancelled (${url}).`));
    }

    /**
     * Cancels callers in the given group. A shared URL continues for callers in other groups or with no group.
     * @param groupId the group whose callers should be cancelled
     */
    public cancelGroup(groupId: DownloadGroupId): void {
        const consumers = this._groups.get(groupId);
        if (!consumers) {
            return;
        }
        for (const consumer of Array.from(consumers)) {
            this._cancelConsumer(consumer, new Error(`GaussianSplattingDownloadManager: download cancelled (${consumer.task.url}).`));
        }
    }

    /**
     * Cancels every queued download and aborts every in-flight download, preventing new downloads from
     * starting.
     */
    public dispose(): void {
        if (this._disposed) {
            return;
        }
        this._disposed = true;
        this._queue.length = 0;
        for (const task of Array.from(this._pending.values())) {
            this._abort(task, new Error("GaussianSplattingDownloadManager has been disposed."));
        }
    }

    /**
     * Aborts a task: drops it from the queue (if not started), aborts its in-flight HTTP request (if started),
     * unwinds its current attempt, settles all remaining callers, and frees its concurrency slot.
     * @param task the task to abort
     * @param reason the rejection reason
     */
    private _abort(task: IDownloadTask, reason: any): void {
        if (task.settled) {
            return;
        }
        task.cancelled = true;
        const queueIndex = this._queue.indexOf(task);
        if (queueIndex !== -1) {
            this._queue.splice(queueIndex, 1);
        }
        // Abort the underlying HTTP request (no-op for a queued task whose request has not been created).
        task.request?.abort();
        // abort() does not fire the error callback, so unwind the awaited attempt explicitly.
        task.cancelAttempt?.(reason);
        this._settle(task, (consumer) => consumer.reject(reason));
        if (task.started) {
            this._releaseSlot(task);
        }
    }

    private _cancelConsumer(consumer: IDownloadConsumer, reason: Error): void {
        const task = consumer.task;
        if (!task.consumers.has(consumer)) {
            return;
        }
        this._removeConsumer(consumer);
        consumer.reject(reason);
        if (task.consumers.size === 0) {
            this._abort(task, reason);
        }
    }

    private _removeConsumer(consumer: IDownloadConsumer): void {
        consumer.task.consumers.delete(consumer);
        if (consumer.groupId !== undefined) {
            const members = this._groups.get(consumer.groupId);
            members?.delete(consumer);
            if (members?.size === 0) {
                this._groups.delete(consumer.groupId);
            }
        }
    }

    /**
     * Settles a task exactly once, removing it from the pending map and all consumer groups.
     * @param task the task to settle
     * @param settleFn resolves or rejects each outstanding caller
     */
    private _settle(task: IDownloadTask, settleFn: (consumer: IDownloadConsumer) => void): void {
        if (task.settled) {
            return;
        }
        task.settled = true;
        if (this._pending.get(task.url) === task) {
            this._pending.delete(task.url);
        }
        for (const consumer of task.consumers) {
            this._removeConsumer(consumer);
            settleFn(consumer);
        }
    }

    /**
     * Releases a task's concurrency slot exactly once and pumps the queue.
     * @param task the task whose slot to release
     */
    private _releaseSlot(task: IDownloadTask): void {
        if (task.slotReleased) {
            return;
        }
        task.slotReleased = true;
        this._activeCount--;
        this._pump();
    }

    /**
     * Starts as many queued downloads as the concurrency cap allows.
     */
    private _pump(): void {
        while (!this._disposed && this._activeCount < this.maxConcurrent && this._queue.length > 0) {
            const task = this._queue.shift()!;
            if (task.settled) {
                continue;
            }
            task.started = true;
            this._activeCount++;
            void this._runTaskAsync(task).finally(() => {
                this._releaseSlot(task);
            });
        }
    }

    /**
     * Runs a single download with retries, settling each outstanding consumer. The idempotency entry is
     * removed the moment the task settles so a later request for the same URL starts a fresh download.
     * @param task the queued download to run
     */
    private async _runTaskAsync(task: IDownloadTask): Promise<void> {
        let lastError: any;
        // attempt 0 is the initial try; attempts 1..maxRetries are retries (PlayCanvas retries immediately).
        for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
            if (this._disposed || task.cancelled) {
                return;
            }
            try {
                // eslint-disable-next-line no-await-in-loop
                const buffer = await this._downloadAttemptAsync(task);
                this._settle(task, (consumer) => consumer.resolve(buffer));
                return;
            } catch (e) {
                task.cancelAttempt = undefined;
                if (this._disposed || task.cancelled) {
                    // The task was already settled by cancel()/dispose(); just stop retrying.
                    return;
                }
                lastError = e;
            }
        }
        this._settle(task, (consumer) => consumer.reject(lastError));
    }

    /**
     * Performs one download attempt, exposing the request handle (for abort) and an attempt-rejecter on the
     * task so cancellation can both abort the HTTP request and unwind this awaited attempt.
     * @param task the download task
     * @returns a promise resolving with the downloaded bytes
     */
    private async _downloadAttemptAsync(task: IDownloadTask): Promise<ArrayBuffer> {
        return await new Promise<ArrayBuffer>((resolve, reject) => {
            task.cancelAttempt = reject;
            task.request = Tools.LoadFile(
                task.url,
                (data) => resolve(data as ArrayBuffer),
                undefined,
                undefined,
                true,
                (_request, exception) => reject(exception instanceof Error ? exception : new Error(`GaussianSplattingDownloadManager: failed to load ${task.url}.`))
            );
        });
    }
}
