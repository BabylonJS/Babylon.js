var audioContext;
var audioEngine;
var audioRecorder;
var audioRecorderDestination;
var audioTestConfig;
var audioTestResult;
var audioTestSounds = [];
var audioTestSuspendTime = 0;
var BABYLON;
var errorMessage;

const SilenceAudioOutput = true;

/**
 * The maximum pulse volume in the sound test file containing the pulse train.
 */
const MaxPulseVolume = 0.1;

const PulseGapLengthThresholdInMilliseconds = 0.01;
const PulseTrainLengthInSamples = 90;
const PulseVolumeThreshold = 0.05;

class AudioV2Test {
    static #AddSound(sound) {
        audioTestSounds.push(sound);

        // Start the audio recorder after the sound loads to avoid capturing silence while we wait.
        if (audioContext instanceof AudioContext && audioRecorder.state === "inactive") {
            audioRecorder.start();
        }
    }

    static #ExpandSource(source) {
        let sourceUrl;

        if (typeof source === "string") {
            sourceUrl = audioTestConfig.soundsUrl + source;
        } else if (source instanceof Array) {
            sourceUrl = new Array(source.length);
            for (let i = 0; i < source.length; i++) {
                if (typeof source[i] === "string") {
                    sourceUrl[i] = audioTestConfig.soundsUrl + source[i];
                }
            }
        } else {
            return source;
        }

        return sourceUrl;
    }

    static AfterEach() {
        audioEngine?.dispose();
        audioEngine = null;
        audioTestConfig = null;
    }

    static BeforeEach() {
        audioContext = null;
        audioRecorder = null;
        audioRecorderDestination = null;
        audioTestResult = null;
        audioTestSounds.length = 0;
        audioTestSuspendTime = 0;

        errorMessage = "No error";
    }

    static async CreateAudioEngineAsync(contextType, duration, options = {}) {
        if (contextType === "Realtime" || contextType === "StreamingSound") {
            audioContext = new AudioContext();

            // Firefox doesn't always start the audio context immediately, so wait for it to start here.
            await new Promise((resolve) => {
                const onStateChange = () => {
                    if (audioContext.state === "running") {
                        audioContext.removeEventListener("statechange", onStateChange);
                        resolve();
                    }
                };
                audioContext.addEventListener("statechange", onStateChange);
            });
        } else {
            if (!duration) {
                duration = audioTestConfig.defaultOfflineContextDuration;
            }
            audioContext = new OfflineAudioContext(2, 44100 * duration, 44100);
        }

        options.audioContext = audioContext;
        audioEngine = await BABYLON.CreateAudioEngineAsync(options);

        if (audioContext instanceof AudioContext) {
            audioRecorderDestination = new MediaStreamAudioDestinationNode(audioContext);
            audioRecorder = new MediaRecorder(audioRecorderDestination.stream);
            const nodeToCapture = audioEngine.mainOut._inNode;
            nodeToCapture.connect(audioRecorderDestination);

            if (SilenceAudioOutput) {
                nodeToCapture.disconnect(audioContext.destination);
            }
        }

        return audioEngine;
    }

    static CreateAbstractSoundAsync(soundType, source, options = {}) {
        if (soundType === "StaticSound") {
            return AudioV2Test.CreateSoundAsync(source, options);
        } else if (soundType === "StreamingSound") {
            return AudioV2Test.CreateStreamingSoundAsync(source, options);
        } else {
            throw new Error(`Unknown sound type: ${soundType}`);
        }
    }

    static async CreateAbstractSoundAndOutputNodeAsync(audioNodeType, source, options = {}) {
        let sound = null;
        let outputNode = null;

        switch (audioNodeType) {
            case "SoundSource":
                sound = await AudioV2Test.CreateSoundSourceAsync(source, options);
                break;
            case "StaticSound":
            case "StreamingSound":
                sound = await AudioV2Test.CreateAbstractSoundAsync(audioNodeType, source, options);
                break;
            default:
                sound = await AudioV2Test.CreateAbstractSoundAsync("StaticSound", source, {});
                break;
        }

        switch (audioNodeType) {
            case "AudioBus":
                outputNode = await audioEngine.createBusAsync("", options);
                sound.outBus = outputNode;
                outputNode.outBus = audioEngine.defaultMainBus;
                break;
            case "AudioEngineV2":
                outputNode = audioEngine;
                break;
            case "MainAudioBus":
                outputNode = await audioEngine.createMainBusAsync("", options);
                sound.outBus = outputNode;
                break;
            case "SoundSource":
            case "StaticSound":
            case "StreamingSound":
                outputNode = sound;
                break;
        }

        return { sound, outputNode };
    }

    static async CreateBusAsync(options = {}) {
        return await BABYLON.CreateAudioBusAsync("", options);
    }

    static async CreateSoundAsync(source, options = {}) {
        const sound = await BABYLON.CreateSoundAsync("", AudioV2Test.#ExpandSource(source), options);
        AudioV2Test.#AddSound(sound);

        return sound;
    }

    static async CreateSoundSourceAsync(source, options = {}) {
        const audioBuffer = await audioContext.decodeAudioData(await (await fetch(AudioV2Test.#ExpandSource(source))).arrayBuffer());
        const audioNode = new AudioBufferSourceNode(audioContext, {
            buffer: audioBuffer,
        });

        const soundSource = await BABYLON.CreateSoundSourceAsync("", audioNode, options);

        let state = BABYLON.SoundState.Stopped;
        Object.defineProperty(soundSource, "state", {
            get: () => state,
        });
        soundSource.play = () => {
            audioNode.start();
            state = BABYLON.SoundState.Playing;
        };
        soundSource.stop = () => {
            audioNode.stop();
            state = BABYLON.SoundState.Stopped;
        };

        AudioV2Test.#AddSound(soundSource);

        return soundSource;
    }

    static async CreateStreamingSoundAsync(source, options = {}) {
        const sound = await BABYLON.CreateStreamingSoundAsync("", AudioV2Test.#ExpandSource(source), options);
        AudioV2Test.#AddSound(sound);

        return sound;
    }

    /**
     * Gets the pulse counts of the test result's samples.
     *
     * Consecutive pulses are counted as a group, with the number of pulses in the group being the count. The group is
     * ended when a silence of at least `PulseGapLengthThresholdInMilliseconds` is detected or the end of the captured
     * audio is reached.
     *
     * For example, the shape of the returned pulse count arrays for a test result containing 2 channels with 3 groups of
     * pulses detected as 5 pulses in the first group, 6 in the second and 7 in the third group, would look like this:
     * [[5, 6, 7], [5, 6, 7]] ... assuming both test result channels contain the same audio output, which is typical.
     *
     * @returns an array containing the pulse counts for each channel in the test result's samples
     */
    static async GetPulseCountsAsync() {
        const result = await AudioV2Test.GetResultAsync();

        if (!result || !result.samples?.length || !result.numberOfChannels) {
            return [];
        }

        const pulseCounts = [];
        pulseCounts.length = audioTestResult.numberOfChannels;

        const PulseGapLengthThresholdInSamples = PulseGapLengthThresholdInMilliseconds * result.sampleRate;

        for (let channel = 0; channel < result.numberOfChannels; channel++) {
            let channelPulseCounts = [];
            const samples = result.samples[channel];

            let pulseStart = -1;
            let pulseEnd = -1;
            let pulseCount = 0;

            let i = 0;
            for (; i < result.length; i++) {
                if (Math.abs(samples[i]) > PulseVolumeThreshold) {
                    if (pulseStart === -1) {
                        pulseStart = i;

                        if (pulseEnd !== -1) {
                            const silenceLengthInSamples = i - pulseEnd;
                            if (silenceLengthInSamples > PulseGapLengthThresholdInSamples) {
                                channelPulseCounts.push(pulseCount);
                                pulseCount = 0;
                            }
                        }
                    } else {
                        pulseEnd = i;
                    }
                } else if (i - pulseStart > PulseTrainLengthInSamples) {
                    if (pulseStart !== -1) {
                        pulseCount++;
                        pulseStart = -1;
                    }
                }
            }

            if (pulseEnd !== -1) {
                const silenceLengthInSamples = i - pulseEnd;
                if (silenceLengthInSamples > PulseGapLengthThresholdInSamples) {
                    channelPulseCounts.push(pulseCount);
                }
            }

            pulseCounts[channel] = channelPulseCounts;
        }

        return pulseCounts;
    }

    /**
     * Gets the volumes of the test result's samples.
     *
     * The volume of each pulse is calculated by taking the absolute value of the samples and averaging them over the pulse length.
     *
     * The average volume is stored in the `volumeCurves` array for each channel, and is repeated for each sample in the pulse making
     * the resulting `volumeCurves` array length the same as the result's `samples` array, which makes it easier to find the
     * resulting volume at a given time.
     *
     * @returns an array containing the volume of each pulse aligned with channels and samples in the test result's samples
     */
    static async #GetVolumeCurvesAsync() {
        const result = await AudioV2Test.GetResultAsync();

        if (!result || !result.samples?.length) {
            return [];
        }

        if (result.volumeCurves) {
            return result.volumeCurves;
        }

        result.volumeCurves = [];
        result.volumeCurves.length = result.numberOfChannels;

        for (let channel = 0; channel < result.numberOfChannels; channel++) {
            const samples = result.samples[channel];

            let curve = new Float32Array(result.length);

            let currentPolarity = samples[0] > 0;
            let pulseStartIndex = 0;

            const updateCurve = (pulseEndIndex) => {
                const pulseLength = pulseEndIndex - pulseStartIndex;
                if (pulseLength > 2) {
                    // Don't include the first and last samples in the average volume calculation. They are typically
                    // values transitioning across the zero line when the polarity changes, and are not representative of
                    // the actual pulse volume.
                    let totalVolume = 0;
                    for (let j = pulseStartIndex + 1; j < pulseEndIndex - 1; j++) {
                        totalVolume += Math.abs(samples[j]);
                    }
                    const avgVolume = totalVolume / (pulseLength - 2);

                    for (let j = pulseStartIndex; j < pulseEndIndex; j++) {
                        curve[j] = avgVolume;
                    }
                }
            };

            let i = 0;
            for (; i < result.length; i++) {
                if (currentPolarity !== samples[i] > 0) {
                    updateCurve(i);
                    pulseStartIndex = i;
                    currentPolarity = !currentPolarity;
                }
            }
            updateCurve(i);

            result.volumeCurves[channel] = curve;
        }

        return result.volumeCurves;
    }

    /**
     * Gets the volumes of the test result's samples at a given time.
     *
     * @param time - the time in seconds to get the volumes at
     * @returns an array containing the volume of each channel at the given time
     */
    static async GetVolumesAtTimeAsync(time) {
        const result = await AudioV2Test.GetResultAsync();

        const volumes = [];
        volumes.length = result.numberOfChannels;

        const sampleIndex = Math.floor(time * result.sampleRate);
        const volumeCurves = await AudioV2Test.#GetVolumeCurvesAsync();

        for (let channel = 0; channel < result.numberOfChannels; channel++) {
            const curve = volumeCurves[channel];
            if (curve && sampleIndex < curve.length) {
                volumes[channel] = curve[sampleIndex] / MaxPulseVolume;
            } else {
                volumes[channel] = 0;
            }
        }

        return volumes;
    }

    static async GetResultAsync() {
        if (audioTestResult) {
            return audioTestResult;
        }

        let renderedBuffer;

        if (audioContext instanceof OfflineAudioContext) {
            renderedBuffer = await audioContext.startRendering();
        } else if (audioContext instanceof AudioContext) {
            // Wait for sounds to finish playing.
            for (let i = 0; i < audioTestSounds.length; i++) {
                const sound = audioTestSounds[i];
                if (sound.state !== BABYLON.SoundState.Stopped) {
                    await new Promise((resolve) => {
                        sound.onEndedObservable.addOnce(() => {
                            resolve();
                        });
                    });
                }
            }

            // Get rendered audio.
            await new Promise((resolve) => {
                audioRecorder.addEventListener(
                    "dataavailable",
                    async (event) => {
                        const arrayBuffer = await event.data.arrayBuffer();
                        if (arrayBuffer.byteLength === 0) {
                            throw new Error("No audio data.");
                        }

                        renderedBuffer = await audioContext.decodeAudioData(arrayBuffer);
                        resolve();
                    },
                    { once: true }
                );
                audioRecorder.stop();
            });

            if (!renderedBuffer) {
                throw new Error("No buffer rendered.");
            }
            if (renderedBuffer.length === 0) {
                throw new Error("No audio data in rendered buffer.");
            }
        }

        const capturedAudio = new Array(renderedBuffer.numberOfChannels);

        for (let i = 0; i < renderedBuffer.numberOfChannels; i++) {
            capturedAudio[i] = renderedBuffer.getChannelData(i);
        }

        audioTestResult = {
            length: renderedBuffer.length,
            numberOfChannels: renderedBuffer.numberOfChannels,
            sampleRate: renderedBuffer.sampleRate,
            samples: capturedAudio,
        };

        return new Promise((resolve) => {
            resolve(audioTestResult);
        });
    }

    static async GetErrorMessageAsync() {
        await AudioV2Test.GetResultAsync();
        return errorMessage;
    }

    static async WaitAsync(seconds, callback) {
        if (!audioContext) {
            throw new Error("Audio context is not initialized.");
        }

        if (audioContext instanceof AudioContext) {
            return new Promise((resolve) => {
                setTimeout(() => {
                    if (callback) {
                        callback();
                    }
                    resolve();
                }, seconds * 1000);
            });
        } else if (audioContext instanceof OfflineAudioContext) {
            audioTestSuspendTime += seconds;

            audioContext.suspend(audioTestSuspendTime).then(() => {
                if (callback) {
                    callback();
                    audioContext.resume();
                }
            });
        } else {
            throw new Error("Unknown audio context type.");
        }
    }

    static async WaitForParameterRampDurationAsync(callback) {
        await AudioV2Test.WaitAsync(audioEngine.parameterRampDuration, callback);
    }
}
