/**
 * Re-exports pure implementation and applies runtime side effects.
 * Import babylonFileLoader.pure for tree-shakeable, side-effect-free usage.
 */
export * from "./babylonFileLoader.pure";

import { RegisterBabylonFileLoader } from "./babylonFileLoader.pure";
RegisterBabylonFileLoader();

// The .babylon loader resolves concrete camera / light / material types by name
// through the type store, and falls back to a UniversalCamera / StandardMaterial for
// untyped entries. Before the tree-shaking split these built-ins were registered
// transitively, so importing the loader was enough to load a standard scene. Now each
// concrete class only self-registers when its own side-effect wrapper is imported, so
// pull in the standard built-ins here to preserve that contract. Consumers who want a
// fully tree-shaken loader can import babylonFileLoader.pure and register only the
// types their scenes actually use.
import "../../Cameras/universalCamera";
import "../../Cameras/arcRotateCamera";
import "../../Lights/hemisphericLight";
import "../../Lights/pointLight";
import "../../Lights/directionalLight";
import "../../Lights/spotLight";
import "../../Materials/standardMaterial";
import "../../Materials/PBR/pbrMaterial";
import "../../Materials/Background/backgroundMaterial";
import "../../Materials/multiMaterial";
