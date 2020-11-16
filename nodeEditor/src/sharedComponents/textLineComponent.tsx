import * as React from "react";

interface ITextLineComponentProps {
    label: string;
    value: string;
    color?: string;
    underline?: boolean;
    onLink?: () => void;
}

export class TextLineComponent extends React.Component<ITextLineComponentProps> {
    constructor(props: ITextLineComponentProps) {
        super(props);
    }

    onLink() {
        if (!this.props.onLink) {
            return;
        }

        this.props.onLink();
    }

    renderContent() {
        if (this.props.onLink) {
            return (
                <div className="link-value" title={this.props.value} onClick={() => this.onLink()}>
                    {this.props.value || "no name"}
                </div>
            )
        }
        return (
            <div className="value" title={this.props.value} style={{ color: this.props.color ? this.props.color : "" }}>
                {this.props.value || "no name"}
            </div>
        )
    }

    render() {
        return (
            <div className={this.props.underline ? "textLine underline" : "textLine"}>
                <div className="label" title={this.props.label}>
                    {this.props.label}
                </div>
                {this.renderContent()}
            </div>
        );
    }
}
