import type { AudioTestResult, SoundType } from "./audioEngineV2.utils";
import { GetPulseCounts } from "./audioEngineV2.utils";

import { Page } from "@playwright/test";

export const EvaluatePulseCountTestAsync = async (page: Page, soundType: SoundType, testFn: ({ soundType }: { soundType: SoundType }) => Promise<AudioTestResult>) => {
    const result = await page.evaluate(testFn, { soundType });
    return GetPulseCounts(result);
};
