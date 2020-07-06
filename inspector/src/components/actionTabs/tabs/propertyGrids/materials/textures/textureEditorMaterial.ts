import { NodeMaterial, InputBlock, NodeMaterialSystemValues, TransformBlock, VertexOutputBlock, TextureBlock, OneMinusBlock, ColorMergerBlock, AnimatedInputBlockTypes, TrigonometryBlockOperations, TrigonometryBlock, FragmentOutputBlock, FragCoordBlock, MultiplyBlock, AddBlock, ModBlock, ClampBlock, LerpBlock, Texture } from 'babylonjs';

export function TextureEditorMaterial(texture : Texture) : NodeMaterial {
    let nodeMaterial = new NodeMaterial("node");

    // InputBlock
    let position = new InputBlock("position");
    position.setAsAttribute("position");
    
    // TransformBlock
    let WorldPos = new TransformBlock("WorldPos");
    WorldPos.complementZ = 0;
    WorldPos.complementW = 1;
    
    // InputBlock
    let World = new InputBlock("World");
    World.setAsSystemValue(NodeMaterialSystemValues.World);
    
    // TransformBlock
    let WorldPosViewProjectionTransform = new TransformBlock("WorldPos * ViewProjectionTransform");
    WorldPosViewProjectionTransform.complementZ = 0;
    WorldPosViewProjectionTransform.complementW = 1;
    
    // InputBlock
    let ViewProjection = new InputBlock("ViewProjection");
    ViewProjection.setAsSystemValue(NodeMaterialSystemValues.ViewProjection);
    
    // VertexOutputBlock
    let VertexOutput = new VertexOutputBlock("VertexOutput");
    
    // InputBlock
    let uv = new InputBlock("uv");
    uv.setAsAttribute("uv");
    
    // TextureBlock
    let Texture = new TextureBlock("Texture");
    Texture.texture = texture;
    Texture.texture.wrapU = 1;
    Texture.texture.wrapV = 1;
    Texture.texture.uAng = 0;
    Texture.texture.vAng = 0;
    Texture.texture.wAng = 0;
    Texture.texture.uOffset = 0;
    Texture.texture.vOffset = 0;
    Texture.texture.uScale = 1;
    Texture.texture.vScale = 1;
    Texture.convertToGammaSpace = false;
    Texture.convertToLinearSpace = false;
    
    // LerpBlock
    let CombineTextures = new LerpBlock("CombineTextures");
    
    // ColorMergerBlock
    let ColorMerger = new ColorMergerBlock("ColorMerger");
    
    // ClampBlock
    let Clamp = new ClampBlock("Clamp");
    Clamp.minimum = 0;
    Clamp.maximum = 1;
    
    // AddBlock
    let Add = new AddBlock("Add");
    
    // ModBlock
    let Mod = new ModBlock("Mod");
    
    // AddBlock
    let Add1 = new AddBlock("Add");
    
    // TrigonometryBlock
    let Floor = new TrigonometryBlock("Floor");
    Floor.operation = TrigonometryBlockOperations.Floor;
    
    // MultiplyBlock
    let Multiply = new MultiplyBlock("Multiply");
    
    // FragCoordBlock
    let FragCoord = new FragCoordBlock("FragCoord");
    
    // MultiplyBlock
    let Multiply1 = new MultiplyBlock("Multiply");
    
    // InputBlock
    let Size = new InputBlock("Size");
    Size.value = 0.05;
    Size.min = 0;
    Size.max = 0;
    Size.isBoolean = false;
    Size.matrixMode = 0;
    Size.animationType = AnimatedInputBlockTypes.None;
    Size.isConstant = false;
    Size.visibleInInspector = false;
    
    // TrigonometryBlock
    let Floor1 = new TrigonometryBlock("Floor");
    Floor1.operation = TrigonometryBlockOperations.Floor;
    
    // InputBlock
    let Float = new InputBlock("Float");
    Float.value = 2;
    Float.min = 0;
    Float.max = 0;
    Float.isBoolean = false;
    Float.matrixMode = 0;
    Float.animationType = AnimatedInputBlockTypes.None;
    Float.isConstant = false;
    Float.visibleInInspector = false;
    
    // InputBlock
    let Float1 = new InputBlock("Float");
    Float1.value = 0.8;
    Float1.min = 0;
    Float1.max = 0;
    Float1.isBoolean = false;
    Float1.matrixMode = 0;
    Float1.animationType = AnimatedInputBlockTypes.None;
    Float1.isConstant = false;
    Float1.visibleInInspector = false;
    
    // OneMinusBlock
    let Oneminus = new OneMinusBlock("One minus");

    // InputBlock
    let Float2 = new InputBlock("Float");
    Float2.value = 1;
    Float2.min = 0;
    Float2.max = 0;
    Float2.isBoolean = false;
    Float2.matrixMode = 0;
    Float2.animationType = AnimatedInputBlockTypes.None;
    Float2.isConstant = true;
    Float2.visibleInInspector = false;
    
    // FragmentOutputBlock
    let FragmentOutput = new FragmentOutputBlock("FragmentOutput");
    
    // Connections
    position.output.connectTo(WorldPos.vector);
    World.output.connectTo(WorldPos.transform);
    WorldPos.output.connectTo(WorldPosViewProjectionTransform.vector);
    ViewProjection.output.connectTo(WorldPosViewProjectionTransform.transform);
    WorldPosViewProjectionTransform.output.connectTo(VertexOutput.vector);
    uv.output.connectTo(Texture.uv);
    Texture.rgb.connectTo(CombineTextures.left);
    FragCoord.x.connectTo(Multiply.left);
    Size.output.connectTo(Multiply.right);
    Multiply.output.connectTo(Floor.input);
    Floor.output.connectTo(Add1.left);
    FragCoord.y.connectTo(Multiply1.left);
    Size.output.connectTo(Multiply1.right);
    Multiply1.output.connectTo(Floor1.input);
    Floor1.output.connectTo(Add1.right);
    Add1.output.connectTo(Mod.left);
    Float.output.connectTo(Mod.right);
    Mod.output.connectTo(Add.left);
    Float1.output.connectTo(Add.right);
    Add.output.connectTo(Clamp.value);
    Clamp.output.connectTo(ColorMerger.r);
    Clamp.output.connectTo(ColorMerger.g);
    Clamp.output.connectTo(ColorMerger.b);
    Clamp.output.connectTo(ColorMerger.a);
    ColorMerger.rgb.connectTo(CombineTextures.right);
    Texture.a.connectTo(Oneminus.input);
    Oneminus.output.connectTo(CombineTextures.gradient);
    CombineTextures.output.connectTo(FragmentOutput.rgb);
    
    // Output nodes
    nodeMaterial.addOutputNode(VertexOutput);
    nodeMaterial.addOutputNode(FragmentOutput);
    nodeMaterial.build();

    return nodeMaterial;
}