/**
 * Interface used to define options for the Audio Engine
 * @since 5.0.0
 */
export interface IAudioEngineOptions {
    /**
    * Specifies an existing Audio Context for the audio engine
    */
    audioContext?: AudioContext;
    /**
    * Specifies a destination node for the audio engine
    */
    audioDestination?: AudioDestinationNode | MediaStreamAudioDestinationNode;
}