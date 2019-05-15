
import * as React from "react";
import { GlobalState } from '../../globalState';
import { LineContainerComponent } from '../../sharedComponents/lineContainerComponent';
import { ButtonLineComponent } from '../../sharedComponents/buttonLineComponent';
import { AlphaTestBlock } from 'babylonjs/Materials/Node/Blocks/Fragment/alphaTestBlock';
import { FragmentOutputBlock } from 'babylonjs/Materials/Node/Blocks/Fragment/fragmentOutputBlock';
import { ImageProcessingBlock } from 'babylonjs/Materials/Node/Blocks/Fragment/imageProcessingBlock';
import { RGBAMergerBlock } from 'babylonjs/Materials/Node/Blocks/Fragment/rgbaMergerBlock';
import { RGBASplitterBlock } from 'babylonjs/Materials/Node/Blocks/Fragment/rgbaSplitterBlock';
import { TextureBlock } from 'babylonjs/Materials/Node/Blocks/Fragment/textureBlock';
import { BonesBlock } from 'babylonjs/Materials/Node/Blocks/Vertex/bonesBlock';
import { InstancesBlock } from 'babylonjs/Materials/Node/Blocks/Vertex/instancesBlock';
import { MorphTargetsBlock } from 'babylonjs/Materials/Node/Blocks/Vertex/morphTargetsBlock';
import { VertexOutputBlock } from 'babylonjs/Materials/Node/Blocks/Vertex/vertexOutputBlock';
import { FogBlock } from 'babylonjs/Materials/Node/Blocks/Dual/fogBlock';
import { AddBlock } from 'babylonjs/Materials/Node/Blocks/addBlock';
import { ClampBlock } from 'babylonjs/Materials/Node/Blocks/clampBlock';
import { MatrixMultiplicationBlock } from 'babylonjs/Materials/Node/Blocks/matrixMultiplicationBlock';
import { MultiplyBlock } from 'babylonjs/Materials/Node/Blocks/multiplyBlock';
import { Vector2TransformBlock } from 'babylonjs/Materials/Node/Blocks/vector2TransformBlock';
import { Vector3TransformBlock } from 'babylonjs/Materials/Node/Blocks/vector3TransformBlock';
import { Vector4TransformBlock } from 'babylonjs/Materials/Node/Blocks/vector4TransformBlock';
import { NodeMaterialBlock } from 'babylonjs/Materials/Node/nodeMaterialBlock';

require("./nodeList.scss");

interface INodeListComponentProps {
    globalState: GlobalState;
    onAddValueNode: (b: string) => void;
    onAddNodeFromClass: (ObjectClass: typeof NodeMaterialBlock) => void;
}

export class NodeListComponent extends React.Component<INodeListComponentProps> {
    render() {
        // Block types used to create the menu from
        const allBlocks = {
            Vertex: [BonesBlock, InstancesBlock, MorphTargetsBlock],
            Fragment: [AlphaTestBlock, , ImageProcessingBlock, RGBAMergerBlock, RGBASplitterBlock, TextureBlock],
            Outputs: [VertexOutputBlock, FragmentOutputBlock],
            Dual: [FogBlock],
            Math: [AddBlock, ClampBlock, MatrixMultiplicationBlock, MultiplyBlock, Vector2TransformBlock, Vector3TransformBlock, Vector4TransformBlock],
            Inputs: ["Texture", "Vector2", "Vector3", "Matrix"],
        }

        // Create node menu
        var blockMenu = []
        for (var key in allBlocks) {
            var blockList = (allBlocks as any)[key].map((b: any) => {
                var label = typeof b === "string" ? b : b.prototype.getClassName().replace("Block", "")
                var onClick = typeof b === "string" ? () => { this.props.onAddValueNode(b) } : () => { this.props.onAddNodeFromClass(b) };
                return <ButtonLineComponent label={label} onClick={onClick} />
            })
            blockMenu.push(
                <LineContainerComponent title={key + " blocks"} closed={false}>
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