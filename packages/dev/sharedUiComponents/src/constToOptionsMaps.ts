import { Constants } from "core/Engines";
import { ParticleSystem } from "core/Particles";

/**
 * Used to populated the blendMode dropdown in our various tools (Node Editor, Inspector, etc.)
 */
export const blendModeOptions = [
    { label: "Add", value: ParticleSystem.BLENDMODE_ADD },
    { label: "Multiply", value: ParticleSystem.BLENDMODE_MULTIPLY },
    { label: "Multiply add", value: ParticleSystem.BLENDMODE_MULTIPLYADD },
    { label: "One one", value: ParticleSystem.BLENDMODE_ONEONE },
    { label: "Standard)", value: ParticleSystem.BLENDMODE_STANDARD },
    { label: "Subtract", value: ParticleSystem.BLENDMODE_SUBTRACT },
    { label: "Maximized", value: ParticleSystem.BLENDMODE_MAXIMIZED },
    { label: "Pre-multiplied", value: ParticleSystem.BLENDMODE_PREMULTIPLIED },
    { label: "Pre-multiplied Porter Duff", value: ParticleSystem.BLENDMODE_PREMULTIPLIED_PORTERDUFF },
    { label: "Screen mode", value: ParticleSystem.BLENDMODE_SCREENMODE },
    { label: "OneOne OneOne", value: ParticleSystem.BLENDMODE_ONEONE_ONEONE },
    { label: "Alpha to color", value: ParticleSystem.BLENDMODE_ALPHATOCOLOR },
    { label: "Reverse one minus", value: ParticleSystem.BLENDMODE_REVERSEONEMINUS },
    { label: "Source+Dest * (1 - SourceAlpha)", value: ParticleSystem.BLENDMODE_SRC_DSTONEMINUSSRCALPHA },
    { label: "OneOne OneZero", value: ParticleSystem.BLENDMODE_ONEONE_ONEZERO },
    { label: "Exclusion", value: ParticleSystem.BLENDMODE_EXCLUSION },
    { label: "Layer accumulate", value: ParticleSystem.BLENDMODE_LAYER_ACCUMULATE },
];

/**
 * Used to populated the alphaMode dropdown in our various tools (Node Editor, Inspector, etc.)
 */
export const alphaModeOptions = [
    { label: "Combine", value: Constants.ALPHA_COMBINE },
    { label: "One one", value: Constants.ALPHA_ONEONE },
    { label: "Add", value: Constants.ALPHA_ADD },
    { label: "Subtract", value: Constants.ALPHA_SUBTRACT },
    { label: "Multiply", value: Constants.ALPHA_MULTIPLY },
    { label: "Maximized", value: Constants.ALPHA_MAXIMIZED },
    { label: "Pre-multiplied", value: Constants.ALPHA_PREMULTIPLIED },
    { label: "Pre-multiplied Porter Duff", value: Constants.ALPHA_PREMULTIPLIED_PORTERDUFF },
    { label: "Screen mode", value: Constants.ALPHA_SCREENMODE },
    { label: "OneOne OneOne", value: Constants.ALPHA_ONEONE_ONEONE },
    { label: "Alpha to color", value: Constants.ALPHA_ALPHATOCOLOR },
    { label: "Reverse one minus", value: Constants.ALPHA_REVERSEONEMINUS },
    { label: "Source+Dest * (1 - SourceAlpha)", value: Constants.ALPHA_SRC_DSTONEMINUSSRCALPHA },
    { label: "OneOne OneZero", value: Constants.ALPHA_ONEONE_ONEZERO },
    { label: "Exclusion", value: Constants.ALPHA_EXCLUSION },
    { label: "Layer accumulate", value: Constants.ALPHA_LAYER_ACCUMULATE },
];
