/* eslint-disable jsdoc/require-jsdoc */
export type TemplateItem = {
    label: string;
    key: string;
    documentation: string;
    insertText: string;
    language: string;
    kind: number;
    sortText: string;
    insertTextRules: number;
};

export class TemplatesService {
    private _templates: TemplateItem[] = [];
    get templates() {
        return this._templates;
    }

    async loadAsync() {
        try {
            const templatesCodeUrl = "templates.json?uncacher=" + Date.now();
            this._templates = await (await fetch(templatesCodeUrl)).json();
            for (const t of this._templates) {
                t.kind = 27 as any; // Snippet
                t.sortText = "!" + t.label;
                t.insertTextRules = 4 as any; // InsertAsSnippet
            }
        } catch {
            // ignore
        }
        // Built-in import-style snippets (one-click) for the ES module workflow.
        // Always available, even if the remote templates failed to load.
        this._templates.push(...BuiltInImportTemplates);
    }
}

// One-click snippets to switch a Playground between import styles.
const BuiltInImportTemplates: TemplateItem[] = [
    {
        label: "Babylon: namespace import (ESM)",
        key: "pg-import-namespace",
        documentation: "Import the whole Babylon namespace as `BABYLON` (default style).",
        insertText: 'import * as BABYLON from "@babylonjs/core";\n',
        language: "both",
        kind: 27, // Snippet
        sortText: "!Babylon: namespace import (ESM)",
        insertTextRules: 4, // InsertAsSnippet
    },
    {
        label: "Babylon: named imports (ESM)",
        key: "pg-import-named",
        documentation: "Import individual Babylon classes by name from `@babylonjs/core`.",
        insertText: 'import { ${1:Scene, Engine, FreeCamera, HemisphericLight, Vector3, MeshBuilder} } from "@babylonjs/core";\n',
        language: "both",
        kind: 27, // Snippet
        sortText: "!Babylon: named imports (ESM)",
        insertTextRules: 4, // InsertAsSnippet
    },
    {
        label: "Babylon: legacy global (no import)",
        key: "pg-legacy-global",
        documentation: "Use the global `BABYLON` namespace without any import (legacy style).",
        insertText: "// Legacy style: the global `BABYLON` namespace is available without an import.\n",
        language: "both",
        kind: 27, // Snippet
        sortText: "!Babylon: legacy global (no import)",
        insertTextRules: 4, // InsertAsSnippet
    },
];
