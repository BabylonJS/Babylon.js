import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NullEngine } from "core/Engines/nullEngine";
import { Scene } from "core/scene";
import { CreateAudioEngineAsync } from "core/AudioV2/webAudio/webAudioEngine";
import { ContactAudioRuntime, CreateContactAudioDefaults } from "flow-graph-editor/contactAudioRuntime";
import { ReadContactAudio } from "flow-graph-editor/contactAudio";

vi.mock("core/AudioV2/webAudio/webAudioEngine", () => ({ CreateAudioEngineAsync: vi.fn() }));

const buffer = { duration: 0.1, numberOfChannels: 1, sampleRate: 22050, length: 2205 } as AudioBuffer;
const contexts: TestAudioContext[] = [];
class TestAudioContext {
    public state = "running";
    public decodeAudioData = vi.fn(async () => buffer);
    public resume = vi.fn(async () => {});
    public close = vi.fn(async () => {
        this.state = "closed";
    });
    public constructor() {
        contexts.push(this);
    }
}

class MetadataAudio {
    public duration = 0.1;
    public onloadedmetadata: (() => void) | null = null;
    public onerror: (() => void) | null = null;
    public set src(_value: string) {
        queueMicrotask(() => this.onloadedmetadata?.());
    }
    public removeAttribute() {}
    public load() {}
}

describe("contact audio async ownership", () => {
    let scene: Scene;
    let runtime: ContactAudioRuntime;
    const audioEngine = { createSoundAsync: vi.fn(), dispose: vi.fn(), resumeAsync: vi.fn() };

    beforeEach(() => {
        vi.clearAllMocks();
        audioEngine.createSoundAsync.mockResolvedValue({ play: vi.fn(), dispose: vi.fn(), stop: vi.fn() });
        contexts.length = 0;
        vi.stubGlobal("AudioContext", TestAudioContext);
        vi.stubGlobal("Audio", MetadataAudio);
        vi.mocked(CreateAudioEngineAsync).mockResolvedValue(audioEngine as unknown as Awaited<ReturnType<typeof CreateAudioEngineAsync>>);
        scene = new Scene(new NullEngine());
        runtime = new ContactAudioRuntime(
            scene,
            ReadContactAudio({ asset: { version: "2.0" } }),
            new Map(),
            () => false,
            () => {}
        );
    });

    afterEach(() => {
        runtime.dispose();
        scene.getEngine().dispose();
        vi.unstubAllGlobals();
    });

    it.each(["stop", "reset", "dispose"])("disposes a late audition instead of playing after %s", async (action) => {
        let finish!: (value: unknown) => void;
        const voice = { play: vi.fn(), dispose: vi.fn(), stop: vi.fn() };
        audioEngine.createSoundAsync.mockImplementationOnce(
            async () =>
                await new Promise((resolve) => {
                    finish = resolve;
                })
        );
        const pending = runtime.auditionAsync(CreateContactAudioDefaults()[0]);
        await vi.waitFor(() => expect(audioEngine.createSoundAsync).toHaveBeenCalledOnce());
        if (action === "stop") {
            runtime.stopAudition(true);
        } else if (action === "reset") {
            runtime.reset();
        } else {
            runtime.dispose();
        }
        finish(voice);
        await pending;
        expect(voice.play, "an audition finishing after stop must stay silent").not.toHaveBeenCalled();
        expect(voice.dispose).toHaveBeenCalledOnce();
    });

    it("does not cache an unsaved decode that completes after the chooser closes", async () => {
        let finish!: (value: AudioBuffer) => void;
        // Delay the browser decoder after the real runtime has allocated its context.
        const engineReady = runtime.enableAsync();
        await engineReady;
        contexts[0].decodeAudioData.mockImplementationOnce(
            async () =>
                await new Promise<AudioBuffer>((resolve) => {
                    finish = resolve;
                })
        );
        const pending = runtime.auditionAsync(CreateContactAudioDefaults()[0]);
        const rejected = (async () => {
            await expect(pending).rejects.toThrow("sound chooser has closed");
        })();
        await vi.waitFor(() => expect(contexts[0].decodeAudioData).toHaveBeenCalledOnce());
        runtime.stopAudition(true);
        finish(buffer);
        await rejected;
        expect((runtime as unknown as { _buffers: Map<string, AudioBuffer> })._buffers.size, "canceled decoded clips must not consume the preview budget").toBe(0);
    });

    it("closes a failed initialization context and permits a fresh retry", async () => {
        vi.mocked(CreateAudioEngineAsync).mockRejectedValueOnce(new Error("audio initialization failed"));
        await expect(runtime.enableAsync()).rejects.toThrow("audio initialization failed");
        expect(contexts[0].close, "failed initialization must release its owned AudioContext").toHaveBeenCalledOnce();
        await runtime.enableAsync();
        expect(CreateAudioEngineAsync).toHaveBeenCalledTimes(2);
        expect(runtime.ready).toBe(true);
    });
});
