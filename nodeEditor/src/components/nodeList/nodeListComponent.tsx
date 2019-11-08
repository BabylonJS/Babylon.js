
import * as React from "react";
import { GlobalState } from '../../globalState';
import { LineContainerComponent } from '../../sharedComponents/lineContainerComponent';
import { DraggableLineComponent } from '../../sharedComponents/draggableLineComponent';

require("./nodeList.scss");

interface INodeListComponentProps {
    globalState: GlobalState;
}

export class NodeListComponent extends React.Component<INodeListComponentProps, {filter: string}> {

    private static _Tooltips:{[key: string]: string} = {
        "BonesBlock": "Provides a world matrix for each vertex, based on skeletal (bone/joint) animation. mesh.matricesIndices and mesh.matricesWeights are the vertex to bone assignments and weighting, and assume no more than 4 bones influencing any given vertex. If a vertex is influenced by more than 4 bones, then mesh.matricesIndicesExtra and mesh.matricesWeightsExtra can be used for up to 8 bones of influence per vertex",
        "MorphTargetsBlock": "Provides the final positions, normals, tangents, and uvs based on morph targets in a mesh",
        "AddBlock": "Adds the left and right inputs together. Left and right inputs have to be of the same type",
        "DistanceBlock": "Provides a distance vector based on the left and right input vectors",
        "DivideBlock": "Divides the left input by the right input",
        "LengthBlock": "Outputs the length of an input vector",
        "MaxBlock": "Outputs the largest value between the left and right inputs",
        "MinBlock": "Outputs the smallest value between the left and right inputs",
        "MultiplyBlock": "Multiplies the left and right inputs together",
        "NegateBlock": "Multiplies the input by -1",
        "OneMinusBlock": "Subtracts the input value from 1 (1 - input)",
        "RandomNumberBlock": "Provides a random number based on an input seed",
        "ReciprocalBlock": "Outputs the reciprocal value(s) vased on the input value(s)",
        "ScaleBlock": "Multiplies the input value(s) by the factor",
        "SubtractBlock": "Subtracts the right input from the left input",
        "PosterizeBlock": "Reduces the number of colors in an image to the value of input steps",
        "ReplaceColorBlock": "Replaces a reference color in input value with a different replacement color. Distance is the tolerance variation of the color",
        "ColorMergerBlock": "Combines individual color channels into color Vectors",
        "ColorSplitterBlock": "Separates color Vectors into individual color channels",
        "VectorMergerBlock": "Combines up to 4 input values into Vectors",
        "VectorSplitterBlock": "Separates Vectors into individual elements",
        "Color3": "A Vector3 representing combined color values (red, green, and blue)",
        "Color4": "A Vector4 representing combined color and alpha values (red, green, blue, and alpha)",
        "DeltaTimeBlock": "A Float representing the time value that's passed since the last frame has rendered",
        "Float": "A Float for a single floating point value",
        "TextureBlock": "A container node for a texture (image or url)",
        "TimeBlock": "A Float of a constantly increasing floating point value, starting when the scene is loaded",
        "Vector2": "A Vector2 representing two values",
        "Vector3": "A Vector3 representing three values",
        "Vector4": "A Vector4 representing four values",
        "LerpBlock": "Provides linear interpolated value(s) between the left and right inputs, based on the gradient input",
        "SmoothStepBlock": "Outputs a value based on a the input value's position on a curve between the two edge values",
        "Matrix": "A container for a vector transformation",
        "ProjectionMatrixBlock": "A matrix moving from 3D space to screen space",
        "ViewMatrixBlock": "A matrix moving from 3D space to camera space",
        "ViewProjectionMatrixBlock": "A matrix moving from 3D space to camera space, and ending in screen space",
        "WorldMatrixBlock": "A matrix moving from local space to world space",
        "WorldViewProjectionMatrixBlock": "A matrix moving from local space to world space, then to camera space, and ending in screen space",
        "ColorBlock": "A Color4 representing the color of each vertex of the attached mesh",
        "InstancesBlock": "Provides the world matrix for each instance. This is used to apply materials to instances as well as original meshes",
        "MatrixIndicesBlock": "A Vector4 representing the vertex to bone skinning assignments",
        "MatricesWeightsBlock": "A Vector4 representing the vertex to bone skinning weights",
        "NormalBlock": "A Vector3 representing the normal of each vertex of the attached mesh",
        "PositionBlock": "A Vector3 representing the position of each vertex of the attached mesh",
        "TangentBlock": "A Vector3 representing the tangent of each vertex of the attached mesh",
        "UVBlock": "A Vector2 representing the UV coordinates of each vertex of the attached mesh",
        "DiscardBlock": "A final output node that will not output a pixel below the cutoff value",
        "FragmentOutputBlock": "The final node for outputing the color of each pixel. This node must be included in every node material",
        "VertexOutputBlock": "The final node for outputing the position of each vertex. This node must be included in every node material",
        "ClampBlock": "Ignores all values of the input outside of the Minimum and Maximum property values",
        "NormalizeBlock": "Remaps the length of a vector or color to 1",
        "RemapBlock": "Remaps all input values between sourceMin and sourceMax, to be between targetMin and targetMax. source and target inputs can be static or variable inputs",
        "CeilingBlock": "Outputs the highest value of the input",
        "FloorBlock": "Outputs the lowest value of the input",
        "RoundBlock": "Outputs the nearest whole number based on the input value",
        "StepBlock": "Outputs 1 for any input value above the edge input, outputs 0 for any input value below the edge input",
        "CameraPositionBlock": "A Vector3 position of the active scene camera",
        "FogBlock": "Applies fog to a scene. Outputs fog with increasing value based on distance from the camera",
        "FogColorBlock": "A Color3 for the fog color",
        "ImageProcessingBlock": "Provides access to all of the Babylon image processing properties",        
        "LightBlock": "Returns the individual color values (red, green, and blue) of the diffuse or specular colors of the combined OR individual lighting within the scene",
        "LightInformationBlock": "Provides the direction, color and intensity of a selected light based on its world position",
        "PerturbNormalBlock": "Creates a new normal direction based on a normal map, the world position, and world normal",
        "ReflectionTextureBlock": "Creates a reflection of the input texture",
        "ViewDirectionBlock": "Outputs the direction vector of where the camera is aimed",
        "AbsBlock": "Outputs the absolute value of the input value",
        "ArcCosBlock": "Outputs the inverse of the cosine value based on the input value",
        "ArcSinBlock": "Outputs the inverse of the sine value based on the input value",
        "ArcTan2Block": "Outputs the inverse of the tangent value based on the input value",
        "ArcTanBlock": "Outputs the inverse of the tangent value based on the input value",
        "CosBlock": "Outputs the cosine value based on the input value",
        "DegreesToRadiansBlock": "Converts the input value (degrees) to radians",
        "Exp2Block": "Outputs the input value multiplied by itself 1 time. (Exponent of 2)",
        "ExpBlock": "Outputs the input value multiplied by itself 9 time. (Exponent of 10)",
        "FractBlock": "Everything after the period",
        "LogBlock": "The logarithm value based on the input value",
        "PowBlock": "Outputs the input value multiplied by itself the number of times equal to the power input (Exponent of power)",
        "RadiansToDegreesBlock": "Converts the input value (radians) to degrees",
        "SawToothWaveBlock": "Outputs a sawtooth pattern value between -1 and 1 based on the input value",
        "SignBlock": "returns 1 if 10 or -1 if -10",
        "SinBlock": "Outputs the the sine value based on the input value",
        "SqrtBlock": "Outputs the the square root of the input value",
        "SquareWaveBlock": "Outputs a stepped pattern value between -1 and 1 based on the input value",
        "TanBlock": "Outputs the the tangent value based on the input value",
        "TriangleWaveBlock": "Outputs a sawtooth pattern value between 0 and 1 based on the input value",
        "CrossBlock": "Outputs a vector that is perpendicular to two input vectors",
        "DotBlock": "Outputs the cos of the angle between two vectors",
        "FresnelBlock": "Outputs the grazing angle of the surface of the mesh, relative to a camera. Angle can be influenced by the bias and power inputs",
        "TransformBlock": "Transforms a input vector based on an input matrix"
    }

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
            Interpolation: ["LerpBlock", "StepBlock", "SmoothStepBlock", "NLerpBlock"],
            Matrices: ["Matrix", "WorldMatrixBlock", "WorldViewMatrixBlock", "WorldViewProjectionMatrixBlock", "ViewMatrixBlock", "ViewProjectionMatrixBlock", "ProjectionMatrixBlock"],
            Mesh: ["InstancesBlock", "PositionBlock", "UVBlock", "ColorBlock", "NormalBlock", "TangentBlock", "MatrixIndicesBlock", "MatrixWeightsBlock", "WorldPositionBlock", "WorldNormalBlock", "FrontFacingBlock"], 
            Noises: ["SimplexPerlin3DBlock", "WorleyNoise3DBlock"],
            Output_Blocks: ["VertexOutputBlock", "FragmentOutputBlock", "DiscardBlock"],
            Range: ["ClampBlock", "RemapBlock", "NormalizeBlock"],
            Round: ["RoundBlock", "CeilingBlock", "FloorBlock"],
            Scene: ["FogBlock", "CameraPositionBlock", "FogColorBlock", "ImageProcessingBlock", "LightBlock", "LightInformationBlock", "ViewDirectionBlock", "PerturbNormalBlock", "NormalBlendBlock"],
            Trigonometry: ["CosBlock", "SinBlock", "AbsBlock", "ExpBlock", "Exp2Block", "SqrtBlock", "PowBlock", "LogBlock", "ArcCosBlock", "ArcSinBlock", "TanBlock", "ArcTanBlock", "FractBlock", "SignBlock", "ArcTan2Block", "DegreesToRadiansBlock", "RadiansToDegreesBlock", "SawToothWaveBlock", "TriangleWaveBlock", "SquareWaveBlock"],
            Vector_Math: ["CrossBlock", "DotBlock", "TransformBlock", "FresnelBlock", "Rotate2dBlock"],
        }

        // Create node menu
        var blockMenu = []
        for (var key in allBlocks) {
            var blockList = (allBlocks as any)[key].filter((b: string) => !this.state.filter || b.toLowerCase().indexOf(this.state.filter.toLowerCase()) !== -1)
            .sort((a: string, b: string) => a.localeCompare(b))
            .map((block: any, i: number) => {
                let tooltip = NodeListComponent._Tooltips[block] || "";

                return <DraggableLineComponent key={block} data={block} tooltip={tooltip}/>
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