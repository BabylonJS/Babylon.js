import type { Node } from "core/node";
import type { Nullable } from "core/types";
import type { PropertyLineProps } from "./propertyLine";
import type { NodeSelectorProps } from "../../primitives/nodeSelector";
import type { MaterialSelectorProps } from "../../primitives/materialSelector";
import type { TextureSelectorProps } from "../../primitives/textureSelector";
import type { SkeletonSelectorProps } from "../../primitives/skeletonSelector";
import type { Material } from "core/Materials/material";
import type { BaseTexture } from "core/Materials/Textures/baseTexture";
import type { Skeleton } from "core/Bones/skeleton";

import { MaterialSelector } from "../../primitives/materialSelector";
import { PropertyLine } from "./propertyLine";
import { NodeSelector } from "../../primitives/nodeSelector";
import { TextureSelector } from "../../primitives/textureSelector";
import { SkeletonSelector } from "../../primitives/skeletonSelector";

type NodeSelectorPropertyLineProps = PropertyLineProps<Nullable<Node>> & NodeSelectorProps;
type MaterialSelectorPropertyLineProps = PropertyLineProps<Nullable<Material>> & MaterialSelectorProps;
type TextureSelectorPropertyLineProps = PropertyLineProps<Nullable<BaseTexture>> & TextureSelectorProps;
type SkeletonSelectorPropertyLineProps = PropertyLineProps<Nullable<Skeleton>> & SkeletonSelectorProps;

export const NodeSelectorPropertyLine = (props: NodeSelectorPropertyLineProps) => <PropertyLine {...props} children={<NodeSelector {...props} />} />;
export const MaterialSelectorPropertyLine = (props: MaterialSelectorPropertyLineProps) => <PropertyLine {...props} children={<MaterialSelector {...props} />} />;
export const TextureSelectorPropertyLine = (props: TextureSelectorPropertyLineProps) => <PropertyLine {...props} children={<TextureSelector {...props} />} />;
export const SkeletonSelectorPropertyLine = (props: SkeletonSelectorPropertyLineProps) => <PropertyLine {...props} children={<SkeletonSelector {...props} />} />;
