import * as React from "react";

interface IIndentedTextLineComponentProps {
    value?: string;
    color?: string;
    underline?: boolean;
    onLink?: () => void;
    url?: string;
    additionalClass?: string;
}

export class IndentedTextLineComponent extends React.Component<IIndentedTextLineComponentProps> {
    constructor(props: IIndentedTextLineComponentProps) {
        super(props);
    }

    onLink() {
        if (this.props.url) {
            window.open(this.props.url, '_blank');
            return;
        }
        if (!this.props.onLink) {
            return;
        }

        this.props.onLink();
    }

    renderContent() {
        if (this.props.onLink || this.props.url) {
            return (
                <div className="link-value" title={this.props.value} onClick={() => this.onLink()}>
                    {this.props.url ? "doc" : (this.props.value || "no name")}
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
            <div className={"indented " + (this.props.underline ? "textLine underline" : "textLine" + (this.props.additionalClass ? " " + this.props.additionalClass : ""))}>
                {this.renderContent()}
            </div>
        );
    }
}
