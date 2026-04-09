import { type GlobalState } from "../globalState";
import { type WeaklyTypedServiceDefinition } from "inspector/modularity/serviceContainer";

type InspectorV2Module = typeof import("inspector/legacy/legacy") & typeof import("inspector/index");

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
        factory: (commandRegistry: any) => {
            const listFilesReg = commandRegistry.addCommand({
                id: "list-files",
                description: "List all files managed in the Playground editor.",
                executeAsync: async () => {
                    const paths = Object.keys(globalState.files);
                    return JSON.stringify(paths, null, 2);
                },
            });

            const getFileReg = commandRegistry.addCommand({
                id: "get-file",
                description: "Get the content of a file by path.",
                args: [
                    {
                        name: "path",
                        description: "The file path (e.g. index.js, index.ts).",
                        required: true,
                    },
                ],
                executeAsync: async (args: Record<string, string>) => {
                    const content = globalState.files[args.path];
                    if (content === undefined) {
                        const paths = Object.keys(globalState.files);
                        throw new Error(`File "${args.path}" not found. Available files: ${paths.join(", ")}`);
                    }
                    return content;
                },
            });

            const setFileReg = commandRegistry.addCommand({
                id: "set-file",
                description: "Set the content of a file by path.",
                args: [
                    {
                        name: "path",
                        description: "The file path (e.g. index.js, index.ts).",
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
                    if (!(args.path in globalState.files)) {
                        const paths = Object.keys(globalState.files);
                        throw new Error(`File "${args.path}" not found. Available files: ${paths.join(", ")}`);
                    }
                    globalState.files[args.path] = args.content;
                    globalState.onFilesChangedObservable.notifyObservers();
                    return `File "${args.path}" updated.`;
                },
            });

            const createFileReg = commandRegistry.addCommand({
                id: "create-file",
                description: "Create a new file in the Playground editor.",
                args: [
                    {
                        name: "path",
                        description: "The file path to create (e.g. utils.ts).",
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
                    if (args.path in globalState.files) {
                        throw new Error(`File "${args.path}" already exists.`);
                    }
                    const content = args.content ?? "";
                    globalState.files[args.path] = content;
                    globalState.onFilesChangedObservable.notifyObservers();
                    globalState.onManifestChangedObservable.notifyObservers();

                    // Open the new file as the active tab in the editor.
                    globalState.activeFilePath = args.path;
                    globalState.onActiveFileChangedObservable.notifyObservers();

                    return `File "${args.path}" created.`;
                },
            });

            const deleteFileReg = commandRegistry.addCommand({
                id: "delete-file",
                description: "Delete a file from the Playground editor.",
                args: [
                    {
                        name: "path",
                        description: "The file path to delete.",
                        required: true,
                    },
                ],
                executeAsync: async (args: Record<string, string>) => {
                    if (!(args.path in globalState.files)) {
                        const paths = Object.keys(globalState.files);
                        throw new Error(`File "${args.path}" not found. Available files: ${paths.join(", ")}`);
                    }
                    if (Object.keys(globalState.files).length <= 1) {
                        throw new Error("Cannot delete the last file.");
                    }
                    delete globalState.files[args.path];
                    globalState.onFilesChangedObservable.notifyObservers();
                    globalState.onManifestChangedObservable.notifyObservers();
                    return `File "${args.path}" deleted.`;
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

                        const errorObserver = globalState.onErrorObservable.addOnce((error) => {
                            clearTimeout(timeout);
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

            return {
                dispose: () => {
                    listFilesReg.dispose();
                    getFileReg.dispose();
                    setFileReg.dispose();
                    createFileReg.dispose();
                    deleteFileReg.dispose();
                    getSnippetIdReg.dispose();
                    savePlaygroundReg.dispose();
                },
            };
        },
    };
}
