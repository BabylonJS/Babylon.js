import type { Skeleton } from "core/Bones/skeleton";
import type { ClusteredLightContainer } from "core/Lights/Clustered/clusteredLightContainer";
import type { Material } from "core/Materials/material";
import type { BaseTexture } from "core/Materials/Textures/baseTexture";
import type { Node } from "core/node";
import type { Nullable } from "core/types";
import type { ClusteredLightContainerSelectorProps } from "../../primitives/clusteredLightContainerSelector";
import type { MaterialSelectorProps } from "../../primitives/materialSelector";
import type { NodeSelectorProps } from "../../primitives/nodeSelector";
import type { SkeletonSelectorProps } from "../../primitives/skeletonSelector";
import type { TextureSelectorProps } from "../../primitives/textureSelector";
import type { PropertyLineProps } from "./propertyLine";

import { ClusteredLightContainerSelector } from "../../primitives/clusteredLightContainerSelector";
import { MaterialSelector } from "../../primitives/materialSelector";
import { NodeSelector } from "../../primitives/nodeSelector";
import { SkeletonSelector } from "../../primitives/skeletonSelector";
import { TextureSelector } from "../../primitives/textureSelector";
import { PropertyLine } from "./propertyLine";

type NodeSelectorPropertyLineProps = PropertyLineProps<Nullable<Node>> & NodeSelectorProps;
type MaterialSelectorPropertyLineProps = PropertyLineProps<Nullable<Material>> & MaterialSelectorProps;
type TextureSelectorPropertyLineProps = PropertyLineProps<Nullable<BaseTexture>> & TextureSelectorProps;
type SkeletonSelectorPropertyLineProps = PropertyLineProps<Nullable<Skeleton>> & SkeletonSelectorProps;
type ClusteredLightContainerSelectorPropertyLineProps = PropertyLineProps<Nullable<ClusteredLightContainer>> & ClusteredLightContainerSelectorProps;

export const NodeSelectorPropertyLine = (props: NodeSelectorPropertyLineProps) => <PropertyLine {...props} children={<NodeSelector {...props} />} />;
export const MaterialSelectorPropertyLine = (props: MaterialSelectorPropertyLineProps) => <PropertyLine {...props} children={<MaterialSelector {...props} />} />;
export const TextureSelectorPropertyLine = (props: TextureSelectorPropertyLineProps) => <PropertyLine {...props} children={<TextureSelector {...props} />} />;
export const SkeletonSelectorPropertyLine = (props: SkeletonSelectorPropertyLineProps) => <PropertyLine {...props} children={<SkeletonSelector {...props} />} />;
export const ClusteredLightContainerSelectorPropertyLine = (props: ClusteredLightContainerSelectorPropertyLineProps) => (
    <PropertyLine {...props} children={<ClusteredLightContainerSelector {...props} />} />
);
