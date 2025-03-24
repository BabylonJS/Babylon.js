import * as React from "react";
import copyIcon from "../imgs/copy.svg";
import { copyCommandToClipboard } from "../copyCommandToClipboard";
import { MergeClassNames } from "../styleHelper";

interface ITextLineComponentProps {
    label?: string;
    value?: string;
    color?: string;
    underline?: boolean;
    onLink?: () => void;
    url?: string;
    ignoreValue?: boolean;
    additionalClass?: string;
    icon?: string;
    iconLabel?: string;
    tooltip?: string;
    onCopy?: true | (() => string);
}

export class TextLineComponent extends React.Component<ITextLineComponentProps> {
    constructor(props: ITextLineComponentProps) {
        super(props);
    }

    onLink() {
        if (this.props.url) {
            window.open(this.props.url, "_blank");
            return;
        }
        if (!this.props.onLink) {
            return;
        }

        this.props.onLink();
    }

    renderContent() {
        if (this.props.ignoreValue) {
            return null;
        }

        if (this.props.onLink || this.props.url) {
            return (
                <div className="link-value" title={this.props.tooltip ?? this.props.label ?? ""} onClick={() => this.onLink()}>
                    {this.props.url ? "doc" : this.props.value || "no name"}
                </div>
            );
        }
        return (
            <div className="value" title={this.props.tooltip ?? this.props.label ?? ""} style={{ color: this.props.color ? this.props.color : "" }}>
                {this.props.value || "no name"}
            </div>
        );
    }

    override render() {
        return (
            <div className={MergeClassNames(["textLine", ["underline", this.props.underline], this.props.additionalClass, ["icon", this.props.onCopy]])}>
                {this.props.icon && <img src={this.props.icon} title={this.props.iconLabel} alt={this.props.iconLabel} className="icon" />}
                <div className="label" title={this.props.tooltip ?? this.props.label ?? ""}>
                    {this.props.label ?? ""}
                </div>
                {this.renderContent()}
                {this.props.onCopy && (
                    <div
                        className="copy hoverIcon"
                        onClick={() => {
                            const onCopy = this.props.onCopy;
                            if (onCopy === true && this.props.value !== undefined) {
                                copyCommandToClipboard(this.props.value);
                            } else if (typeof onCopy === "function") {
                                copyCommandToClipboard(onCopy());
                            }
                        }}
                        title="Copy to clipboard"
                    >
                        <img src={copyIcon} alt="Copy" />
                    </div>
                )}
            </div>
        );
    }
}
