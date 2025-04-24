import type { SoundType } from "./audioV2.utils";

import { Page } from "@playwright/test";

export const EvaluateTestAsync = async <T>(page: Page, soundType: SoundType, testFn: ({ soundType }: { soundType: SoundType }) => Promise<T>) => {
    return await page.evaluate(testFn, { soundType });
};

export const EvaluatePulseCountTestAsync = async (page: Page, soundType: SoundType, testFn: ({ soundType }: { soundType: SoundType }) => Promise<void>) => {
    await EvaluateTestAsync(page, soundType, testFn);

    const pulses = await page.evaluate(() => {
        return AudioV2Test.GetPulseCountsAsync();
    });

    return pulses;
};
