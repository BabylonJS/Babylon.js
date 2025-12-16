import type { Node } from "core/node";
import type { Nullable } from "core/types";
import type { PropertyLineProps } from "./propertyLine";
import type { ChooseNodeProps } from "../../primitives/chooseNode";
import type { ChooseMaterialProps } from "../../primitives/chooseMaterial";
import type { ChooseTextureProps } from "../../primitives/chooseTexture";
import type { Material } from "core/Materials/material";
import type { BaseTexture } from "core/Materials/Textures/baseTexture";

import { ChooseMaterial } from "../../primitives/chooseMaterial";
import { PropertyLine } from "./propertyLine";
import { ChooseNode } from "../../primitives/chooseNode";
import { ChooseTexture } from "../../primitives/chooseTexture";
type ChooseNodePropertyLineProps = PropertyLineProps<Nullable<Node>> & ChooseNodeProps;
type ChooseMaterialPropertyLineProps = PropertyLineProps<Nullable<Material>> & ChooseMaterialProps;
type ChooseTexturePropertyLineProps = PropertyLineProps<Nullable<BaseTexture>> & ChooseTextureProps;

export const ChooseNodePropertyLine = (props: ChooseNodePropertyLineProps) => <PropertyLine {...props} children={<ChooseNode {...props} />} />;
export const ChooseMaterialPropertyLine = (props: ChooseMaterialPropertyLineProps) => <PropertyLine {...props} children={<ChooseMaterial {...props} />} />;
export const ChooseTexturePropertyLine = (props: ChooseTexturePropertyLineProps) => <PropertyLine {...props} children={<ChooseTexture {...props} />} />;
