import type { IPathExtension } from "core/FlowGraph/flowGraphPath";
import { transformNodeExtension } from "./interactivityPathTransformNodeExtensions";
import { pbrMaterialExtension } from "./interactivityPathMaterialExtensions";
import { camerasExtension } from "./interactivityPathCameraExtensions";

export const interactivityPathExensions: IPathExtension[] = [transformNodeExtension, pbrMaterialExtension, camerasExtension];
