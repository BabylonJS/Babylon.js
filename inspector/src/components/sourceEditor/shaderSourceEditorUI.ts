/* Credit: Some code adapted from:
 * https://github.com/patriciogonzalezvivo/glslEditor
 * MIT licensed.
 */
class DiagnosticsManager {
    lineWidgets: any[] = [];

    constructor(readonly doc: HTMLDocument, readonly cm: any) {
    }
    removeAllErrors() {
        for (const lineWidget of this.lineWidgets) {
            this.cm.removeLineWidget(lineWidget);
        }
        this.lineWidgets.length = 0;
    }
    addError(line1: number, line2: number, errorMessage: string) {
        let $message = this.doc.createElement('div');

        let icon = $message.appendChild(this.doc.createElement('span'));
        icon.className = 'sseInlineErrorCloseButton';
        icon.innerHTML = '\u00d7';
        $message.appendChild(this.doc.createTextNode(errorMessage));
        $message.className = 'sseInlineError';
        const lineWidget = this.cm.addLineWidget(line2-1, $message);
        this.lineWidgets.push(lineWidget); //, { coverGutter: false, noHScroll: true }));
        icon.addEventListener('click', () => {
            this.cm.removeLineWidget(lineWidget);
            const index = this.lineWidgets.indexOf(lineWidget);
            if (index >= 0) {
                this.lineWidgets.splice(index, 1);
            }
        });
    }
}

/*
 * Remove all spaces and tabs, and collapse newlines before diff.
 * Prevents mere indentation changes from affecting diff scores
 */
function editDistanceNormalizeWhitespace(str: string): string {
    return str.replace(/[ \t]+/g, '').replace(/[\r\n]+/g, '\n');
}
function splitLines(txt: string) {
    const linesRegex = /^.+$/gm;
    let m;
    const lines = [];
    while (m = linesRegex.exec(txt)) {
        lines.push(m[0]);
    }
    return lines;
}
function countOccurrences<T>(lines: T[]): Map<T, number> {
    const m = new Map<T, number>();
    for (const line of lines) {
        const n = m.get(line)||0;
        m.set(line, n + 1);
    }
    return m;
}
function fastEditDistance(sourceA: string, sourceB: string): number {
    const linesA = countOccurrences(splitLines(sourceA));
    const linesB = countOccurrences(splitLines(sourceB));
    const linesConcat = [] as string[];
    linesA.forEach((unused, line) => {
        linesConcat.push(line);
    });
    linesB.forEach((unused, line) => {
        linesConcat.push(line);
    });
    const linesNoDuplicates = new Set(linesConcat);
    let added = 0;
    let removed = 0;
    linesNoDuplicates.forEach((line) => {
        const nafter = linesA.get(line)||0;
        const nbefore = linesB.get(line)||0;
        if (nbefore < nafter) {
            added++;
        } else if (nbefore > nafter) {
            removed++;
        }
    });
    return Math.max(added, removed);
} 

interface HistoryRevision {
    id: number;
    ts: number;
    frag: string;
    vert: string;
    diff: number;
    ok: number;
    err?: string;
}
export class HistoryDataSource {
    static readonly MAX_SIZE_BYTES = 500000;

    private localStorageKey: string;
    private editDistanceScores = new Map<string, number>();
    constructor(keys: string[]) {
        this.localStorageKey = 'bbjs_sse_'+keys.join('\x1f');
    }

    editDistanceScore(revA: HistoryRevision, revB: HistoryRevision): number {
        const afrag = editDistanceNormalizeWhitespace(revA.frag);
        const avert = editDistanceNormalizeWhitespace(revA.vert);
        const bfrag = editDistanceNormalizeWhitespace(revB.frag);
        const bvert = editDistanceNormalizeWhitespace(revB.vert);

        const MEMOIZE_THRESHOLD = 200;
        const shouldMemoize = (
            afrag.length > MEMOIZE_THRESHOLD || avert.length > MEMOIZE_THRESHOLD
            || bfrag.length > MEMOIZE_THRESHOLD || bvert.length > MEMOIZE_THRESHOLD
        );

        let memoizeKey: string|undefined;
        if (shouldMemoize) {
            memoizeKey = `${revA.id}_${revB.id}`;
            const memoizeValue = this.editDistanceScores.get(memoizeKey);
            if (memoizeValue) {
                return memoizeValue;
            }
        }

        let value = fastEditDistance(afrag, bfrag) + fastEditDistance(avert, bvert);

        if (memoizeKey) {
            this.editDistanceScores.set(memoizeKey, value);
        }
        return value;
    }

    revisionsAreExactlySame(revA: HistoryRevision, revB: HistoryRevision): boolean {
        return revA.frag === revB.frag && revA.vert === revB.vert;
    }
    canElide(revA: HistoryRevision, revB: HistoryRevision): boolean {
        const MINUTES = 60*1000;
        const timeDelta = revA.ts - revB.ts;

        // Save a new, valid version every five minutes
        if (revA.ok && Math.abs(timeDelta) > 5*MINUTES) {
            return false;
        }

        const score = this.editDistanceScore(revA, revB);
        if (score <= 2) {
            return true;
        }
        return false;
    }

    saveRevision(isMilestone: boolean, frag: string, vert: string, err?: string): number {
        const id = Math.floor(Math.random()*4294967295); // only 32-bit but not a big deal if collision
        const ts = Date.now();
        const newRev = {
            id,
            ts,
            frag,
            vert,
            diff: 0,
            ok: +!err,
            err,
        };

        let redrawAmount = 1; // redraw first only

        // If the first revision was dropped, then we did not save a new revision
        const revs = this.revisions();
        const nextRev = revs[0];
        if (nextRev) {
            if (this.revisionsAreExactlySame(newRev, nextRev)) {
                return 0; // no redraw
            }

            if (!isMilestone && this.canElide(newRev, nextRev)) {
                revs[0] = newRev;
            } else {
                revs.unshift(newRev);
                redrawAmount = 2; // full redraw
            }
        } else {
            revs.push(newRev);
        }
        const serialized = this.serialize(revs);

        window.localStorage.setItem(this.localStorageKey, serialized);
        return redrawAmount;
    }

    revisions(): HistoryRevision[] {
        const jsons = this.revisionsEncoded().split(/\n/g);
        const out = [];
        for (const json of jsons) {
            try {
                const rev: any = JSON.parse(json);
                if (!this.revisionIsValid(rev)) {
                    continue;
                }
                out.push(rev);
            } catch {
            }
        }
        return out;
    }

    revisionsEncoded(): string {
        return window.localStorage.getItem(this.localStorageKey) || '';
    }

    revisionIsValid(rev: HistoryRevision): rev is HistoryRevision {
        return (rev
            && typeof (rev.frag) === 'string'
            && typeof (rev.vert) === 'string'
            && Number.isSafeInteger(rev.ts));
    }

    serialize(revisions: HistoryRevision[], stopIfFirstWasDropped = false): string {
        // "JSON lines" is used because it makes it easy to measure the size of
        // the string.
        const lines = [];
        let totalBytes = 0;

        for (const rev of revisions) {
            const encoded = JSON.stringify(rev);
            const bytes = encoded.length*2 + 1; // UCS2
            if (bytes + totalBytes > HistoryDataSource.MAX_SIZE_BYTES) {
                break; // we ran out of space, stop
            }

            totalBytes += bytes;
            lines.push(encoded);
        }

        return lines.join('\n');
    }
}

class CodeMirrorController {
    cm: any;
    diagnosticsManager: DiagnosticsManager;

    constructor(readonly doc: HTMLDocument, id: string, value: string, isReadonly: boolean) {
        const CodeMirror = (doc.defaultView! as any).CodeMirror;
        const cm = CodeMirror((elt: HTMLElement) => {
            const $textarea = doc.getElementById(id);
            $textarea!.parentNode!.replaceChild(elt, $textarea!);
        }, {
            value,
            mode: 'x-shader/x-vertex', // no difference between fragment and shader modes
            theme: 'bjs',
            lineNumbers: true,
            viewportMargin: Infinity,
            readonly: isReadonly,
            // keyMap: 'sublime',
            // extraKeys: { 'Ctrl-Space': 'autocomplete' },
            matchBrackets: true,
            autoCloseBrackets: true,
            dragDrop: false,
            // indentUnit: main.options.indentUnit,
            // tabSize: main.options.tabSize,
            // indentWithTabs: main.options.indentWithTabs,
            lineWrapping: true,
        });
        this.cm = cm;
        this.diagnosticsManager = new DiagnosticsManager(doc, cm);
    }
}

function renderDateString(ts: number) {
    const d0 = new Date(ts);
    const d1 = new Date();

    const dY = d1.getFullYear() - d0.getFullYear();
    const dM = d1.getMonth() - d0.getMonth();
    const dD = d1.getDate() - d0.getDate();

    const deltaSeconds = (d1.getTime() - d0.getTime())/1000;
    const dh = Math.floor(deltaSeconds/3600);
    const dm = Math.floor(deltaSeconds/60);

    if (dY !== 0) {
        return `${dY} year`;
    } else if (dM !== 0) {
        return `${dM} month`;
    } else if (dD !== 0) {
        return `${dD} day`;
    } else if (dh !== 0) {
        return `${dh} hour`;
    } else if (dm !== 0) {
        return `${dm} min`;
    }
    return 'now';
}

export type ShaderSourceRecompileCallback = (success: boolean, rawErrors: string) => void;
export interface IShaderSourceRenderDelegate {
    recompile(fragSource: string, vertexSource: string, callback: ShaderSourceRecompileCallback): void;
}

class ShaderSourceEditorRenderer {
    readonly doc: HTMLDocument;
    constructor(
        readonly hostElement: HTMLElement,
        readonly dataSource: HistoryDataSource,
        readonly fragSource: string,
        readonly vertexSource: string,
        readonly delegate: IShaderSourceRenderDelegate) {

        this.doc = this.hostElement.ownerDocument!
    }

    $container!: HTMLDivElement;
    render() {
        const doc = this.doc;
        const $head = doc.head;

        const css = `
html#sseRoot {
  background-color: #1e1e1e;
}
html#sseRoot body {
  margin: 0;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  width: 100%;
  height: 100%;
  padding: 0;
}
#sseContainer {
  display: flex;
  height: 100vh;
  flex-direction: column;
}
#sseToolbar {
  flex: 0;
  display: flex;
  flex-direction: row;
  justify-content: center;
}
#sseEditors {
  flex: 1;
  display: flex;
  flex-direction: row;
}
.sseEditorContainer {
  flex: 1;
  display: flex;
  flex-direction: column;
}
#sseEditors:not(.ssePreviewMode) #sseEditorContainerFragPreview, #sseEditors:not(.ssePreviewMode) #sseEditorContainerVertexPreview {
  display: none;
}
#sseEditors.ssePreviewMode #sseEditorContainerFrag, #sseEditors.ssePreviewMode #sseEditorContainerVertex {
  display: none;
}

#sseContainer.sseHideFrag #sseEditorContainerFrag, #sseContainer.sseHideFrag #sseEditorContainerFragPreview {
  display: none;
}
#sseContainer.sseHideVertex #sseEditorContainerVertex, #sseContainer.sseHideVertex #sseEditorContainerVertexPreview {
  display: none;
}

#sseToolbar, .sseErrors, #sseHistoryBar {
  background: rgb(40, 40, 40);
}
.sseButton {
  display: flex;
  flex-direction: row;
  color: white;
  margin: 10px 5px;
  user-select: none;
}
.sseSplitButtonPart, .ssePushButton {
  padding: 6px;
}
.sseSplitButtonPart {
  border: 1px solid hsl(0, 0%, 27%);
}
.sseSplitButtonPart.sseSelected {
  background: hsl(0, 0%, 27%);
  border-color: transparent;
}
.sseSplitButtonPart:hover, .ssePushButton:hover {
  border-color: hsl(0, 0%, 50%);
}
#sseButtonFrag {
  border-top-left-radius: 3px;
  border-bottom-left-radius: 3px;
}
#sseButtonVertex {
  border-top-right-radius: 3px;
  border-bottom-right-radius: 3px;
}

.sseErrors {
  padding: 10px 20px;
}
.CodeMirror {
  flex-grow: 1;
  min-width: 0;
}
.sseErrors {
  flex: 0;

  color: white;
}

#sseHistoryBar {
}
.sseHistoryRevision {
  padding: 4px 4px;
  transition: all 100ms linear;
  width: 30px;
  height: 4px;
}
.sseHistoryRevisionInner {
  background: hsl(0, 0%, 50%);
  height: 100%;
  border-radius: 50px;
  transition: all 100ms linear;
}
.sseHistoryRevision:hover {
  height: 15px;
}
.sseHistoryRevision:hover .sseHistoryRevisionInner {
  background-color: white;
}
.sseHistoryDateSeparator {
  text-align: center;
  font-size: 10px;
  color: hsl(0, 0%, 50%);
  user-select: none;
}

/* Code mirror */

.CodeMirror {
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace !important;
  font-size: 12.5px !important;
  height: unset !important;
}
.CodeMirror-linenumber {
  margin-left: -10px !important;
}
.CodeMirror-lines {
  padding-left: 20px !important;
}

.cm-s-bjs .cm-keyword { color: #C586C0; }
.cm-s-bjs .cm-type { color: #569CD6; }
.cm-s-bjs .cm-comment { color: #6A9955; }
.cm-s-bjs .cm-number { color: #B5CEA8; }
.cm-s-bjs .cm-meta { color: #C586C0; }
.cm-s-bjs .cm-atom { color: #9CDCFE; }
.cm-s-bjs .cm-string { color: #CE9178; }
.cm-s-bjs .cm-string-2 { color: #6A8759; }
/*
.cm-s-bjs .cm-builtin { color: #A9B7C6; }
.cm-def
.cm-variable
.cm-variable-2
.cm-variable-3
.cm-type
.cm-property
.cm-operator
.cm-link
.cm-error
.cm-tag
.cm-attribute
.cm-qualifier
.cm-bracket
*/

.sseEditorContainer {
  background: #1e1e1e;
  min-width: 0;
}
.cm-s-bjs.CodeMirror {
  background: #1e1e1e;
  color: #e9e9e9;
}
#sseEditors.ssePreviewMode .cm-s-bjs.CodeMirror {
  opacity: 0.66;
}
.cm-s-bjs .CodeMirror-cursor {
  border-left: 1px solid #bebebe;
}
.CodeMirror-activeline-background {
  background: #3A3A3A;
}
.cm-s-bjs div.CodeMirror-selected {
  background: #1e496c;
}
.cm-s-bjs .CodeMirror-gutters {
  background: #1e1e1e;
  border-right-style: none;
  color: #606366
}
.cm-s-bjs {
  font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
}
.cm-s-bjs .CodeMirror-matchingbracket {
  background-color: #3b514d; color: yellow !important;
}

.CodeMirror-hints.bjs {
  color: white;
  background-color: #3b3e3f !important;
}

.CodeMirror-hints.bjs .CodeMirror-hint-active {
  background-color: #494d4e !important;
  color: #9c9e9e !important;
}

.sseInlineError {
  background: hsl(0, 60%, 30%);
  color: hsl(0, 100%, 95%);  
  font-size: 11px;
  padding: 3px;
  padding-top: 2px;
}
.sseInlineErrorCloseButton {
  user-select: none;
  cursor: pointer;
  border-radius: 100px;
  width: 15px;
  height: 15px;
  text-align: center;
  display: inline-block;
  background: hsla(0, 60%, 75%, 0.5);
}
.sseInlineErrorCloseButton:hover {
  background: red;
}
`;

        const $style = doc.createElement('style');
        $style.appendChild(doc.createTextNode(css));

        const $container = this.$container = doc.createElement('div');
        $container.id = 'sseContainer';

        function makeEditorContainerFor(fragOrVertex: string) {
            return `<div class="sseEditorContainer" id="sseEditorContainer${fragOrVertex}">
                <textarea class="sseEditor" id="sse${fragOrVertex}"></textarea>
            </div>`;
        }
        $container.innerHTML = `
            <div id="sseToolbar">
                <div class="sseButton sseSplitButton" id="sseButtonFragVertex">
                    <div class="sseSplitButtonPart sseSelected" id="sseButtonFrag">Fragment</div>
                    <div class="sseSplitButtonPart sseSelected" id="sseButtonVertex">Vertex</div>
                </div>
            </div>
            <div id="sseEditors">
                ${makeEditorContainerFor('Frag')}
                ${makeEditorContainerFor('FragPreview')}
                <div id="sseHistoryBar"></div>
                ${makeEditorContainerFor('Vertex')}
                ${makeEditorContainerFor('VertexPreview')}
            </div>
        `;
        const $cmStyle = doc.createElement('link');
        $cmStyle.rel = 'stylesheet';
        $cmStyle.href = 'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.54.0/codemirror.min.css';
        $cmStyle.integrity = 'sha256-Ez4TnBJ24JkU8Z622YHGxDaYrslkqNZ62ewvn08Skco=';
        $cmStyle.crossOrigin = 'anonymous';

        const $cmScript = doc.createElement('script');
        $cmScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.54.0/codemirror.min.js';
        $cmScript.integrity = 'sha256-zW3RviTWD2qcjPDA/ByugxSFO5EPHb8Yl0Z6o7X9Zqk=';
        $cmScript.crossOrigin = 'anonymous';
        $cmScript.onload = () => {
            const $cmClikeScript = doc.createElement('script');
            $cmClikeScript.src = "https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.54.0/mode/clike/clike.min.js";
            $cmClikeScript.integrity = "sha256-ighs+pKTIY6PrbzjYe+5QW1d0stauTQw6O8OAJanjGM=";
            $cmClikeScript.crossOrigin = "anonymous";

            $cmClikeScript.onload = this.onload.bind(this);

            $head.appendChild($cmClikeScript);
        };
        $head.appendChild($cmStyle);
        $head.appendChild($style); // must be second
        $head.appendChild($cmScript);

        this.hostElement.appendChild($container);
    }

    processErrors(errors: string, cmcF: CodeMirrorController, cmcV: CodeMirrorController) {
        cmcF.diagnosticsManager.removeAllErrors();
        cmcV.diagnosticsManager.removeAllErrors();

        const regexp = /^(VERTEX\s+|FRAGMENT\s+)?(?:SHADER\s+)?ERROR:\s+(\d+):(\d+):([^\n]+)/gm;
        let match: RegExpExecArray | null;
        while (match = regexp.exec(errors)) {
            const [unused, kind, line1, line2, msg] = match;
            void(unused);
            const cmc = kind.startsWith('VERTEX') ? cmcV : cmcF;
            cmc.diagnosticsManager.addError(Number(line1), Number(line2), msg);
        }
    }
    onload() {
        const { doc, $container } = this;

        const cmcVertex = new CodeMirrorController(doc, 'sseVertex', this.vertexSource, false);
        const cmcVertexPreview = new CodeMirrorController(doc, 'sseVertexPreview', '', true);
        const $historyBar = doc.getElementById('sseHistoryBar')!;
        const cmcFrag = new CodeMirrorController(doc, 'sseFrag', this.fragSource, false);
        const cmcFragPreview = new CodeMirrorController(doc, 'sseFragPreview', '', true);
        const cmcs = [cmcVertex, cmcFrag];

        const $buttonFrag = doc.getElementById('sseButtonFrag')!;
        const $buttonVertex = doc.getElementById('sseButtonVertex')!;

        let milestoneFrag: string|undefined;
        let milestoneVertex: string|undefined;
        const setMilestone = (frag: string, vertex: string) => {
            milestoneFrag = frag;
            milestoneVertex = vertex;
        };
        const isMilestone = (frag: string, vertex: string) => {
            return milestoneFrag === frag && milestoneVertex === vertex;
        }

        const refreshCMCs = (cmc1: CodeMirrorController, cmc2: CodeMirrorController) => {
            // If you update code mirror's via setValue while it is display:none,
            // you must manually refresh it after it becomes un-display:none'd.
            // https://stackoverflow.com/a/19970695/1165750
            cmc1.cm.refresh();
            cmc2.cm.refresh();
            // Cargo-cultish but possibly avoids race condition (?) and is
            // pretty benign.
            setTimeout(() => {
                cmc1.cm.refresh();
                cmc2.cm.refresh();;
            }, 40); // ~2 frames
        };

        // Consider refactoring if these functions get any more complicated
        const generateButtonClickHandler = ($elA: HTMLElement, classnameA: string, classnameB: string) => {
            return () => {
                const cl = $container.classList;
                if (cl.contains(classnameA)) {
                    cl.remove(classnameA);
                    $elA.classList.add('sseSelected');
                    refreshCMCs(cmcFrag, cmcVertex);
                } else {
                    if (!cl.contains(classnameB)) {
                        cl.add(classnameA);
                        $elA.classList.remove('sseSelected');
                        refreshCMCs(cmcFrag, cmcVertex);
                    }
                }
            }
        };

        $buttonFrag.addEventListener('click', generateButtonClickHandler($buttonFrag, 'sseHideFrag', 'sseHideVertex'));
        $buttonVertex.addEventListener('click', generateButtonClickHandler($buttonVertex, 'sseHideVertex', 'sseHideFrag'));

        const editorsCl = doc.getElementById('sseEditors')!.classList;
        const previewRevision = (revision: HistoryRevision) => {
            editorsCl.add('ssePreviewMode');
            cmcFragPreview.cm.setValue(revision.frag);
            cmcVertexPreview.cm.setValue(revision.vert);
            refreshCMCs(cmcFragPreview, cmcVertexPreview);
            this.processErrors(revision.err||'', cmcFragPreview, cmcVertexPreview);
            if (revision.ok && !revision.err) {
                this.delegate.recompile(revision.frag, revision.vert, (success: boolean, rawErrors: string) => {
                    // ignore errors
                });
            }
        };

        const unpreviewRevision = () => {
            editorsCl.remove('ssePreviewMode');
            refreshCMCs(cmcFrag, cmcVertex);
            this.delegate.recompile(cmcFrag.cm.getValue(), cmcVertex.cm.getValue(), (success: boolean, rawErrors: string) => {
                // ignore errors
            });
        };

        const loadRevision = (revision: HistoryRevision) => {
            if (revision.frag === cmcFrag.cm.getValue() && revision.vert === cmcVertex.cm.getValue()) {
                return;
            }
            setMilestone(revision.frag, revision.vert);
            cmcFrag.cm.doc.setValue(revision.frag);
            cmcVertex.cm.doc.setValue(revision.vert);
            refreshCMCs(cmcFrag, cmcVertex);
            this.delegate.recompile(revision.frag, revision.vert, (success: boolean, rawErrors: string) => {
                // ignore errors
            });
        };
        const renderHistoryBar = ($parent: HTMLElement, redrawLevel: number) => {
            let oldChild: Element|undefined;

            redrawLevel = 2; // level 1 is buggy
            if (redrawLevel === 1) {
                // Remove first revision
                let children = $parent.children;
                for (let i = 0; i < children.length; i++) {
                    const child = children[i];
                    if (child.classList.contains('sseHistoryRevision')) {
                        oldChild = child;
                        break;
                    }
                }
            }
            // If for some reason we couldn't find an old child to replace then
            // revert to a full redraw.
            if (!oldChild) {
                redrawLevel = 2;
            }
            if (redrawLevel === 2) {
                // Remove all children
                while ($parent.lastChild) {
                    $parent.removeChild($parent.lastChild);
                }
            }

            // Add new timeline
            const revisions = [...this.dataSource.revisions()];
            const nodes = doc.createDocumentFragment();
            let lastDateString = '';
            for (let i = 0; i < revisions.length; i++) {
                const revision = revisions[i];

                const $revisionDiv = doc.createElement('div');
                $revisionDiv.className = 'sseHistoryRevision';
                const $revisionInnerDiv = doc.createElement('div');
                $revisionInnerDiv.className = 'sseHistoryRevisionInner';
                $revisionDiv.appendChild($revisionInnerDiv);
                $revisionDiv.addEventListener('mouseenter', () => {
                    previewRevision(revision);
                });
                $revisionDiv.addEventListener('mouseleave', () => {
                    unpreviewRevision();
                });
                $revisionDiv.addEventListener('click', () => {
                    loadRevision(revision);
                });

                const nextRev = revisions[i+1];
                let diff = 0;
                if (nextRev) {
                    diff = this.dataSource.editDistanceScore(revision, nextRev);
                }

                const color = Math.min(1,(Math.log10(diff+1) / 2));
                $revisionInnerDiv.style.backgroundColor = (
                    revision.ok
                        ? `hsl(140, 20%, ${80*color+20}%`
                        : `hsl(10, 0%, ${80*color+20}%`
                );

                // Insert a "today", "1y", "1M", etc
                const dateString = renderDateString(revision?.ts || 0);
                if (lastDateString !== dateString) {
                    const $dateDiv = doc.createElement('div');
                    $dateDiv.className = 'sseHistoryDateSeparator';
                    $dateDiv.innerText = dateString;
                    nodes.appendChild($dateDiv);
                    lastDateString = dateString;
                }

                if (redrawLevel === 1) {
                    $parent.replaceChild($revisionDiv, oldChild!);
                    break;
                } else {
                    nodes.appendChild($revisionDiv);
                }
            }

            if (redrawLevel === 2) {
                $parent.appendChild(nodes);
            }
        };

        renderHistoryBar($historyBar, 2);

        const recompile = () => {
            const fragSource = cmcFrag.cm.getValue();
            const vertexSource = cmcVertex.cm.getValue();

            this.delegate.recompile(fragSource, vertexSource, (success: boolean, rawErrors: string) => {
                const redrawLevel = this.dataSource.saveRevision(
                    isMilestone(fragSource, vertexSource),
                    fragSource,
                    vertexSource,
                    !success && rawErrors ? rawErrors : undefined
                );
                if (redrawLevel) {
                    renderHistoryBar($historyBar, redrawLevel);
                }
                this.processErrors(rawErrors, cmcFrag, cmcVertex);
            });
        }

        const recompileDebounced = recompile;
        for (const cmc of cmcs) {
            cmc.cm.on('changes', () => {
                recompileDebounced();
            });
        }
    }
}

export function renderSSE(hostElement: HTMLElement,
    dataSource: HistoryDataSource,
    delegate: IShaderSourceRenderDelegate,
    config: { fragSource: string, vertexSource: string }): void {

    const renderer = new ShaderSourceEditorRenderer(hostElement, dataSource, config.fragSource, config.vertexSource, delegate);
    renderer.render();
}
