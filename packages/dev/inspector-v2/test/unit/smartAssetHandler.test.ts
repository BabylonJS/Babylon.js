import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { AddSmartAssetsPaneSelectionObserver, ClearSmartAssetsPaneSelectionRequest } from "../../src/services/smartAssetsPaneSelection";
import { inspectorAssetNotFoundHandler, SetInspectorAssetNotFoundPromptHandler } from "../../src/services/smartAssetHandler";

describe("inspectorAssetNotFoundHandler", () => {
    beforeEach(() => {
        ClearSmartAssetsPaneSelectionRequest();
    });

    afterEach(() => {
        SetInspectorAssetNotFoundPromptHandler(null);
        ClearSmartAssetsPaneSelectionRequest();
    });

    it("requests Smart Assets pane selection again after the missing asset prompt resolves", async () => {
        let resolvePrompt: ((value: string | File | null) => void) | undefined;
        let markPromptReady: () => void;
        const promptReady = new Promise<void>((resolve) => {
            markPromptReady = resolve;
        });
        let selectionRequestCount = 0;
        const selectionObserver = AddSmartAssetsPaneSelectionObserver(() => {
            selectionRequestCount++;
        });

        SetInspectorAssetNotFoundPromptHandler(
            async () =>
                await new Promise<string | File | null>((resolve) => {
                    resolvePrompt = resolve;
                    markPromptReady();
                })
        );

        const resultPromise = inspectorAssetNotFoundHandler("missing-asset", "missing-asset.glb");

        expect(selectionRequestCount).toBe(1);

        await promptReady;
        if (!resolvePrompt) {
            throw new Error("Expected missing asset prompt to be requested.");
        }

        resolvePrompt("resolved-local-asset.glb");
        await expect(resultPromise).resolves.toBe("resolved-local-asset.glb");

        expect(selectionRequestCount).toBe(2);

        selectionObserver?.remove();
    });
});
