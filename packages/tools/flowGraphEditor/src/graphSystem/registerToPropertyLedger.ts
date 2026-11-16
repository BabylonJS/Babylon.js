import { PropertyLedger } from "shared-ui-components/nodeGraphSystem/propertyLedger";
import { GenericPropertyComponent } from "./properties/genericNodePropertyComponent";
import { GetAssetPropertyComponent } from "./properties/getAssetNodePropertyComponent";
import { DebugPropertyTabComponent } from "./properties/debugNodePropertyComponent";
import { PointerEventPropertyComponent } from "./properties/pointerEventPropertyComponent";
import { PlayAnimationPropertyComponent } from "./properties/playAnimationPropertyComponent";
import { ConstantBlockPropertyComponent } from "./properties/constantBlockPropertyComponent";
import { SwitchBlockPropertyComponent } from "./properties/switchBlockPropertyComponent";
import { DataSwitchPropertyComponent } from "./properties/dataSwitchPropertyComponent";
import { SetVariablePropertyComponent } from "./properties/setVariablePropertyComponent";
import { CustomEventPropertyComponent } from "./properties/customEventPropertyComponent";
import { FlowGraphBlockNames } from "core/FlowGraph/Blocks/flowGraphBlockNames";
import { SoundInputPropertyComponent } from "./properties/soundInputPropertyComponent";
import { MeshIntersectionPropertyComponent } from "./properties/meshIntersectionPropertyComponent";

export const RegisterToPropertyTabManagers = () => {
    PropertyLedger.DefaultControl = GenericPropertyComponent;
    PropertyLedger.RegisteredControls[FlowGraphBlockNames.GetAsset] = GetAssetPropertyComponent;
    PropertyLedger.RegisteredControls[FlowGraphBlockNames.DebugBlock] = DebugPropertyTabComponent;

    // Pointer / pick event blocks — mesh picker
    PropertyLedger.RegisteredControls[FlowGraphBlockNames.PointerDownEvent] = PointerEventPropertyComponent;
    PropertyLedger.RegisteredControls[FlowGraphBlockNames.PointerUpEvent] = PointerEventPropertyComponent;
    PropertyLedger.RegisteredControls[FlowGraphBlockNames.PointerMoveEvent] = PointerEventPropertyComponent;
    PropertyLedger.RegisteredControls[FlowGraphBlockNames.PointerOverEvent] = PointerEventPropertyComponent;
    PropertyLedger.RegisteredControls[FlowGraphBlockNames.PointerOutEvent] = PointerEventPropertyComponent;
    PropertyLedger.RegisteredControls[FlowGraphBlockNames.MeshPickEvent] = PointerEventPropertyComponent;
    PropertyLedger.RegisteredControls[FlowGraphBlockNames.MeshIntersectionEvent] = MeshIntersectionPropertyComponent;

    // Audio blocks — name-based coordinator sound asset picker
    PropertyLedger.RegisteredControls[FlowGraphBlockNames.AudioPlaySound] = SoundInputPropertyComponent;
    PropertyLedger.RegisteredControls[FlowGraphBlockNames.AudioStopSound] = SoundInputPropertyComponent;
    PropertyLedger.RegisteredControls[FlowGraphBlockNames.AudioPauseSound] = SoundInputPropertyComponent;
    PropertyLedger.RegisteredControls[FlowGraphBlockNames.AudioSetVolume] = SoundInputPropertyComponent;
    PropertyLedger.RegisteredControls[FlowGraphBlockNames.AudioSoundEndedEvent] = SoundInputPropertyComponent;
    PropertyLedger.RegisteredControls[FlowGraphBlockNames.AudioGetVolume] = SoundInputPropertyComponent;
    PropertyLedger.RegisteredControls[FlowGraphBlockNames.AudioIsSoundPlaying] = SoundInputPropertyComponent;

    // Animation — animation group picker
    PropertyLedger.RegisteredControls[FlowGraphBlockNames.PlayAnimation] = PlayAnimationPropertyComponent;

    // Constant — type-adaptive value editor
    PropertyLedger.RegisteredControls[FlowGraphBlockNames.Constant] = ConstantBlockPropertyComponent;

    // Switch — case list editor
    PropertyLedger.RegisteredControls[FlowGraphBlockNames.Switch] = SwitchBlockPropertyComponent;

    // DataSwitch — case list editor with in-place mutation
    PropertyLedger.RegisteredControls[FlowGraphBlockNames.DataSwitch] = DataSwitchPropertyComponent;

    // SetVariable — multi-variable mode editor
    PropertyLedger.RegisteredControls[FlowGraphBlockNames.SetVariable] = SetVariablePropertyComponent;

    // Custom events — event data editor
    PropertyLedger.RegisteredControls[FlowGraphBlockNames.ReceiveCustomEvent] = CustomEventPropertyComponent;
    PropertyLedger.RegisteredControls[FlowGraphBlockNames.SendCustomEvent] = CustomEventPropertyComponent;
};
