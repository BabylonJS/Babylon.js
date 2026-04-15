import { type GlobalState, type InspectorV2Module } from "../globalState";
import { type WeaklyTypedServiceDefinition } from "shared-ui-components/modularTool/modularity/serviceContainer";
import { type IInspectableCommandRegistry } from "inspector/services/cli/inspectableCommandRegistry";

/**
 * Creates a service definition that registers Playground-specific CLI commands.
 * @param globalState The Playground's shared global state.
 * @param inspectorModule The Inspector v2 UMD module from the global INSPECTOR object.
 * @returns A weakly-typed service definition to pass as part of InspectableOptions.serviceDefinitions.
 */
export function MakePlaygroundCommandServiceDefinition(globalState: GlobalState, inspectorModule: InspectorV2Module): WeaklyTypedServiceDefinition {
    return {
        friendlyName: "Playground Command Service",
        consumes: [inspectorModule.InspectableCommandRegistryIdentity],
        factory: (commandRegistry: IInspectableCommandRegistry) => {
            // Track the last error from the Playground for the get-errors command.
            let lastError: { message: string; lineNumber?: number; columnNumber?: number } | null = null;
            const errorTracker = globalState.onErrorObservable.add((error) => {
                if (error) {
                    const msg = error.message;
                    lastError = {
                        message: typeof msg === "string" ? msg : (msg?.messageText ?? "Unknown error"),
                        lineNumber: error.lineNumber,
                        columnNumber: error.columnNumber,
                    };
                } else {
                    lastError = null;
                }
            });

            const listFilesReg = commandRegistry.addCommand({
                id: "list-files",
                description: "List all files managed in the Playground editor.",
                executeAsync: async () => {
                    const paths = Object.keys(globalState.files);
                    return JSON.stringify(paths, null, 2);
                },
            });

            const getContentReg = commandRegistry.addCommand({
                id: "get-content",
                description: "Get the content of a file by name.",
                args: [
                    {
                        name: "name",
                        description: "The file name (e.g. index.js, index.ts).",
                        required: true,
                    },
                ],
                executeAsync: async (args: Record<string, string>) => {
                    const content = globalState.files[args.name];
                    if (content === undefined) {
                        const names = Object.keys(globalState.files);
                        throw new Error(`File "${args.name}" not found. Available files: ${names.join(", ")}`);
                    }
                    return content;
                },
            });

            const setContentReg = commandRegistry.addCommand({
                id: "set-content",
                description: "Set the content of a file by name.",
                args: [
                    {
                        name: "name",
                        description: "The file name (e.g. index.js, index.ts).",
                        required: true,
                    },
                    {
                        name: "content",
                        description: "The new file content.",
                        required: true,
                        type: "file",
                    },
                ],
                executeAsync: async (args: Record<string, string>) => {
                    if (!(args.name in globalState.files)) {
                        const names = Object.keys(globalState.files);
                        throw new Error(`File "${args.name}" not found. Available files: ${names.join(", ")}`);
                    }
                    globalState.files[args.name] = args.content;
                    globalState.onFilesChangedObservable.notifyObservers();
                    return `File "${args.name}" updated.`;
                },
            });

            const createFileReg = commandRegistry.addCommand({
                id: "create-file",
                description: "Create a new file in the Playground editor.",
                args: [
                    {
                        name: "name",
                        description: "The file name to create (e.g. utils.ts).",
                        required: true,
                    },
                    {
                        name: "content",
                        description: "The initial file content. Defaults to empty.",
                        required: false,
                        type: "file",
                    },
                ],
                executeAsync: async (args: Record<string, string>) => {
                    if (args.name in globalState.files) {
                        throw new Error(`File "${args.name}" already exists.`);
                    }
                    const content = args.content ?? "";
                    globalState.files[args.name] = content;
                    globalState.onFilesChangedObservable.notifyObservers();
                    globalState.onManifestChangedObservable.notifyObservers();

                    // Open the new file as the active tab in the editor.
                    globalState.activeFilePath = args.name;
                    globalState.onActiveFileChangedObservable.notifyObservers();

                    return `File "${args.name}" created.`;
                },
            });

            const deleteFileReg = commandRegistry.addCommand({
                id: "delete-file",
                description: "Delete a file from the Playground editor.",
                args: [
                    {
                        name: "name",
                        description: "The file name to delete.",
                        required: true,
                    },
                ],
                executeAsync: async (args: Record<string, string>) => {
                    if (!(args.name in globalState.files)) {
                        const names = Object.keys(globalState.files);
                        throw new Error(`File "${args.name}" not found. Available files: ${names.join(", ")}`);
                    }
                    if (Object.keys(globalState.files).length <= 1) {
                        throw new Error("Cannot delete the last file.");
                    }
                    delete globalState.files[args.name];
                    globalState.onFilesChangedObservable.notifyObservers();
                    globalState.onManifestChangedObservable.notifyObservers();
                    return `File "${args.name}" deleted.`;
                },
            });

            const getSnippetIdReg = commandRegistry.addCommand({
                id: "get-snippet-id",
                description: "Get the current Playground snippet ID and revision.",
                executeAsync: async () => {
                    const token = globalState.currentSnippetToken;
                    if (!token) {
                        return "No snippet ID. This playground has not been saved yet.";
                    }
                    const revision = globalState.currentSnippetRevision;
                    return revision && revision !== "0" ? `${token}#${revision}` : token;
                },
            });

            const savePlaygroundReg = commandRegistry.addCommand({
                id: "save-playground",
                description: "Save the current Playground code and return the snippet ID.",
                args: [
                    {
                        name: "title",
                        description: "Snippet title. Uses existing value if not provided.",
                        required: false,
                    },
                    {
                        name: "description",
                        description: "Snippet description. Uses existing value if not provided.",
                        required: false,
                    },
                    {
                        name: "tags",
                        description: "Snippet tags. Uses existing value if not provided.",
                        required: false,
                    },
                ],
                executeAsync: async (args: Record<string, string>) => {
                    const result = await new Promise<string>((resolve, reject) => {
                        const timeout = setTimeout(() => {
                            errorObserver.remove();
                            savedObserver.remove();
                            reject(new Error("Save timed out."));
                        }, 30000);

                        const savedObserver = globalState.onSavedObservable.addOnce(() => {
                            clearTimeout(timeout);
                            errorObserver.remove();
                            const token = globalState.currentSnippetToken;
                            const revision = globalState.currentSnippetRevision;
                            resolve(revision && revision !== "0" ? `${token}#${revision}` : token);
                        });

                        const errorObserver = globalState.onErrorObservable.add((error) => {
                            // The error observable fires with null/undefined to clear a previous error; skip those.
                            if (!error) {
                                return;
                            }
                            clearTimeout(timeout);
                            errorObserver.remove();
                            savedObserver.remove();
                            const msg = error?.message;
                            reject(new Error(typeof msg === "string" ? msg : (msg?.messageText ?? "Save failed.")));
                        });

                        globalState.onSaveRequiredObservable.notifyObservers({
                            title: args.title,
                            description: args.description,
                            tags: args.tags,
                        });
                    });

                    return result;
                },
            });

            const runPlaygroundReg = commandRegistry.addCommand({
                id: "run-playground",
                description: "Run the current Playground code. The session will restart with a new session ID.",
                executeAsync: async () => {
                    // Defer the run so the command response is sent before the
                    // scene teardown kills the inspectable WebSocket session.
                    setTimeout(() => globalState.onRunRequiredObservable.notifyObservers(), 0);
                    return "Run triggered.";
                },
            });

            const getErrorsReg = commandRegistry.addCommand({
                id: "get-errors",
                description: "Get compile and runtime errors from the Playground.",
                executeAsync: async () => {
                    return JSON.stringify(
                        {
                            compileErrors: globalState.getDiagnostics(),
                            runtimeError: lastError,
                        },
                        null,
                        2
                    );
                },
            });

            return {
                dispose: () => {
                    errorTracker.remove();
                    listFilesReg.dispose();
                    getContentReg.dispose();
                    setContentReg.dispose();
                    createFileReg.dispose();
                    deleteFileReg.dispose();
                    getSnippetIdReg.dispose();
                    savePlaygroundReg.dispose();
                    runPlaygroundReg.dispose();
                    getErrorsReg.dispose();
                },
            };
        },
    };
}
