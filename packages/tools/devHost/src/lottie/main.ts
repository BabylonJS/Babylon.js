import type { AnimationConfiguration } from "lottie-player/animationConfiguration";
import type { RawLottieAnimation } from "lottie-player/parsing/rawTypes";
import { Player } from "lottie-player/player";
import { LocalPlayer } from "lottie-player/localPlayer";
import { DecodeQspStringToObject } from "./utils";

/**
 * Main entry point for the default scene for lottie-player
 * @param searchParams URL QSPs where the Keys have been lowercased to avoid any casing problems. Values are unmodified.
 */
export async function Main(searchParams: URLSearchParams): Promise<void> {
    const div = document.getElementById("main-div") as HTMLDivElement; // The player will be inside this div
    div.style = "justify-content: center; align-items: center;"; // We want the animation centered

    // You can also pass a local file that you are serving from the devhost public folder to test: const fileUrl = './myLottieFile.json'
    const filename = searchParams.get("file") || "triangles_noParents_noCross.json";
    const fileUrl = `https://assets.babylonjs.com/lottie/${filename}`;

    // Whether to use a web worker for rendering or not, defaults to true
    const useWorkerParam = searchParams.get("useworker");
    const useWorker = useWorkerParam !== "false"; // Default to true if not specified

    // Whether to use the file URL for the data or to parse the data in the devhost, defaults to true (use the file URL)
    const useUrlParam = searchParams.get("useurl");
    const useUrl = useUrlParam !== "false"; // Default to true if not specified

    // Whether to use the file URL for the data or to parse the data in the devhost, defaults to true (use the file URL)
    const usePreWarmParam = searchParams.get("useprewarm");
    const usePrewarm = usePreWarmParam === "true"; // Default to false if not specified

    // Whether variables are present in the URL to be used for the animation
    const urlVariables = searchParams.get("variables");
    const variables = new Map<string, string>();
    if (urlVariables) {
        const parsedVariables = DecodeQspStringToObject(urlVariables);
        for (const [key, value] of Object.entries(parsedVariables)) {
            variables.set(key, value);
        }
    }

    let animationData: RawLottieAnimation | undefined = undefined;
    if (!useUrl) {
        const data = await (await fetch(fileUrl)).text();
        animationData = JSON.parse(data) as RawLottieAnimation;
    }

    // This is the configuration for the player, you can pass as much or as little as you want, the rest will be defaulted
    const configuration: Partial<AnimationConfiguration> = {
        backgroundColor: { r: 255 / 255, g: 255 / 255, b: 255 / 255, a: 1 }, // Background color for the animation canvas, visual tests use white
    };

    // Create the player and play the animation
    if (useWorker) {
        const player = new Player();

        if (usePrewarm) {
            await player.preWarmPlayerAsync();
        }

        await player.playAnimationAsync({ container: div, animationSource: useUrl ? fileUrl : (animationData as RawLottieAnimation), variables, configuration });
    } else {
        const player = new LocalPlayer();
        await player.playAnimationAsync({ container: div, animationSource: useUrl ? fileUrl : (animationData as RawLottieAnimation), variables, configuration });
    }
}
