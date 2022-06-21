import { PropertyLedger } from "node-editor/sharedComponents/nodeGraphSystem/propertyLedger";
import { ColorMergerPropertyTabComponent } from "./properties/colorMergerPropertyComponent";
import { ConditionalPropertyTabComponent } from "./properties/conditionalNodePropertyComponent";
import { GradientPropertyTabComponent } from "./properties/gradientNodePropertyComponent";
import { ImageSourcePropertyTabComponent } from "./properties/imageSourcePropertyTabComponent";
import { InputPropertyTabComponent } from "./properties/inputNodePropertyComponent";
import { LightInformationPropertyTabComponent } from "./properties/lightInformationPropertyTabComponent";
import { LightPropertyTabComponent } from "./properties/lightPropertyTabComponent";
import { TexturePropertyTabComponent } from "./properties/texturePropertyTabComponent";
import { TransformPropertyTabComponent } from "./properties/transformNodePropertyComponent";
import { TrigonometryPropertyTabComponent } from "./properties/trigonometryNodePropertyComponent";
import { VectorMergerPropertyTabComponent } from "./properties/vectorMergerPropertyComponent";

export const RegisterPropertyTabManagers = () => {
    PropertyLedger.RegisteredControls["TransformBlock"] = TransformPropertyTabComponent;
    PropertyLedger.RegisteredControls["InputBlock"] = InputPropertyTabComponent;
    PropertyLedger.RegisteredControls["GradientBlock"] = GradientPropertyTabComponent;
    PropertyLedger.RegisteredControls["LightBlock"] = LightPropertyTabComponent;
    PropertyLedger.RegisteredControls["LightInformationBlock"] = LightInformationPropertyTabComponent;
    PropertyLedger.RegisteredControls["TextureBlock"] = TexturePropertyTabComponent;
    PropertyLedger.RegisteredControls["ReflectionTextureBlock"] = TexturePropertyTabComponent;
    PropertyLedger.RegisteredControls["ReflectionBlock"] = TexturePropertyTabComponent;
    PropertyLedger.RegisteredControls["RefractionBlock"] = TexturePropertyTabComponent;
    PropertyLedger.RegisteredControls["CurrentScreenBlock"] = TexturePropertyTabComponent;
    PropertyLedger.RegisteredControls["ParticleTextureBlock"] = TexturePropertyTabComponent;
    PropertyLedger.RegisteredControls["TrigonometryBlock"] = TrigonometryPropertyTabComponent;
    PropertyLedger.RegisteredControls["ConditionalBlock"] = ConditionalPropertyTabComponent;
    PropertyLedger.RegisteredControls["ImageSourceBlock"] = ImageSourcePropertyTabComponent;
    PropertyLedger.RegisteredControls["VectorMergerBlock"] = VectorMergerPropertyTabComponent;
    PropertyLedger.RegisteredControls["ColorMergerBlock"] = ColorMergerPropertyTabComponent;
}
