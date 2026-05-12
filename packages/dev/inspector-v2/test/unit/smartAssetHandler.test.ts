import { afterEach, describe, expect, it } from "vitest";

import { inspectorAssetNotFoundHandler, SetInspectorAssetNotFoundPromptHandler } from "../../src/services/smartAssetHandler";

describe("inspectorAssetNotFoundHandler", () => {
    afterEach(() => {
        SetInspectorAssetNotFoundPromptHandler(null);
    });

    it("delegates the missing-asset prompt to the registered handler and returns its result", async () => {
        let resolvePrompt: ((value: string | File | null) => void) | undefined;
        const promptReady = new Promise<void>((resolveReady) => {
            SetInspectorAssetNotFoundPromptHandler(
                async () =>
                    await new Promise<string | File | null>((resolve) => {
                        resolvePrompt = resolve;
                        resolveReady();
                    })
            );
        });

        const resultPromise = inspectorAssetNotFoundHandler("missing-asset", "missing-asset.glb");

        await promptReady;
        if (!resolvePrompt) {
            throw new Error("Expected missing asset prompt to be requested.");
        }

        resolvePrompt("resolved-local-asset.glb");
        await expect(resultPromise).resolves.toBe("resolved-local-asset.glb");
    });
});
