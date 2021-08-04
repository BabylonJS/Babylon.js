/**
 * Interface used to define options for the Audio Engine
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