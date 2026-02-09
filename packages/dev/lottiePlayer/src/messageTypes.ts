import type { Nullable } from "core/types";
import type { AnimationConfiguration } from "./animationConfiguration";
import type { RawLottieAnimation } from "./parsing/rawTypes";

/**
 * Generic type representing a message sent between the main thread and the worker.
 */
export type Message = {
    /** The type of the message. */
    type: MessageType;
    /** The payload of the message. */
    payload: MessagePayload;
};

/**
 * Message that indicates the URL of the animation to be loaded.
 * Main thread sends to Worker
 */
export type AnimationUrlMessage = {
    /** The type of the message. */
    type: "animationUrl";
    /** The payload of the message. */
    payload: AnimationUrlMessagePayload;
};

/**
 * Message that indicates the size of the animation.
 * Worker sends to Main thread
 */
export type AnimationSizeMessage = {
    /** The type of the message. */
    type: "animationSize";
    /** The payload of the message. */
    payload: AnimationSizeMessagePayload;
};

/**
 * Message that indicates to start rendering an animation.
 * Main thread sends to Worker
 */
export type StartAnimationMessage = {
    /** The type of the message. */
    type: "startAnimation";
    /** The payload of the message. */
    payload: StartAnimationMessagePayload;
};

/**
 * Message that indicates the container has been resized.
 * Main thread sends to Worker
 */
export type ContainerResizeMessage = {
    /** The type of the message. */
    type: "containerResize";
    /** The payload of the message. */
    payload: ContainerResizeMessagePayload;
};

/**
 * Message that requests the worker to pre-warm (load necessary code).
 * Main thread sends to Worker
 */
export type PreWarmMessage = {
    /** The type of the message. */
    type: "preWarm";
    /** The payload of the message. */
    payload: PreWarmMessagePayload;
};

/**
 * Message that indicates the worker has finished loading and is ready.
 * Worker sends to Main thread
 */
export type WorkerLoadedMessage = {
    /** The type of the message. */
    type: "workerLoaded";
    /** The payload of the message. */
    payload: WorkerLoadedMessagePayload;
};

export type DisposeMessage = {
    /** The type of the message */
    type: "dispose";
    /** The payload of the message */
    payload: DisposeMessagePayload;
};

/** Payload for the "animationUrl" message type. */
export type AnimationUrlMessagePayload = {
    /** The URL of the animation to be loaded. */
    url: string;
};

/** Payload for the "animationSize" message type. */
export type AnimationSizeMessagePayload = {
    /** The width of the animation. */
    width: number;
    /** The height of the animation. */
    height: number;
};

/** Payload for the "startAnimation" message type. */
export type StartAnimationMessagePayload = {
    /** The canvas element to render the animation on. */
    canvas: OffscreenCanvas;
    /** The canvas/viewport scale factor (may be \< 1 when the animation is larger than the container). */
    canvasScale: number;
    /** The sprite-atlas scale factor (always \>= 1 so sprites are never rasterised too small). */
    atlasScale: number;
    /** Optional variables to replace in the animation file. */
    variables: Nullable<Map<string, string>>;
    /** Optional configuration object to customize the animation playback. */
    configuration: Nullable<Partial<AnimationConfiguration>>;
    /** The parsed lottie animation if it is available */
    animationData?: RawLottieAnimation;
    /** The devicePixelRatio from the main thread (workers can't access window.devicePixelRatio) */
    mainThreadDevicePixelRatio: number;
};

/** Payload for the "containerResize" message type */
export type ContainerResizeMessagePayload = {
    /** The new canvas scale after the resize. */
    canvasScale: number;
};

/** Payload for the "preWarm" message type */
export type PreWarmMessagePayload = {};

/** Payload for the "workerLoaded" message type */
export type WorkerLoadedMessagePayload = {
    /** Indicates whether the loading was successful */
    success: boolean;
    /** Optional error message if loading failed */
    error?: string;
};

/** Payload for the "dispose" message type */
export type DisposeMessagePayload = {};

/**
 * Valid message types that can be sent between the main thread and the worker.
 */
export type MessageType = "animationUrl" | "animationSize" | "startAnimation" | "containerResize" | "preWarm" | "workerLoaded" | "dispose";

/**
 * Valid payload types that can be sent between the main thread and the worker.
 */
export type MessagePayload =
    | AnimationUrlMessagePayload
    | AnimationSizeMessagePayload
    | StartAnimationMessagePayload
    | ContainerResizeMessagePayload
    | PreWarmMessagePayload
    | WorkerLoadedMessagePayload
    | DisposeMessagePayload;
