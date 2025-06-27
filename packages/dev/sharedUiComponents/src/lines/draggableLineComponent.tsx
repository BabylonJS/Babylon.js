import * as React from "react";
import { ToolContext } from "shared-ui-components/fluent/hoc/fluentToolWrapper";
import { LineContainer } from "shared-ui-components/fluent/hoc/propertyLine";

export interface IButtonLineComponentProps {
    format: string;
    data: string;
    tooltip: string;
}

export class DraggableLineComponent extends React.Component<IButtonLineComponentProps> {
    constructor(props: IButtonLineComponentProps) {
        super(props);
    }

    renderFluent() {
        return (
            <LineContainer
                draggable={true}
                title={this.props.tooltip}
                onDragStart={(event: React.DragEvent) => {
                    event.dataTransfer.setData(this.props.format, this.props.data);
                }}
            >
                {this.props.data.replace("Block", "")}
            </LineContainer>
        );
    }

    renderOriginal() {
        return (
            <div
                className="draggableLine"
                title={this.props.tooltip}
                draggable={true}
                onDragStart={(event) => {
                    event.dataTransfer.setData(this.props.format, this.props.data);
                }}
            >
                {this.props.data.replace("Block", "")}
            </div>
        );
    }

    override render() {
        return <ToolContext.Consumer>{({ useFluent }) => (useFluent ? this.renderFluent() : this.renderOriginal())}</ToolContext.Consumer>;
    }
}
