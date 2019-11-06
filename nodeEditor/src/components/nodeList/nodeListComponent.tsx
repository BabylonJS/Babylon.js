
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
            Basic_Math: ["AddBlock",  "DivideBlock", "MultiplyBlock", "ScaleBlock", "SubtractBlock", "OneMinusBlock", "MaxBlock", "MinBlock", "LengthBlock", "DistanceBlock", "NegateBlock", "RandomNumberBlock", "ReciprocalBlock"],
            Color_Management: ["ReplaceColorBlock", "PosterizeBlock", "GradientBlock"],
            Conversion_Blocks: ["ColorMergerBlock", "ColorSplitterBlock", "VectorMergerBlock", "VectorSplitterBlock"],
            Inputs: ["Float", "Vector2", "Vector3", "Vector4", "Color3", "Color4", "TextureBlock", "ReflectionTextureBlock", "TimeBlock", "DeltaTimeBlock"],
            Interpolation: ["LerpBlock", "SmoothStepBlock", "NLerpBlock"],
            Matrices: ["Matrix", "WorldMatrixBlock", "WorldViewMatrixBlock", "WorldViewProjectionMatrixBlock", "ViewMatrixBlock", "ViewProjectionMatrixBlock", "ProjectionMatrixBlock"],
            Mesh: ["InstancesBlock", "PositionBlock", "UVBlock", "ColorBlock", "NormalBlock", "TangentBlock", "MatrixIndicesBlock", "MatrixWeightsBlock", "WorldPositionBlock", "WorldNormalBlock", "FrontFacingBlock"], 
            Noises: ["SimplexPerlin3DBlock", "WorleyNoise3DBlock"],
            Output_Blocks: ["VertexOutputBlock", "FragmentOutputBlock", "DiscardBlock"],
            Range: ["ClampBlock", "RemapBlock", "NormalizeBlock"],
            Round: ["StepBlock", "RoundBlock", "CeilingBlock", "FloorBlock"],
            Scene: ["FogBlock", "CameraPositionBlock", "FogColorBlock", "ImageProcessingBlock", "LightBlock", "LightInformationBlock", "ViewDirectionBlock", "PerturbNormalBlock"],
            Trigonometry: ["CosBlock", "SinBlock", "AbsBlock", "ExpBlock", "Exp2Block", "SqrtBlock", "PowBlock", "LogBlock", "ArcCosBlock", "ArcSinBlock", "TanBlock", "ArcTanBlock", "FractBlock", "SignBlock", "ArcTan2Block", "DegreesToRadiansBlock", "RadiansToDegreesBlock", "SawToothWaveBlock", "TriangleWaveBlock", "SquareWaveBlock"],
            Vector_Math: ["CrossBlock", "DotBlock", "TransformBlock", "FresnelBlock"],
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
            <div id="nodeList">
                <div className="panes">
                    <div className="pane">
                        <div className="filter">
                            <input type="text" placeholder="Filter" onChange={(evt) => this.filterContent(evt.target.value)} />
                        </div>
                        <div className="list-container">
                            {blockMenu}
                        </div>
                    </div>
                </div>
            </div>
        );

    }
}