// Do not edit.
import { ShaderStore } from "../../Engines/shaderStore";
const name = "openpbrNormalMapVertexDeclaration";
const shader = `#if defined(GEOMETRY_NORMAL) || defined(PARALLAX) || defined(CLEARCOAT_BUMP) || defined(ANISOTROPIC)
#if defined(TANGENT) && defined(NORMAL) 
varying mat3 vTBN;
#endif
#endif
`;
// Sideeffect
if (!ShaderStore.IncludesShadersStore[name]) {
    ShaderStore.IncludesShadersStore[name] = shader;
}
/** @internal */
export const openpbrNormalMapVertexDeclaration = { name, shader };
//# sourceMappingURL=openpbrNormalMapVertexDeclaration.js.map