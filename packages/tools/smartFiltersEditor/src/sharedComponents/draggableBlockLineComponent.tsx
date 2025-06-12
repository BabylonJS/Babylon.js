import * as react from "react";
import { getBlockKey } from "../helpers/blockKeyConverters.js";
import type { IBlockRegistration } from "@babylonjs/smart-filters-blocks";

export interface IDraggableLineWithButtonComponent {
    block: IBlockRegistration;

    iconImage?: any;

    onIconClick?: () => void;

    iconTitle?: string;
}

export class DraggableBlockLineComponent extends react.Component<IDraggableLineWithButtonComponent> {
    constructor(props: IDraggableLineWithButtonComponent) {
        super(props);
    }

    override render() {
        return (
            <div
                className="draggableLine withButton"
                title={this.props.block.tooltip}
                draggable={true}
                onDragStart={(event) => {
                    event.dataTransfer.setData(
                        "babylonjs-smartfilter-node",
                        getBlockKey(this.props.block.blockType, this.props.block.namespace)
                    );
                }}
            >
                {this.props.block.blockType.replace("Block", "")}
                {this.props.iconImage && this.props.iconTitle && this.props.onIconClick && (
                    <div
                        className="icon"
                        onClick={() => {
                            if (this.props.onIconClick) {
                                this.props.onIconClick();
                            }
                        }}
                        title={this.props.iconTitle}
                    >
                        <img className="img" title={this.props.iconTitle} src={this.props.iconImage} />
                    </div>
                )}
            </div>
        );
    }
}
