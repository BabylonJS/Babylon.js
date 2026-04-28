import * as React from "react";
import "./autoComplete.scss";

/**
 * Props for the AutoCompleteInputComponent.
 */
interface IAutoCompleteInputProps {
    /** Label to display next to the input */
    label: string;
    /** Current value */
    value: string;
    /** Suggestions to show in the dropdown */
    suggestions: string[];
    /** Lock object to prevent graph-canvas shortcuts while typing */
    lockObject?: { lock: boolean };
    /** Callback when the value changes (on blur, Enter, or suggestion click) */
    onChange: (value: string) => void;
}

interface IAutoCompleteInputState {
    text: string;
    showSuggestions: boolean;
    highlightIndex: number;
}

/**
 * A text input with autocomplete suggestions dropdown.
 * Users can type freely or pick from a filtered list of existing values.
 */
let _UniqueIdSeed = 0;

export class AutoCompleteInputComponent extends React.Component<IAutoCompleteInputProps, IAutoCompleteInputState> {
    private _inputRef = React.createRef<HTMLInputElement>();
    private readonly _uniqueId = _UniqueIdSeed++;

    constructor(props: IAutoCompleteInputProps) {
        super(props);
        this.state = { text: props.value, showSuggestions: false, highlightIndex: -1 };
    }

    override componentDidUpdate(prevProps: IAutoCompleteInputProps) {
        if (prevProps.value !== this.props.value && this.props.value !== this.state.text) {
            this.setState({ text: this.props.value });
        }
    }

    private _getFilteredSuggestions(): string[] {
        const query = this.state.text.toLowerCase();
        if (!query) {
            return this.props.suggestions;
        }
        return this.props.suggestions.filter((s) => s.toLowerCase().includes(query));
    }

    private _commit(value: string) {
        const trimmed = value.trim();
        if (trimmed !== this.props.value) {
            this.props.onChange(trimmed);
        }
        // Reset the text to the prop value so the input clears after an
        // action (e.g. adding a variable) when props.value stays constant.
        this.setState({ showSuggestions: false, highlightIndex: -1, text: this.props.value });
    }

    private _onKeyDown = (e: React.KeyboardEvent) => {
        const suggestions = this._getFilteredSuggestions();
        const { highlightIndex, showSuggestions } = this.state;

        if (e.key === "ArrowDown") {
            e.preventDefault();
            if (!showSuggestions && suggestions.length > 0) {
                this.setState({ showSuggestions: true, highlightIndex: 0 });
            } else {
                this.setState({ highlightIndex: Math.min(highlightIndex + 1, suggestions.length - 1) });
            }
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            this.setState({ highlightIndex: Math.max(highlightIndex - 1, 0) });
        } else if (e.key === "Enter") {
            e.preventDefault();
            if (showSuggestions && highlightIndex >= 0 && highlightIndex < suggestions.length) {
                this._commit(suggestions[highlightIndex]);
            } else {
                this._commit(this.state.text);
            }
        } else if (e.key === "Escape") {
            this.setState({ showSuggestions: false, highlightIndex: -1 });
        }
    };

    override render() {
        const { label } = this.props;
        const { text, showSuggestions, highlightIndex } = this.state;
        const suggestions = showSuggestions ? this._getFilteredSuggestions() : [];
        const listboxId = `fge-autocomplete-listbox-${this._uniqueId}`;
        const inputId = `fge-autocomplete-input-${this._uniqueId}`;
        const activeDescendant = highlightIndex >= 0 ? `${listboxId}-option-${highlightIndex}` : undefined;

        return (
            <div className="fge-autocomplete" style={{ position: "relative" }}>
                <div className="fge-autocomplete-row">
                    <label className="fge-autocomplete-label" id={`${listboxId}-label`} htmlFor={inputId}>
                        {label}
                    </label>
                    <input
                        ref={this._inputRef}
                        id={inputId}
                        className="fge-autocomplete-input"
                        value={text}
                        role="combobox"
                        aria-autocomplete="list"
                        aria-expanded={suggestions.length > 0}
                        aria-controls={suggestions.length > 0 ? listboxId : undefined}
                        aria-activedescendant={activeDescendant}
                        aria-labelledby={`${listboxId}-label`}
                        onChange={(e) => this.setState({ text: e.target.value, showSuggestions: true, highlightIndex: -1 })}
                        onFocus={() => {
                            if (this.props.lockObject) {
                                this.props.lockObject.lock = true;
                            }
                            this.setState({ showSuggestions: true });
                        }}
                        onBlur={() => {
                            if (this.props.lockObject) {
                                this.props.lockObject.lock = false;
                            }
                            // Delay so click on suggestion fires before we hide
                            setTimeout(() => {
                                this._commit(this.state.text);
                            }, 150);
                        }}
                        onKeyDown={this._onKeyDown}
                        autoComplete="off"
                    />
                </div>
                {suggestions.length > 0 && (
                    <div className="fge-autocomplete-dropdown" role="listbox" id={listboxId}>
                        {suggestions.map((s, i) => (
                            <div
                                key={s}
                                id={`${listboxId}-option-${i}`}
                                role="option"
                                aria-selected={i === highlightIndex}
                                className={`fge-autocomplete-option${i === highlightIndex ? " fge-autocomplete-option-active" : ""}`}
                                onMouseDown={(e) => {
                                    e.preventDefault();
                                    this._commit(s);
                                }}
                                onMouseEnter={() => this.setState({ highlightIndex: i })}
                            >
                                {s}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    }
}
