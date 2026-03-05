import { PropertyLedger } from "shared-ui-components/nodeGraphSystem/propertyLedger";
import { GenericPropertyComponent } from "./properties/genericNodePropertyComponent";
import { GetAssetPropertyComponent } from "./properties/getAssetNodePropertyComponent";
import { FlowGraphBlockNames } from "core/FlowGraph/Blocks/flowGraphBlockNames";

export const RegisterToPropertyTabManagers = () => {
    PropertyLedger.DefaultControl = GenericPropertyComponent;
    PropertyLedger.RegisteredControls[FlowGraphBlockNames.GetAsset] = GetAssetPropertyComponent;
};
