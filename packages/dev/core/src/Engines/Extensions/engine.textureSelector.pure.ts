/** This file must only contain pure code and pure imports */

// Re-export the pure implementation from its new AbstractEngine location.
// The legacy wrapper keeps the side-effectful compatibility import.
export * from "../AbstractEngine/abstractEngine.textureSelector.pure";
