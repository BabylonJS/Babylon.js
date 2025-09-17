import * as monaco from "monaco-editor/esm/vs/editor/editor.api";

type Worker = monaco.languages.typescript.TypeScriptWorker;
type WorkerFactory = (uri: monaco.Uri) => Promise<Worker>;

let TsFactoryP: Promise<WorkerFactory> | undefined;
let JsFactoryP: Promise<WorkerFactory> | undefined;

const TsWorkerByUri = new Map<string, Promise<Worker>>();
const JsWorkerByUri = new Map<string, Promise<Worker>>();

/**
 *
 * @returns TS Worker factory
 */
export async function GetTsWorkerFactory(): Promise<WorkerFactory> {
    return await (TsFactoryP ??= monaco.languages.typescript.getTypeScriptWorker());
}

/**
 * @returns JS Worker factory
 */
export async function GetJsWorkerFactory(): Promise<WorkerFactory> {
    return await (JsFactoryP ??= monaco.languages.typescript.getJavaScriptWorker());
}

/**
 * @param uri monaco URI
 * @returns Worker
 */
export async function GetTsWorker(uri: monaco.Uri): Promise<Worker> {
    const key = uri.toString();
    let p = TsWorkerByUri.get(key);
    if (!p) {
        const factory = await GetTsWorkerFactory();
        p = factory(uri);
        TsWorkerByUri.set(key, p);
    }
    return await p;
}

/**
 * @param uri monaco URI
 * @returns Worker
 */
export async function GetJsWorker(uri: monaco.Uri): Promise<Worker> {
    const key = uri.toString();
    let p = JsWorkerByUri.get(key);
    if (!p) {
        const factory = await GetJsWorkerFactory();

        p = factory(uri);
        JsWorkerByUri.set(key, p);
    }
    return await p;
}

/**
 *
 * @param model Monaco model
 * @returns Worker
 */
export async function GetWorkerForModel(model: monaco.editor.ITextModel): Promise<Worker> {
    const lang = model.getLanguageId();
    if (lang === "javascript" || lang === "javascriptreact") {
        return await GetJsWorker(model.uri);
    }
    return await GetTsWorker(model.uri);
}

/**
 *
 */
export async function PreloadTsJsWorkers(): Promise<void> {
    await Promise.all([GetTsWorkerFactory(), GetJsWorkerFactory()]);
}

/**
 *
 */
export function ResetTsJsWorkerCaches(): void {
    TsFactoryP = undefined;
    JsFactoryP = undefined;
    TsWorkerByUri.clear();
    JsWorkerByUri.clear();
}
