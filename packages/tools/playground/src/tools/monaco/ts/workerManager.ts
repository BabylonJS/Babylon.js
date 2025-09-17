// workerManager.ts - Manages TypeScript worker access to prevent conflicts
import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import { Logger } from "@dev/core";

/**
 * Global TypeScript worker manager to prevent conflicts and deadlocks
 */
class TypeScriptWorkerManager {
    private _activeRequests = 0;
    private _isDisposed = false;
    private _worker: Promise<monaco.languages.typescript.TypeScriptWorker> | null = null;
    private _workerFactory: ((...uris: monaco.Uri[]) => Promise<monaco.languages.typescript.TypeScriptWorker>) | null = null;

    /**
     * Get TypeScript worker with proper coordination
     * @returns Promise that resolves to TypeScript worker
     */
    async getWorkerAsync(): Promise<monaco.languages.typescript.TypeScriptWorker> {
        if (this._isDisposed) {
            throw new Error("TypeScript worker manager has been disposed");
        }

        this._activeRequests++;

        try {
            // Get worker factory if not cached
            if (!this._workerFactory) {
                this._workerFactory = await monaco.languages.typescript.getTypeScriptWorker();
            }

            // Get worker instance if not cached
            if (!this._worker) {
                this._worker = this._workerFactory();
            }

            return await this._worker;
        } finally {
            this._activeRequests--;
        }
    }

    /**
     * Execute diagnostics with proper error handling and timeouts
     * @param model Monaco text model
     * @param timeoutMs Timeout in milliseconds
     * @returns Diagnostics result or null if disposed/failed
     */
    async executeDiagnosticsAsync(
        model: monaco.editor.ITextModel,
        timeoutMs = 3000
    ): Promise<{ syn: monaco.languages.typescript.Diagnostic[]; sem: monaco.languages.typescript.Diagnostic[] } | null> {
        if (this._isDisposed || model.isDisposed()) {
            Logger.Warn(`Cannot execute diagnostics: manager or model is disposed`);
            return null;
        }

        // If we have too many concurrent requests, return null to avoid overloading
        if (this._activeRequests >= 3) {
            Logger.Warn(`Too many concurrent worker requests (${this._activeRequests}), skipping diagnostics for ${model.uri.path}`);
            return null;
        }

        const worker = await this.getWorkerAsync();
        const uriStr = model.uri.toString();

        const diagnosticsPromise = Promise.all([worker.getSyntacticDiagnostics(uriStr), worker.getSemanticDiagnostics(uriStr)]);

        const timeoutPromise = new Promise<never>((_, reject) => setTimeout(() => reject(new Error(`Diagnostics timeout for ${model.uri.path}`)), timeoutMs));

        try {
            const [syn, sem] = await Promise.race([diagnosticsPromise, timeoutPromise]);
            return { syn, sem };
        } catch (error) {
            Logger.Warn(`Diagnostics failed for model ${model.uri.path}: ${error}`);
            // Return null instead of throwing to allow graceful handling
            return null;
        }
    }

    /**
     * Get the number of active requests (for debugging)
     * @returns Number of active requests
     */
    get activeRequests(): number {
        return this._activeRequests;
    }

    /**
     * Invalidate cached worker (call when diagnostic options change)
     */
    invalidateWorker(): void {
        this._worker = null;
        this._workerFactory = null;
    }

    /**
     * Dispose the worker manager
     */
    dispose(): void {
        this._isDisposed = true;
        this._workerFactory = null;
        this._worker = null;
    }
}

// Global singleton instance
export const TsWorkerManager = new TypeScriptWorkerManager();
