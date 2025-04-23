import { Constants } from "core/Engines";
import { ParticleSystem } from "core/Particles";

/**
 * Used by both particleSystem and alphaBlendModes
 */
export const commonBlendModes = [
    { label: "Maximized", value: Constants.ALPHA_MAXIMIZED },
    { label: "Pre-multiplied", value: Constants.ALPHA_PREMULTIPLIED },
    { label: "Pre-multiplied Porter Duff", value: Constants.ALPHA_PREMULTIPLIED_PORTERDUFF },
    { label: "Screen Mode", value: Constants.ALPHA_SCREENMODE },
    { label: "OneOne OneOne", value: Constants.ALPHA_ONEONE_ONEONE },
    { label: "Alpha to Color", value: Constants.ALPHA_ALPHATOCOLOR },
    { label: "Reverse One Minus", value: Constants.ALPHA_REVERSEONEMINUS },
    { label: "Source+Dest * (1 - SourceAlpha)", value: Constants.ALPHA_SRC_DSTONEMINUSSRCALPHA },
    { label: "OneOne OneZero", value: Constants.ALPHA_ONEONE_ONEZERO },
    { label: "Exclusion", value: Constants.ALPHA_EXCLUSION },
    { label: "Layer Accumulate", value: Constants.ALPHA_LAYER_ACCUMULATE },
];

/**
 * Used to populated the blendMode dropdown in our various tools (Node Editor, Inspector, etc.)
 * The below ParticleSystem consts were defined before new Engine alpha blend modes were added, so we have to reference
 * the ParticleSystem.FOO consts explicitly (as the underlying const values are different - they get mapped to engine consts within baseParticleSystem.ts)
 */
export const blendModeOptions = [
    { label: "Add", value: ParticleSystem.BLENDMODE_ADD },
    { label: "Multiply", value: ParticleSystem.BLENDMODE_MULTIPLY },
    { label: "Multiply Add", value: ParticleSystem.BLENDMODE_MULTIPLYADD },
    { label: "One One", value: ParticleSystem.BLENDMODE_ONEONE },
    { label: "Standard", value: ParticleSystem.BLENDMODE_STANDARD },
    { label: "Subtract", value: ParticleSystem.BLENDMODE_SUBTRACT },
].concat(commonBlendModes);

/**
 * Used to populated the alphaMode dropdown in our various tools (Node Editor, Inspector, etc.)
 */
export const alphaModeOptions = [
    { label: "Combine", value: Constants.ALPHA_COMBINE },
    { label: "One One", value: Constants.ALPHA_ONEONE },
    { label: "Add", value: Constants.ALPHA_ADD },
    { label: "Subtract", value: Constants.ALPHA_SUBTRACT },
    { label: "Multiply", value: Constants.ALPHA_MULTIPLY },
].concat(commonBlendModes);
