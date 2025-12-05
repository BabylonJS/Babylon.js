import { AttachInspectorGlobals, DetachInspectorGlobals } from "../../../../dev/inspector-v2/src/legacy/legacy";

export * from "../../../../dev/inspector-v2/src/legacy/legacy";

(<any>globalThis).INSPECTOR.AttachInspectorGlobals = AttachInspectorGlobals;
(<any>globalThis).INSPECTOR.DetachInspectorGlobals = DetachInspectorGlobals;
