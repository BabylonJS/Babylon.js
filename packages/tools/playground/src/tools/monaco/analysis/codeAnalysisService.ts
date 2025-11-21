/* eslint-disable jsdoc/require-jsdoc */
import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import type { GlobalState } from "../../../globalState";

export type TagCandidate = {
    name: string;
    tagName: string;
};

/**
 * Handles code analysis for Monaco editor, including tag candidate detection and diagnostics
 */
export class CodeAnalysisService {
    private _tagCandidates: TagCandidate[] | undefined;

    setTagCandidates(candidates: TagCandidate[] | undefined) {
        this._tagCandidates = candidates;
    }

    async analyzeCodeAsync(model: monaco.editor.ITextModel, globalState: GlobalState) {
        if (!this._tagCandidates || !model || model.isDisposed()) {
            return;
        }

        const uri = model.uri;
        const worker = globalState.language === "JS" ? await monaco.languages.typescript.getJavaScriptWorker() : await monaco.languages.typescript.getTypeScriptWorker();

        const languageService = await worker(uri);
        const source = "[preview]";
        monaco.editor.setModelMarkers(model, source, []);

        const markers: monaco.editor.IMarkerData[] = [];

        for (const candidate of this._tagCandidates) {
            if (model.isDisposed()) {
                continue;
            }
            const matches = model.findMatches(candidate.name, false, false, true, null, false);
            if (!matches) {
                continue;
            }

            for (const match of matches) {
                if (model.isDisposed()) {
                    continue;
                }
                const position = { lineNumber: match.range.startLineNumber, column: match.range.startColumn };
                const wordInfo = model.getWordAtPosition(position);
                const offset = model.getOffsetAt(position);
                if (!wordInfo) {
                    continue;
                }

                if (markers.find((m) => m.startLineNumber === position.lineNumber && m.startColumn === position.column)) {
                    continue;
                }

                try {
                    // eslint-disable-next-line no-await-in-loop
                    const details = await languageService.getCompletionEntryDetails(uri.toString(), offset, wordInfo.word);
                    if (!details || !details.tags) {
                        continue;
                    }

                    const tag = details.tags.find((t: any) => t.name === candidate.tagName);
                    if (tag) {
                        markers.push({
                            startLineNumber: match.range.startLineNumber,
                            endLineNumber: match.range.endLineNumber,
                            startColumn: wordInfo.startColumn,
                            endColumn: wordInfo.endColumn,
                            message: this._getTagMessage(tag),
                            severity: this._getCandidateMarkerSeverity(candidate),
                            source,
                        });
                    }
                } catch {
                    // Ignore analysis errors
                }
            }
        }

        monaco.editor.setModelMarkers(model, source, markers);
    }

    private _getCandidateMarkerSeverity(candidate: TagCandidate) {
        switch (candidate.tagName) {
            case "deprecated":
                return monaco.MarkerSeverity.Warning;
            default:
                return monaco.MarkerSeverity.Info;
        }
    }

    private _getCandidateCompletionSuffix(candidate: TagCandidate) {
        switch (candidate.tagName) {
            case "deprecated":
                return " ⚠️";
            default:
                return "";
        }
    }

    private _getTagMessage(tag: any) {
        let text = tag.text || "";
        if (text.length > 80) {
            text = text.substr(0, 80) + "...";
        }
        return text;
    }

    getCandidateCompletionSuffix(candidate: TagCandidate) {
        return this._getCandidateCompletionSuffix(candidate);
    }
}
