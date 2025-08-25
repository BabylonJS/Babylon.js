import { Player } from "lottie/Player";

/** Main entry point for the default scene for lottie-player */
export function Main(): void {
    const div = document.getElementById("wrapper") as HTMLDivElement; // Get the canvas element
    const player = new Player(div, "./a1-fre.json", new Map<string, string>(), { loopAnimation: true });
    player.playAnimation();
}
