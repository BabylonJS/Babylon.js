import {
    type AudioBus,
    type AudioEngine,
    type AudioInputSource,
    type Camera,
    type Mesh,
    type StaticSound,
    type StreamingSound,
    createAudioBusAsync,
    createAudioEngineAsync,
    createSoundAsync,
    createSoundBufferAsync,
    createSoundSourceAsync,
    createStreamingSoundAsync,
    disposeAudioEngine,
    enableSpatial,
    playSound,
    playStreamingSound,
    setSpatialAutoUpdate,
    setSpatialListener,
    setSoundSourceVolume,
    stopSound,
    stopStreamingSound,
} from "@babylonjs/lite";

export type LiteAudioFixture = Readonly<{
    engine: AudioEngine;
    musicBus: AudioBus;
    effectsBus: AudioBus;
    spatialBus: AudioBus;
    boxSound: StaticSound;
    sphereSound: StaticSound;
    musicSound: StaticSound;
    streamingSound: StreamingSound;
    oscillator: OscillatorNode;
    oscillatorSource: AudioInputSource;
    play: () => void;
    stop: () => void;
    dispose: () => void;
}>;

/** Creates the audio graph used by the Lite Inspector test app. */
export async function CreateLiteAudioFixture(camera: Camera, box: Mesh, sphere: Mesh, smallBox: Mesh): Promise<LiteAudioFixture> {
    const engine = await createAudioEngineAsync({ volume: 0.3 });

    try {
        const musicBus = await createAudioBusAsync(engine, "Music", { volume: 0.5 });
        const effectsBus = await createAudioBusAsync(engine, "Effects", { volume: 0.5 });
        const spatialBus = await createAudioBusAsync(engine, "Sphere Effects", { outBus: effectsBus, volume: 0.5 });
        const soundUrl = new URL("../../../../tools/playground/public/sounds/bounce.wav", import.meta.url).href;
        const buffer = await createSoundBufferAsync(engine, soundUrl);
        const boxSound = await createSoundAsync(engine, buffer, { outBus: effectsBus, volume: 0.3, loop: true, maxInstances: 1 });
        const sphereSound = await createSoundAsync(engine, buffer, { outBus: spatialBus, volume: 0.3, loop: true, maxInstances: 1 });
        const musicSound = await createSoundAsync(engine, buffer, { outBus: musicBus, volume: 0.2, loop: true, maxInstances: 1 });
        const streamingSound = await createStreamingSoundAsync(engine, soundUrl, { outBus: musicBus, volume: 0.2, loop: true, preloadCount: 1, maxInstances: 1 });
        const oscillator = new OscillatorNode(engine.audioContext, { frequency: 220 });
        const oscillatorSource = await createSoundSourceAsync(engine, oscillator, { name: "Oscillator", outBus: effectsBus, volume: 0 });
        oscillator.start();

        enableSpatial(boxSound, { attachedTo: box, distanceModel: "inverse", minDistance: 1, maxDistance: 25 });
        enableSpatial(spatialBus, { attachedTo: sphere, distanceModel: "inverse", minDistance: 1, maxDistance: 25 });
        enableSpatial(oscillatorSource, { attachedTo: smallBox });
        setSpatialListener(engine, { attachedTo: camera });
        setSpatialAutoUpdate(engine, true);

        return {
            engine,
            musicBus,
            effectsBus,
            spatialBus,
            boxSound,
            sphereSound,
            musicSound,
            streamingSound,
            oscillator,
            oscillatorSource,
            play: () => {
                playSound(boxSound);
                playSound(sphereSound);
                playSound(musicSound);
                playStreamingSound(streamingSound);
                setSoundSourceVolume(oscillatorSource, 0.1);
            },
            stop: () => {
                stopSound(boxSound);
                stopSound(sphereSound);
                stopSound(musicSound);
                stopStreamingSound(streamingSound);
                setSoundSourceVolume(oscillatorSource, 0);
            },
            dispose: () => {
                oscillator.stop();
                disposeAudioEngine(engine);
            },
        };
    } catch (error) {
        disposeAudioEngine(engine);
        throw error;
    }
}
