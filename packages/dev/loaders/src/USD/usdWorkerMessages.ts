/* eslint-disable @typescript-eslint/naming-convention */

import { type USDLoadProgress } from "./usdLoadingOptions";

export interface WorkerAsset {
    bytes: Uint8Array;
    fileName: string;
    files?: Record<string, Uint8Array>;
    resolveByFileName: boolean;
    glueUrl?: string;
    wasmUrl?: string;
    dataUrl?: string;
}

export interface ExtractRequest {
    type: "extract";
    requestId: number;
    asset: WorkerAsset;
}

export interface WorkerTimings {
    totalMs: number;
    stageOpenMs: number;
    stageReadMs: number;
    preparationMs: number;
    packingMs: number;
    heapCopyMs: number;
}

export interface WorkerStatistics {
    nodes: number;
    meshes: number;
    analyticPrimitives: number;
    instances: number;
    materials: number;
    vertices: number;
    triangles: number;
    commandBytes: number;
    dataBytes: number;
}

export type WorkerResponse =
    | { type: "progress"; requestId: number; progress: USDLoadProgress }
    | { type: "log"; requestId: number; level: number; message: string }
    | {
          type: "result";
          requestId: number;
          commands: ArrayBuffer;
          data: ArrayBuffer;
          timings: WorkerTimings;
          statistics: WorkerStatistics;
          missingAssets: string[];
      }
    | { type: "error"; requestId: number; message: string; stack?: string };
