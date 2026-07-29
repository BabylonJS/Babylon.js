import { InitAudioV2Tests } from "./utils/audioV2.utils";

import { expect, test } from "@playwright/test";

InitAudioV2Tests();

// These tests cover the browser workaround for spatializing `MediaStream`-backed sources (for example, remote WebRTC
// streams). Some browsers (notably Chromium) only deliver audio samples from a `MediaStreamAudioSourceNode` while its
// `MediaStream` is also being pulled by an `HTMLMediaElement`, so `CreateSoundSourceAsync` attaches a hidden, muted
// audio element by default. A synthetic oscillator-backed stream is used so no microphone / `getUserMedia` is involved.
test.describe("SoundSource MediaStream sink", () => {
    test("A `MediaStreamAudioSourceNode` source attaches a hidden, muted audio element by default", async ({ page }) => {
        const result = await page.evaluate(async () => {
            await AudioV2Test.CreateAudioEngineAsync("Realtime");
            const context = audioContext as AudioContext;

            const streamDestination = new MediaStreamAudioDestinationNode(context);
            const oscillator = new OscillatorNode(context, { frequency: 440 });
            oscillator.connect(streamDestination);
            oscillator.start();

            const mediaStream = streamDestination.stream;
            const sourceNode = new MediaStreamAudioSourceNode(context, { mediaStream });

            const soundSource = (await BABYLON.CreateSoundSourceAsync("", sourceNode)) as any;
            const sink = soundSource._mediaStreamAudioElement as HTMLAudioElement | null;

            // Wait for the muted keep-alive element's play() to settle so we confirm it actually starts pulling the
            // stream. Without playback the workaround would not keep the source audible/spatializable.
            let playing = false;
            for (let i = 0; i < 50 && sink; i++) {
                if (!sink.paused) {
                    playing = true;
                    break;
                }
                await new Promise((resolve) => setTimeout(resolve, 20));
            }

            return {
                hasSink: !!sink,
                muted: sink?.muted ?? null,
                srcObjectIsStream: sink?.srcObject === mediaStream,
                playing,
            };
        });

        expect(result.hasSink).toBe(true);
        expect(result.muted).toBe(true);
        expect(result.srcObjectIsStream).toBe(true);
        expect(result.playing).toBe(true);
    });

    test("Setting `mediaStreamSinkEnabled` to false does not attach an audio element", async ({ page }) => {
        const result = await page.evaluate(async () => {
            await AudioV2Test.CreateAudioEngineAsync("Realtime");
            const context = audioContext as AudioContext;

            const streamDestination = new MediaStreamAudioDestinationNode(context);
            const oscillator = new OscillatorNode(context, { frequency: 440 });
            oscillator.connect(streamDestination);
            oscillator.start();

            const sourceNode = new MediaStreamAudioSourceNode(context, { mediaStream: streamDestination.stream });

            const soundSource = (await BABYLON.CreateSoundSourceAsync("", sourceNode, { mediaStreamSinkEnabled: false })) as any;

            return { hasSink: !!soundSource._mediaStreamAudioElement };
        });

        expect(result.hasSink).toBe(false);
    });

    test("A non-`MediaStream` source does not attach an audio element", async ({ page }) => {
        const result = await page.evaluate(async () => {
            await AudioV2Test.CreateAudioEngineAsync("Realtime");
            const context = audioContext as AudioContext;

            const sourceNode = new OscillatorNode(context, { frequency: 440 });
            const soundSource = (await BABYLON.CreateSoundSourceAsync("", sourceNode)) as any;

            return { hasSink: !!soundSource._mediaStreamAudioElement };
        });

        expect(result.hasSink).toBe(false);
    });

    test("Disposing the sound source releases the attached audio element", async ({ page }) => {
        const result = await page.evaluate(async () => {
            await AudioV2Test.CreateAudioEngineAsync("Realtime");
            const context = audioContext as AudioContext;

            const streamDestination = new MediaStreamAudioDestinationNode(context);
            const oscillator = new OscillatorNode(context, { frequency: 440 });
            oscillator.connect(streamDestination);
            oscillator.start();

            const sourceNode = new MediaStreamAudioSourceNode(context, { mediaStream: streamDestination.stream });

            const soundSource = (await BABYLON.CreateSoundSourceAsync("", sourceNode)) as any;
            const hadSinkBeforeDispose = !!soundSource._mediaStreamAudioElement;

            soundSource.dispose();

            return {
                hadSinkBeforeDispose,
                hasSinkAfterDispose: !!soundSource._mediaStreamAudioElement,
            };
        });

        expect(result.hadSinkBeforeDispose).toBe(true);
        expect(result.hasSinkAfterDispose).toBe(false);
    });

    test("Disposing does not stop the backing `MediaStream` tracks by default", async ({ page }) => {
        const result = await page.evaluate(async () => {
            await AudioV2Test.CreateAudioEngineAsync("Realtime");
            const context = audioContext as AudioContext;

            const streamDestination = new MediaStreamAudioDestinationNode(context);
            const oscillator = new OscillatorNode(context, { frequency: 440 });
            oscillator.connect(streamDestination);
            oscillator.start();

            const mediaStream = streamDestination.stream;
            const sourceNode = new MediaStreamAudioSourceNode(context, { mediaStream });

            const soundSource = (await BABYLON.CreateSoundSourceAsync("", sourceNode)) as any;
            soundSource.dispose();

            return { trackStates: mediaStream.getTracks().map((track) => track.readyState) };
        });

        expect(result.trackStates.length).toBeGreaterThan(0);
        expect(result.trackStates.every((state) => state === "live")).toBe(true);
    });
});
