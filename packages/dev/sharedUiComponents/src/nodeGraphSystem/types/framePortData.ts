import type { GraphFrame } from "../graphFrame";

declare type FrameNodePort = import("../frameNodePort").FrameNodePort;

export type FramePortData = {
    frame: GraphFrame;
    port: FrameNodePort;
};
