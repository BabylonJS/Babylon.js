import * as React from "react";
import copyIcon from "../imgs/copy.svg";
import { copyCommandToClipboard } from "../copyCommandToClipboard";
import { MergeClassNames } from "../styleHelper";
import { TextPropertyLine } from "../fluent/hoc/propertyLines/textPropertyLine";
import { LinkPropertyLine } from "../fluent/hoc/propertyLines/linkPropertyLine";
import { ToolContext } from "../fluent/hoc/fluentToolWrapper";
import { BooleanBadgePropertyLine } from "../fluent/hoc/propertyLines/booleanBadgePropertyLine";

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

    copyFn() {
        const onCopy = this.props.onCopy;
        const val = this.props.value;
        if (onCopy === true && val !== undefined) {
            return () => val;
        } else if (typeof onCopy === "function") {
            return onCopy;
        }
        return undefined;
    }

    renderContent(isLink: boolean, tooltip: string) {
        if (this.props.ignoreValue) {
            return null;
        }

        if (isLink) {
            return (
                <div className="link-value" title={tooltip} onClick={() => this.onLink()}>
                    {this.props.url ? "doc" : this.props.value || "no name"}
                </div>
            );
        }
        return (
            <div className="value" title={tooltip} style={{ color: this.props.color ? this.props.color : "" }}>
                {this.props.value || "no name"}
            </div>
        );
    }

    renderOriginal(isLink: boolean, tooltip: string) {
        return (
            <div className={MergeClassNames(["textLine", ["underline", this.props.underline], this.props.additionalClass, ["icon", this.props.onCopy]])}>
                {this.props.icon && <img src={this.props.icon} title={this.props.iconLabel} alt={this.props.iconLabel} className="icon" />}
                <div className="label" title={this.props.tooltip ?? this.props.label ?? ""}>
                    {this.props.label ?? ""}
                </div>
                {this.renderContent(isLink, tooltip)}
                {this.props.onCopy && (
                    <div
                        className="copy hoverIcon"
                        onClick={() => {
                            const copyFn = this.copyFn();
                            if (copyFn) {
                                copyCommandToClipboard(copyFn());
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

    renderFluent(isLink: boolean, tooltip: string) {
        const sharedProps = {
            tooltip,
            label: this.props.label || "",
            onCopy: this.copyFn(),
        };
        if (isLink) {
            return <LinkPropertyLine {...sharedProps} value={this.props.url ? "doc" : this.props.value || "no name"} url={this.props.url} onLink={this.props.onLink} />;
        } else if (this.props.value === "Yes" || this.props.value === "No") {
            return <BooleanBadgePropertyLine label={this.props.label || ""} value={this.props.value === "Yes"} />;
        } else {
            return <TextPropertyLine {...sharedProps} value={this.props.value || ""} />;
        }
    }

    override render() {
        const tooltip = this.props.tooltip ?? this.props.value ?? this.props.label ?? "";
        const isLink = this.props.onLink !== undefined || this.props.url !== undefined;
        return <ToolContext.Consumer>{({ useFluent }) => (useFluent ? this.renderFluent(isLink, tooltip) : this.renderOriginal(isLink, tooltip))}</ToolContext.Consumer>;
    }
}
