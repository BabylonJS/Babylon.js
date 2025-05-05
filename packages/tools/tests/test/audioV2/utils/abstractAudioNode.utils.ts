import type { AudioNodeType } from "./audioV2.utils";

import { Page } from "@playwright/test";

export const EvaluateAbstractAudioNodeTestAsync = async (
    page: Page,
    audioNodeType: AudioNodeType,
    testFn: ({ audioNodeType }: { audioNodeType: AudioNodeType }) => Promise<void>
) => {
    return await page.evaluate(testFn, { audioNodeType });
};
