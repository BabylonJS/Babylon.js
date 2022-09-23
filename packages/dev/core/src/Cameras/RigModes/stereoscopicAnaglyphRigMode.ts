import type { Camera } from "../camera";
import { PassPostProcess } from "../../PostProcesses/passPostProcess";
import { AnaglyphPostProcess } from "../../PostProcesses/anaglyphPostProcess";

/**
 * @internal
 */
export function setStereoscopicAnaglyphRigMode(camera: Camera) {
    camera._rigCameras[0]._rigPostProcess = new PassPostProcess(camera.name + "_passthru", 1.0, camera._rigCameras[0]);
    camera._rigCameras[1]._rigPostProcess = new AnaglyphPostProcess(camera.name + "_anaglyph", 1.0, camera._rigCameras);
}
