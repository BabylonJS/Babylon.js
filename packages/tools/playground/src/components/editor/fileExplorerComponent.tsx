/* eslint-disable jsdoc/require-jsdoc */
import * as React from "react";
import type { GlobalState } from "../../globalState";

type Node = { name: string; path?: string; kind: "file" | "dir"; children?: Map<string, Node> };
function BuildTree(paths: string[]): Node {
    const root: Node = { name: "", kind: "dir", children: new Map() };
    for (const full of paths) {
        const parts = full.split("/");
        let cur = root;
        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            const isLast = i === parts.length - 1;
            const key = part.toLowerCase() + (isLast ? "|f" : "|d");
            if (!cur.children!.has(key)) {
                cur.children!.set(key, isLast ? { name: part, path: full, kind: "file" } : { name: part, kind: "dir", children: new Map() });
            }
            cur = cur.children!.get(key)!;
        }
    }
    return root;
}

export const FileExplorer: React.FC<{
    globalState: GlobalState;
    files: Record<string, string>;
    openFiles: string[];
    active: string | undefined;
    onOpen: (path: string) => void;
    onClose: (path: string) => void;
    onCreate: (suggestedPath?: string) => void;
    onRename: (oldPath: string, newPath: string) => void;
    onDelete: (path: string) => void;
}> = ({ globalState, files, openFiles, active, onOpen, onClose, onRename, onDelete }) => {
    const [tree, setTree] = React.useState(BuildTree(Object.keys(files)));
    React.useEffect(() => {
        const update = () => {
            setTree(BuildTree(Object.keys(globalState.files)));
        };
        globalState.onFilesChangedObservable.add(update);
        globalState.onActiveFileChangedObservable.add(update);

        return () => {
            globalState.onFilesChangedObservable.removeCallback(update);
            globalState.onActiveFileChangedObservable.removeCallback(update);
        };
    }, []);
    const render = (node: Node, depth = 0) => {
        if (node.kind === "file") {
            const isActive = node.path === active;
            const isOpen = openFiles.includes(node.path!);
            const isEntry = node.path === globalState.entryFilePath;
            return (
                <div
                    key={node.path}
                    className={`pg-expl-item file ${isActive ? "active" : ""} ${isOpen ? "open" : ""} ${isEntry ? "entry" : ""}`}
                    data-depth={depth}
                    onClick={() => onOpen(node.path!)}
                    title={node.path}
                >
                    <span className="name">
                        {node.name}
                        {isEntry && <span className="pg-expl-entry" aria-label="Entry file" title="Entry file" />}
                    </span>
                    <div className="actions">
                        {isOpen && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onClose(node.path!);
                                }}
                                title="Close"
                                className="action-btn close-btn"
                            >
                                ×
                            </button>
                        )}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onRename(node.path!, node.path!);
                            }}
                            title="Rename"
                            className="action-btn rename-btn"
                        >
                            ✎
                        </button>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete(node.path!);
                            }}
                            title="Delete"
                            className="action-btn delete-btn"
                        >
                            🗑
                        </button>
                    </div>
                </div>
            );
        }
        // dir
        const entries = Array.from(node.children!.values()).sort((a, b) => {
            if (a.path === globalState.entryFilePath) {
                return -1;
            }
            if (b.path === globalState.entryFilePath) {
                return 1;
            }

            if (a.kind !== b.kind) {
                return a.kind === "dir" ? -1 : 1;
            }

            return a.name.localeCompare(b.name);
        });
        return <div key={`dir:${node.name}`}>{entries.map((child) => render(child, depth + (node.name ? 1 : 0)))}</div>;
    };

    return <div className="pg-explorer">{render(tree)}</div>;
};
