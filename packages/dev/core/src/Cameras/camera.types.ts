/* eslint-disable @typescript-eslint/naming-convention */
import { type CameraParse } from "./camera.pure";

type CameraParseType = typeof CameraParse;

declare module "./camera.pure" {
    namespace Camera {
        export let Parse: CameraParseType;
    }
}
