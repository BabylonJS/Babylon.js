import type { AudioNodeType } from "./audioV2.utils";

import { Page } from "@playwright/test";

export const EvaluateAbstractAudioNodeTestAsync = async <T = void>(
    page: Page,
    audioNodeType: AudioNodeType,
    testFn: ({ audioNodeType }: { audioNodeType: AudioNodeType }) => Promise<T>
) => {
    return await page.evaluate(testFn, { audioNodeType });
};
