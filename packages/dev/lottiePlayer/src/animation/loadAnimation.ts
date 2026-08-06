import { type ILottieFile } from "./lottieRaw";

/**
 * Fetches a Lottie animation file from a URL and returns its JSON representation.
 * @param urlToFile The URL to the Lottie animation file.
 * @returns The JSON representation of the Lottie animation.
 */
export async function GetRawAnimationDataAsync(urlToFile: string): Promise<ILottieFile> {
    const animationData = await (await fetch(urlToFile)).text();
    return JSON.parse(animationData) as ILottieFile;
}
