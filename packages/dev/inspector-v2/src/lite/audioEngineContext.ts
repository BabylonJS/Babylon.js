import { type AudioEngine } from "@babylonjs/lite";
import { type IReadonlyObservable } from "core/index";
import { Observable } from "core/Misc/observable";
import { type ServiceDefinition, type IService } from "shared-ui-components/modularTool/modularity/serviceDefinition";

/**
 * The unique identity symbol for the Babylon Lite audio engine context service.
 * @experimental
 */
export const AudioEngineContextIdentity = Symbol("AudioEngineContext");

/**
 * Provides the optional Babylon Lite audio engine being inspected.
 * @experimental
 */
export interface IAudioEngineContext extends IService<typeof AudioEngineContextIdentity> {
    /**
     * Gets the current audio engine, or `null` when no audio engine is attached.
     */
    readonly audioEngine: AudioEngine | null;

    /**
     * Notifies when the current audio engine changes.
     */
    readonly onAudioEngineChanged: IReadonlyObservable<void>;
}

/**
 * Creates the service and its controller used by the Lite Inspector token.
 * @param initialAudioEngine The audio engine initially associated with this Inspector.
 * @returns The service definition, service instance, and a setter for the current audio engine.
 * @internal
 */
export function CreateAudioEngineContext(initialAudioEngine: AudioEngine | null = null): {
    serviceDefinition: ServiceDefinition<[IAudioEngineContext], []>;
    context: IAudioEngineContext & { dispose: () => void };
    setAudioEngine: (audioEngine: AudioEngine | null) => void;
} {
    let audioEngine = initialAudioEngine;
    const onAudioEngineChanged = new Observable<void>();
    let isDisposed = false;

    const context: IAudioEngineContext & { dispose: () => void } = {
        get audioEngine() {
            return audioEngine;
        },
        onAudioEngineChanged,
        dispose: () => {
            isDisposed = true;
            audioEngine = null;
            onAudioEngineChanged.clear();
        },
    };

    return {
        serviceDefinition: {
            friendlyName: "Babylon Lite Audio Engine Context",
            produces: [AudioEngineContextIdentity],
            consumes: [],
            factory: () => context,
        },
        context,
        setAudioEngine: (newAudioEngine) => {
            if (!isDisposed && audioEngine !== newAudioEngine) {
                audioEngine = newAudioEngine;
                onAudioEngineChanged.notifyObservers();
            }
        },
    };
}
