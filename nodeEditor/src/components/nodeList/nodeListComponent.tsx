
import * as React from "react";
import { GlobalState } from '../../globalState';
import { LineContainerComponent } from '../../sharedComponents/lineContainerComponent';
import { DraggableLineComponent } from '../../sharedComponents/draggableLineComponent';

require("./nodeList.scss");

interface INodeListComponentProps {
    globalState: GlobalState;
}

export class NodeListComponent extends React.Component<INodeListComponentProps, {filter: string}> {

    constructor(props: INodeListComponentProps) {
        super(props);

        this.state = { filter: "" };
    }

    filterContent(filter: string) {
        this.setState({ filter: filter });
    }

    render() {
        // Block types used to create the menu from
        const allBlocks = {
            Animation: ["BonesBlock", "MorphTargetsBlock"],
            Output_Blocks: ["VertexOutputBlock", "FragmentOutputBlock", "AlphaTestBlock"],
            Interpolation: ["LerpBlock"],
            Range: ["ClampBlock", "RemapBlock", "NormalizeBlock"],
            Round: ["StepBlock"],
            Vector_Math: ["CrossBlock", "DotBlock", "TransformBlock", "FresnelBlock"],
            Basic_Math: ["AddBlock",  "DivideBlock", "MultiplyBlock", "ScaleBlock", "SubtractBlock"],
            Trigonometry: [],
            Conversion_Blocks: ["ColorMergerBlock", "ColorSplitterBlock", "VectorMergerBlock", "VectorSplitterBlock"],
            Mesh_Attributes: ["InstancesBlock"],
            Matrices: ["Matrix"],
            Scene_Attributes: ["FogBlock","ImageProcessingBlock", "LightBlock", "ReflectionTextureBlock"],
            Inputs: ["Float", "Vector2", "Vector3", "Vector4", "Color3", "Color4", "TextureBlock"],
        }

        // Create node menu
        var blockMenu = []
        for (var key in allBlocks) {
            var blockList = (allBlocks as any)[key].filter((b: string) => !this.state.filter || b.toLowerCase().indexOf(this.state.filter.toLowerCase()) !== -1)
            .sort((a: string, b: string) => a.localeCompare(b))
            .map((block: any, i: number) => {
                return <DraggableLineComponent key={block} data={block} />
            });

            if (blockList.length) {
                blockMenu.push(
                    <LineContainerComponent key={key + " blocks"} title={key.replace("_", " ")} closed={false}>
                        {blockList}
                    </LineContainerComponent>
                );
            }
        }

        return (
            <div id="nodeList" style={{ borderRightStyle: "solid", borderColor: "grey", borderWidth: "1px" }} >
                <div className="panes">
                    <div className="pane">
                        <div className="filter">
                            <input type="text" placeholder="Filter" onChange={(evt) => this.filterContent(evt.target.value)} />
                        </div>
                        {blockMenu}
                    </div>
                </div>
            </div>
        );

    }
}