
import * as React from "react";
import { GlobalState } from '../../globalState';
import { LineContainerComponent } from '../../sharedComponents/lineContainerComponent';
import { DraggableLineComponent } from '../../sharedComponents/draggableLineComponent';

require("./nodeList.scss");

interface INodeListComponentProps {
    globalState: GlobalState;
}

export class NodeListComponent extends React.Component<INodeListComponentProps> {
    render() {
        // Block types used to create the menu from
        const allBlocks = {
            Vertex: ["BonesBlock", "InstancesBlock", "MorphTargetsBlock"],
            Fragment: ["AlphaTestBlock", "ImageProcessingBlock", "RGBAMergerBlock", "RGBASplitterBlock", "RGBMergerBlock", "RGBSplitterBlock", "TextureBlock", "LightBlock", "FogBlock"],
            Outputs: ["VertexOutputBlock", "FragmentOutputBlock"],
            Math: ["AddBlock", "ClampBlock", "CrossBlock", "DotBlock", "MultiplyBlock", "TransformBlock"],
            Inputs: ["Float", "Vector2", "Vector3", "Vector4", "Color3", "Color4", "Matrix"],
        }

        // Create node menu
        var blockMenu = []
        for (var key in allBlocks) {
            var blockList = (allBlocks as any)[key].map((block: any, i: number) => {
                return <DraggableLineComponent key={block} data={block} />
            })
            blockMenu.push(
                <LineContainerComponent key={key + " blocks"} title={key + " blocks"} closed={false}>
                    {blockList}
                </LineContainerComponent>
            )
        }

        return (
            <div id="nodeList" style={{ borderRightStyle: "solid", borderColor: "grey", borderWidth: "1px" }} >
                <div className="panes">
                    <div className="pane">
                        {blockMenu}
                    </div>
                </div>
            </div>
        );

    }
}