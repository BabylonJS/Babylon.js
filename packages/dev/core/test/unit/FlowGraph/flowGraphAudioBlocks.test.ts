import { type Engine, NullEngine } from "core/Engines";
import {
    type FlowGraph,
    type FlowGraphContext,
    FlowGraphCoordinator,
    FlowGraphConsoleLogBlock,
    FlowGraphSceneReadyEventBlock,
} from "core/FlowGraph";
import { FlowGraphPlaySoundBlock } from "core/FlowGraph/Blocks/Execution/Audio/flowGraphPlaySoundBlock";
import { FlowGraphStopSoundBlock } from "core/FlowGraph/Blocks/Execution/Audio/flowGraphStopSoundBlock";
import { FlowGraphPauseSoundBlock } from "core/FlowGraph/Blocks/Execution/Audio/flowGraphPauseSoundBlock";
import { FlowGraphSetSoundVolumeBlock } from "core/FlowGraph/Blocks/Execution/Audio/flowGraphSetSoundVolumeBlock";
import { FlowGraphSoundEndedEventBlock } from "core/FlowGraph/Blocks/Event/flowGraphSoundEndedEventBlock";
import { FlowGraphGetSoundVolumeBlock } from "core/FlowGraph/Blocks/Data/Audio/flowGraphGetSoundVolumeBlock";
import { FlowGraphIsSoundPlayingBlock } from "core/FlowGraph/Blocks/Data/Audio/flowGraphIsSoundPlayingBlock";
import { SoundState } from "core/AudioV2/soundState";
import { Observable } from "core/Misc/observable";
import { Logger } from "core/Misc/logger";
import { Scene } from "core/scene";

/**
 * Creates a mock AbstractSound for testing.
 * Mimics the Audio V2 AbstractSound API surface used by the blocks.
 */
function createMockSound(initialState: SoundState = SoundState.Stopped, initialVolume: number = 1) {
    return {
        state: initialState,
        volume: initialVolume,
        onEndedObservable: new Observable<any>(),
        play: vi.fn(function (this: any) {
            this.state = SoundState.Started;
        }),
        stop: vi.fn(function (this: any) {
            this.state = SoundState.Stopped;
        }),
        pause: vi.fn(function (this: any) {
            this.state = SoundState.Paused;
        }),
        resume: vi.fn(function (this: any) {
            this.state = SoundState.Started;
        }),
    };
}

describe("Flow Graph Audio Blocks", () => {
    let engine: Engine;
    let scene: Scene;
    let flowGraphCoordinator: FlowGraphCoordinator;
    let flowGraph: FlowGraph;
    let flowGraphContext: FlowGraphContext;

    beforeEach(() => {
        engine = new NullEngine({
            renderHeight: 256,
            renderWidth: 256,
            textureSize: 256,
            deterministicLockstep: false,
            lockstepMaxSteps: 1,
        });
        Logger.Log = vi.fn();

        scene = new Scene(engine);
        flowGraphCoordinator = new FlowGraphCoordinator({ scene });
        flowGraph = flowGraphCoordinator.createGraph();
        flowGraphContext = flowGraph.createContext();
    });

    afterEach(() => {
        scene.dispose();
        engine.dispose();
    });

    describe("PlaySoundBlock", () => {
        it("calls play with correct options", () => {
            const sceneReady = new FlowGraphSceneReadyEventBlock();
            flowGraph.addEventBlock(sceneReady);

            const playBlock = new FlowGraphPlaySoundBlock();
            sceneReady.done.connectTo(playBlock.in);

            const mockSound = createMockSound();
            playBlock.sound.setValue(mockSound as any, flowGraphContext);
            playBlock.volume.setValue(0.5, flowGraphContext);
            playBlock.startOffset.setValue(2.0, flowGraphContext);
            playBlock.loop.setValue(true, flowGraphContext);

            flowGraph.start();

            expect(mockSound.play).toHaveBeenCalledWith({
                volume: 0.5,
                startOffset: 2.0,
                loop: true,
            });
        });

        it("uses default values when not explicitly set", () => {
            const sceneReady = new FlowGraphSceneReadyEventBlock();
            flowGraph.addEventBlock(sceneReady);

            const playBlock = new FlowGraphPlaySoundBlock();
            sceneReady.done.connectTo(playBlock.in);

            const mockSound = createMockSound();
            playBlock.sound.setValue(mockSound as any, flowGraphContext);

            flowGraph.start();

            expect(mockSound.play).toHaveBeenCalledWith({
                volume: 1,
                startOffset: 0,
                loop: false,
            });
        });

        it("reports error when no sound is provided", () => {
            const sceneReady = new FlowGraphSceneReadyEventBlock();
            flowGraph.addEventBlock(sceneReady);

            const playBlock = new FlowGraphPlaySoundBlock();
            sceneReady.done.connectTo(playBlock.in);

            // Don't set sound — leave it undefined
            const log = new FlowGraphConsoleLogBlock();
            log.message.setValue("after", flowGraphContext);
            playBlock.out.connectTo(log.in);

            flowGraph.start();

            // The out signal should still fire (error is reported but execution continues)
            expect(Logger.Log).toHaveBeenCalledWith("after");
        });
    });

    describe("StopSoundBlock", () => {
        it("calls stop on the sound", () => {
            const sceneReady = new FlowGraphSceneReadyEventBlock();
            flowGraph.addEventBlock(sceneReady);

            const stopBlock = new FlowGraphStopSoundBlock();
            sceneReady.done.connectTo(stopBlock.in);

            const mockSound = createMockSound(SoundState.Started);
            stopBlock.sound.setValue(mockSound as any, flowGraphContext);

            flowGraph.start();

            expect(mockSound.stop).toHaveBeenCalledTimes(1);
        });
    });

    describe("PauseSoundBlock", () => {
        it("pauses a playing sound", () => {
            const sceneReady = new FlowGraphSceneReadyEventBlock();
            flowGraph.addEventBlock(sceneReady);

            const pauseBlock = new FlowGraphPauseSoundBlock();
            sceneReady.done.connectTo(pauseBlock.in);

            const mockSound = createMockSound(SoundState.Started);
            pauseBlock.sound.setValue(mockSound as any, flowGraphContext);

            flowGraph.start();

            expect(mockSound.pause).toHaveBeenCalledTimes(1);
            expect(mockSound.resume).not.toHaveBeenCalled();
        });

        it("resumes a paused sound", () => {
            const sceneReady = new FlowGraphSceneReadyEventBlock();
            flowGraph.addEventBlock(sceneReady);

            const pauseBlock = new FlowGraphPauseSoundBlock();
            sceneReady.done.connectTo(pauseBlock.in);

            const mockSound = createMockSound(SoundState.Paused);
            pauseBlock.sound.setValue(mockSound as any, flowGraphContext);

            flowGraph.start();

            expect(mockSound.resume).toHaveBeenCalledTimes(1);
            expect(mockSound.pause).not.toHaveBeenCalled();
        });
    });

    describe("SetSoundVolumeBlock", () => {
        it("sets the volume property on the sound", () => {
            const sceneReady = new FlowGraphSceneReadyEventBlock();
            flowGraph.addEventBlock(sceneReady);

            const setVolumeBlock = new FlowGraphSetSoundVolumeBlock();
            sceneReady.done.connectTo(setVolumeBlock.in);

            const mockSound = createMockSound(SoundState.Started, 1.0);
            setVolumeBlock.sound.setValue(mockSound as any, flowGraphContext);
            setVolumeBlock.volume.setValue(0.3, flowGraphContext);

            flowGraph.start();

            expect(mockSound.volume).toBe(0.3);
        });
    });

    describe("SoundEndedEventBlock", () => {
        it("fires execution when the sound ends", () => {
            const soundEndedBlock = new FlowGraphSoundEndedEventBlock();
            flowGraph.addEventBlock(soundEndedBlock);

            const log = new FlowGraphConsoleLogBlock();
            log.message.setValue("ended", flowGraphContext);
            soundEndedBlock.done.connectTo(log.in);

            const mockSound = createMockSound(SoundState.Started);
            soundEndedBlock.sound.setValue(mockSound as any, flowGraphContext);

            flowGraph.start();

            // Simulate the sound ending
            mockSound.onEndedObservable.notifyObservers(mockSound as any);

            expect(Logger.Log).toHaveBeenCalledWith("ended");
        });

        it("cleans up observer on cancel", () => {
            const soundEndedBlock = new FlowGraphSoundEndedEventBlock();
            flowGraph.addEventBlock(soundEndedBlock);

            const log = new FlowGraphConsoleLogBlock();
            log.message.setValue("ended", flowGraphContext);
            soundEndedBlock.done.connectTo(log.in);

            const mockSound = createMockSound(SoundState.Started);
            soundEndedBlock.sound.setValue(mockSound as any, flowGraphContext);

            flowGraph.start();

            // Verify observer was added
            expect(mockSound.onEndedObservable.hasObservers()).toBe(true);

            // Stop the graph, which should cancel pending tasks
            flowGraph.dispose();

            // Verify observer was cleaned up
            expect(mockSound.onEndedObservable.hasObservers()).toBe(false);
        });
    });

    describe("GetSoundVolumeBlock", () => {
        it("outputs the current volume of the sound", () => {
            const sceneReady = new FlowGraphSceneReadyEventBlock();
            flowGraph.addEventBlock(sceneReady);

            const getVolumeBlock = new FlowGraphGetSoundVolumeBlock();
            const mockSound = createMockSound(SoundState.Started, 0.75);
            getVolumeBlock.sound.setValue(mockSound as any, flowGraphContext);

            const log = new FlowGraphConsoleLogBlock();
            log.message.connectTo(getVolumeBlock.value);
            sceneReady.done.connectTo(log.in);

            flowGraph.start();

            expect(Logger.Log).toHaveBeenCalledWith(0.75);
        });

        it("returns undefined when no sound is provided", () => {
            const getVolumeBlock = new FlowGraphGetSoundVolumeBlock();
            // Don't set sound

            // Manually trigger the operation
            getVolumeBlock._updateOutputs(flowGraphContext);

            expect(getVolumeBlock.isValid.getValue(flowGraphContext)).toBe(false);
        });
    });

    describe("IsSoundPlayingBlock", () => {
        it("returns true when sound is Started", () => {
            const sceneReady = new FlowGraphSceneReadyEventBlock();
            flowGraph.addEventBlock(sceneReady);

            const isPlayingBlock = new FlowGraphIsSoundPlayingBlock();
            const mockSound = createMockSound(SoundState.Started);
            isPlayingBlock.sound.setValue(mockSound as any, flowGraphContext);

            const log = new FlowGraphConsoleLogBlock();
            log.message.connectTo(isPlayingBlock.value);
            sceneReady.done.connectTo(log.in);

            flowGraph.start();

            expect(Logger.Log).toHaveBeenCalledWith(true);
        });

        it("returns true when sound is Starting", () => {
            const isPlayingBlock = new FlowGraphIsSoundPlayingBlock();
            const mockSound = createMockSound(SoundState.Starting);
            isPlayingBlock.sound.setValue(mockSound as any, flowGraphContext);

            isPlayingBlock._updateOutputs(flowGraphContext);

            expect(isPlayingBlock.value.getValue(flowGraphContext)).toBe(true);
        });

        it("returns false when sound is Stopped", () => {
            const isPlayingBlock = new FlowGraphIsSoundPlayingBlock();
            const mockSound = createMockSound(SoundState.Stopped);
            isPlayingBlock.sound.setValue(mockSound as any, flowGraphContext);

            isPlayingBlock._updateOutputs(flowGraphContext);

            expect(isPlayingBlock.value.getValue(flowGraphContext)).toBe(false);
        });

        it("returns false when sound is Paused", () => {
            const isPlayingBlock = new FlowGraphIsSoundPlayingBlock();
            const mockSound = createMockSound(SoundState.Paused);
            isPlayingBlock.sound.setValue(mockSound as any, flowGraphContext);

            isPlayingBlock._updateOutputs(flowGraphContext);

            expect(isPlayingBlock.value.getValue(flowGraphContext)).toBe(false);
        });
    });
});
