// components/searchPanel.tsx
/* eslint-disable jsdoc/require-jsdoc */
import * as React from "react";
import { useEffect } from "react";
import * as monaco from "monaco-editor/esm/vs/editor/editor.api";
import { debounce } from "ts-debounce";
import RegexIcon from "./icons/regex.svg";
import WholeWordIcon from "./icons/wholeWord.svg";
import CaseSensitiveIcon from "./icons/caseSensitive.svg";
import ReplaceIcon from "./icons/replace.svg";
import ReplaceAllIcon from "./icons/replaceAll.svg";
import SearchIcon from "./icons/search.svg";
import { Icon } from "./iconComponent";

import "../../scss/search.scss";

type Match = {
    filePath: string;
    range: monaco.IRange;
    lineText: string;
    previewStartCol: number;
    previewEndCol: number;
};

type ResultsByFile = Record<string, Match[]>;

function EscapeRegExp(s: string) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export const SearchPanel: React.FC<{
    onOpenAt: (path: string, range: monaco.IRange) => void;
}> = ({ onOpenAt }) => {
    const [query, setQuery] = React.useState("");
    const [replacement, setReplacement] = React.useState("");
    const [useRegex, setUseRegex] = React.useState(false);
    const [matchCase, setMatchCase] = React.useState(false);
    const [wholeWord, setWholeWord] = React.useState(false);
    const searchRef = React.useRef<HTMLTextAreaElement>(null);
    useEffect(() => {
        if (searchRef.current) {
            searchRef.current.focus();
            searchRef.current.setSelectionRange(query.length, query.length);
        }
    }, []);

    const [results, setResults] = React.useState<ResultsByFile>({});
    const [isSearching, setIsSearching] = React.useState(false);
    const [expanded, setExpanded] = React.useState<Record<string, boolean>>({});

    const filesCount = Object.keys(results).length;
    const matchesCount = React.useMemo(() => Object.values(results).reduce((s, arr) => s + arr.length, 0), [results]);

    // Build a preview window around the match for nice context
    const buildMatchPreview = React.useCallback((model: monaco.editor.ITextModel, rng: monaco.IRange) => {
        const line = model.getLineContent(rng.startLineNumber);
        // Show ~40 chars around the match
        const context = 40;
        const start = Math.max(1, rng.startColumn - context);
        const end = Math.min(model.getLineMaxColumn(rng.startLineNumber), rng.endColumn + context);

        return {
            lineText: line.slice(start - 1, end - 1),
            previewStartCol: rng.startColumn - start + 1,
            previewEndCol: rng.endColumn - start + 1,
        };
    }, []);

    const compilePattern = React.useCallback(() => {
        if (!query) {
            return null;
        }

        if (useRegex || wholeWord) {
            const source = useRegex ? query : `\\b${EscapeRegExp(query)}\\b`;
            const flags = matchCase ? "g" : "gi";
            try {
                return new RegExp(source, flags);
            } catch {
                return null;
            }
        }

        return null;
    }, [query, useRegex, matchCase, wholeWord]);

    const doSearch = React.useCallback(() => {
        const q = query.trim();
        if (!q) {
            setResults({});
            return;
        }
        setIsSearching(true);

        const models = monaco.editor.getModels();

        const byFile: ResultsByFile = {};
        const rx = compilePattern();

        for (const model of models) {
            const uriStr = model.uri.toString();
            if (!uriStr.startsWith("file:///pg/")) {
                continue;
            }
            let found: monaco.editor.FindMatch[] = [];

            if (rx) {
                // Regex path
                found = model.findMatches(rx.source, false, true, matchCase, null, true, 10000);
            } else {
                // Plain substring path
                found = model.findMatches(q, false, false, matchCase, null, true, 10000);
            }

            if (!found.length) {
                continue;
            }

            const filePath = model.uri.path || uriStr;
            const matches: Match[] = found.map((mm) => {
                const rng = mm.range;
                const { lineText, previewStartCol, previewEndCol } = buildMatchPreview(model, rng);
                return { filePath, range: rng, lineText, previewStartCol, previewEndCol };
            });

            byFile[filePath] = matches;
        }

        // Expand sections that have matches (default: expanded)
        const nextExpanded: Record<string, boolean> = {};
        for (const f of Object.keys(byFile)) {
            nextExpanded[f] = true;
        }

        setExpanded(nextExpanded);
        setResults(byFile);
        setIsSearching(false);
    }, [query, matchCase, buildMatchPreview, compilePattern]);

    const debouncedSearch = React.useMemo(() => debounce(doSearch, 250, { maxWait: 600 }), [doSearch]);

    React.useEffect(() => {
        // eslint-disable-next-line
        debouncedSearch();
        return () => {
            try {
                debouncedSearch.cancel();
            } catch {}
        };
    }, [debouncedSearch, query, matchCase, useRegex, wholeWord]);

    const runSearchNow = React.useCallback(() => {
        try {
            debouncedSearch.cancel();
        } catch {}
        doSearch();
    }, [debouncedSearch, doSearch]);

    // Replace helpers
    const replaceInFile = React.useCallback(
        (filePath: string) => {
            const model = monaco.editor.getModels().find((m) => (m.uri.path || m.uri.toString()) === filePath);
            if (!model || !results[filePath]?.length) {
                return;
            }

            const rx = compilePattern();
            const edits: monaco.editor.IIdentifiedSingleEditOperation[] = [];

            // Apply bottom-up so earlier edits don't disturb later ranges
            const matches = [...results[filePath]].sort((a, b) =>
                a.range.startLineNumber === b.range.startLineNumber ? b.range.startColumn - a.range.startColumn : b.range.startLineNumber - a.range.startLineNumber
            );

            for (const m of matches) {
                const text = model.getValueInRange(m.range);
                let newText = replacement;
                if (rx) {
                    try {
                        // allow $1 backrefs when regex toggle is on or whole-word (regex) is used
                        const realRx = new RegExp(rx.source, matchCase ? "g" : "gi");
                        newText = text.replace(realRx, replacement);
                    } catch {
                        // fallback: literal replacement
                        newText = replacement;
                    }
                }
                edits.push({ range: m.range, text: newText, forceMoveMarkers: true });
            }

            if (edits.length) {
                model.pushEditOperations([], edits, () => null);
            }

            // Trigger a refresh
            runSearchNow();
        },
        [results, replacement, compilePattern, matchCase, runSearchNow]
    );

    const replaceAll = React.useCallback(() => {
        // Confirm with window.alert
        if (!window.confirm(`Are you sure you want to replace all occurrences over ${Object.keys(results).length} files?`)) {
            return;
        }
        for (const file of Object.keys(results)) {
            replaceInFile(file);
        }
    }, [results, replaceInFile]);

    return (
        <div className="pg-search-panel">
            <div className="pg-search-bar">
                <div className="pg-search-row">
                    <textarea
                        id="pg-search-input"
                        ref={searchRef}
                        className="pg-search-input"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search"
                        spellCheck={false}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                runSearchNow();
                            }
                        }}
                    />
                    <div className="pg-search-row pg-search-row--options">
                        <button onClick={() => setUseRegex(!useRegex)} className={`pg-search-option ${useRegex ? "pg-search-option-enabled" : ""}`} title="Use Regular Expressions">
                            <Icon size={18}>
                                <RegexIcon />
                            </Icon>
                        </button>
                        <button onClick={() => setMatchCase(!matchCase)} className={`pg-search-option ${matchCase ? "pg-search-option-enabled" : ""}`} title="Match Case">
                            <Icon size={18}>
                                <CaseSensitiveIcon />
                            </Icon>
                        </button>

                        <button onClick={() => setWholeWord(!wholeWord)} className={`pg-search-option ${wholeWord ? "pg-search-option-enabled" : ""}`} title="Match Whole Word">
                            <Icon size={18}>
                                <WholeWordIcon />
                            </Icon>
                        </button>
                        <button className="pg-search-option pg-search-btn" onClick={runSearchNow} title="Search" aria-label="Search" disabled={!query.trim()}>
                            <Icon size={16}>
                                <SearchIcon />
                            </Icon>
                        </button>
                    </div>
                </div>

                <div className="pg-search-row">
                    <textarea
                        id="pg-replace-input"
                        className="pg-search-input"
                        value={replacement}
                        onChange={(e) => setReplacement(e.target.value)}
                        placeholder={useRegex || wholeWord ? "Replace (supports $1 backrefs)" : "Replace"}
                        spellCheck={false}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                replaceAll();
                            }
                        }}
                    />
                    <button className="pg-search-option pg-search-btn pg-search-btn--secondary" onClick={replaceAll} disabled={!query.trim()} title="Replace all in results">
                        <Icon size={20}>
                            <ReplaceAllIcon />
                        </Icon>
                    </button>
                </div>

                <div className="pg-search-meta">
                    {isSearching ? "Searching" : `${matchesCount} results in ${filesCount} file${filesCount === 1 ? "" : "s"}`}
                    <div className="pg-search-meta__actions">
                        <button
                            className="pg-link-btn"
                            onClick={() => {
                                const all = Object.fromEntries(Object.keys(results).map((k) => [k, true]));
                                setExpanded(all);
                            }}
                        >
                            Expand all
                        </button>
                        <button
                            className="pg-link-btn"
                            onClick={() => {
                                const none = Object.fromEntries(Object.keys(results).map((k) => [k, false]));
                                setExpanded(none);
                            }}
                        >
                            Collapse all
                        </button>
                    </div>
                </div>
            </div>

            <div className="pg-search-results">
                {filesCount === 0 ? (
                    <div className="pg-search-empty">No results</div>
                ) : (
                    Object.keys(results).map((file) => {
                        const items = results[file];
                        const isOpen = expanded[file];
                        return (
                            <div key={file} className={`pg-search-file ${isOpen ? "open" : ""}`}>
                                <div className="pg-search-file__title" title={file} onClick={() => setExpanded((s) => ({ ...s, [file]: !s[file] }))}>
                                    <span className="pg-caret">{isOpen ? "▾" : "▸"}</span>
                                    <span className="pg-filename">{file.replace("/pg/", "")}</span>
                                    <span className="pg-count">{items.length}</span>
                                    <button
                                        className="pg-link-btn pg-file-replace"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            replaceInFile(file);
                                        }}
                                        title="Replace all in this file"
                                    >
                                        <Icon size={24}>
                                            <ReplaceIcon />
                                        </Icon>
                                    </button>
                                </div>

                                {isOpen && (
                                    <ul className="pg-search-file__list">
                                        {items.map((m, idx) => {
                                            const before = m.lineText.slice(0, Math.max(0, m.previewStartCol - 1));
                                            const hit = m.lineText.slice(Math.max(0, m.previewStartCol - 1), Math.max(0, m.previewEndCol - 1));
                                            const after = m.lineText.slice(Math.max(0, m.previewEndCol - 1));
                                            return (
                                                <li
                                                    key={idx}
                                                    className="pg-search-hit"
                                                    onClick={() => onOpenAt(m.filePath.replace("/pg/", ""), m.range)}
                                                    title={`${m.range.startLineNumber}:${m.range.startColumn}`}
                                                >
                                                    <span className="pg-search-hit__loc">
                                                        {m.range.startLineNumber}:{m.range.startColumn}
                                                    </span>
                                                    <span className="pg-search-hit__preview">
                                                        {before}
                                                        <mark className="pg-hit">{hit}</mark>
                                                        {after}
                                                    </span>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};
