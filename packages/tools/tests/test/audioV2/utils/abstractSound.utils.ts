import type { AudioTestResult, SoundType } from "./audioV2.utils";
import { GetPulseCounts } from "./audioV2.utils";

import { Page } from "@playwright/test";

export const EvaluateTestAsync = async <T>(page: Page, soundType: SoundType, testFn: ({ soundType }: { soundType: SoundType }) => Promise<T>) => {
    return await page.evaluate(testFn, { soundType });
};

export const EvaluatePulseCountTestAsync = async (page: Page, soundType: SoundType, testFn: ({ soundType }: { soundType: SoundType }) => Promise<AudioTestResult>) => {
    return GetPulseCounts(await EvaluateTestAsync(page, soundType, testFn));
};
