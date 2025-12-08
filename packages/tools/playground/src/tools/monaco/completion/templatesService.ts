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
    }
}
