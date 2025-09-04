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
    /** The scale in which to play the animation. */
    scaleFactor: number;
    /** Optional variables to replace in the animation file. */
    variables: Nullable<Map<string, string>>;
    /** Optional configuration object to customize the animation playback. */
    configuration: Nullable<Partial<AnimationConfiguration>>;
    /** The parsed lottie animation if it is available */
    animationData?: RawLottieAnimation;
};

/** Payload for the "containerResize" message type */
export type ContainerResizeMessagePayload = {
    /** The new scale after the resize. */
    scaleFactor: number;
};

/**
 * Valid message types that can be sent between the main thread and the worker.
 */
export type MessageType = "animationUrl" | "animationSize" | "startAnimation" | "containerResize";

/**
 * Valid payload types that can be sent between the main thread and the worker.
 */
export type MessagePayload = AnimationUrlMessagePayload | AnimationSizeMessagePayload | StartAnimationMessagePayload | ContainerResizeMessagePayload;
