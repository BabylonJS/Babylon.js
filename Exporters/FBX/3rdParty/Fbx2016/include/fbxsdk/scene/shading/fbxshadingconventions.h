/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxshadingconventions.h
#ifndef _FBXSDK_SCENE_SHADING_CONVENTIONS_H_
#define _FBXSDK_SCENE_SHADING_CONVENTIONS_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

//Predefined shader languages
#define FBXSDK_SHADING_LANGUAGE_HLSL	"HLSL"
#define FBXSDK_SHADING_LANGUAGE_GLSL	"GLSL"
#define FBXSDK_SHADING_LANGUAGE_CGFX	"CGFX"
#define FBXSDK_SHADING_LANGUAGE_SFX		"SFX"
#define FBXSDK_SHADING_LANGUAGE_MRSL	"MentalRaySL"

//Predefined rendering APIs
#define FBXSDK_RENDERING_API_DIRECTX	"DirectX"
#define FBXSDK_RENDERING_API_OPENGL		"OpenGL"
#define FBXSDK_RENDERING_API_MENTALRAY	"MentalRay"
#define FBXSDK_RENDERING_API_PREVIEW	"PreviewColorAPI"

#define FBXSDK_IMPLEMENTATION_PREVIEW	"ImplementationPreview"
#define FBXSDK_IMPLEMENTATION_MENTALRAY	"ImplementationMentalRay"
#define FBXSDK_IMPLEMENTATION_CGFX		"ImplementationCGFX"
#define FBXSDK_IMPLEMENTATION_HLSL		"ImplementationHLSL"
#define FBXSDK_IMPLEMENTATION_SFX	    "ImplementationSFX"
#define FBXSDK_IMPLEMENTATION_OGS		"ImplementaitonOGS"
#define FBXSDK_IMPLEMENTATION_NONE		"ImplementationNone"

//PROTEIN 1.0 conventions
#define FBXSDK_TYPE_ENVIRONMENT			"KFbxEnvironment"
#define FBXSDK_TYPE_LIGHT				"KFbxLight"
#define FBXSDK_TYPE_PROCEDURALGEOMETRY	"KFbxProceduralGeometry"
#define FBXSDK_TYPE_SURFACEMATERIAL		"KFbxSurfaceMaterial"
#define FBXSDK_TYPE_TEXTURE				"KFbxTexture"
#define FBXSDK_TYPE_SWATCHSCENE			"KFbxSwatchScene"

//PROTEIN 2.0 conventions
#define ADSK_TYPE_ENVIRONMENT			"ADSKEnvironmentDefinition"
#define ADSK_TYPE_LIGHT					"ADSKLightDefinition"
#define ADSK_TYPE_PROCEDURALGEOMETRY	"ADSKProceduralGeometryDefinition"
#define ADSK_TYPE_SURFACEMATERIAL		"ADSKSurfaceMaterialDefinition"
#define ADSK_TYPE_TEXTURE				"ADSKTextureDefinition"
#define ADSK_TYPE_SWATCHSCENE			"ADSKSwatchSceneDefinition"

//ASSET Definition conventions
#define ADSK_UI_DEFINITION_URL			"UIDefinition"

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_SCENE_SHADING_CONVENTIONS_H_ */
