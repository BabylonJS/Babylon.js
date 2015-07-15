/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxsurfacematerial.h
#ifndef _FBXSDK_SCENE_SHADING_SURFACE_MATERIAL_H_
#define _FBXSDK_SCENE_SHADING_SURFACE_MATERIAL_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/core/fbxobject.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

/** This class contains material settings.
  * \nosubgrouping
  */
class FBXSDK_DLL FbxSurfaceMaterial : public FbxObject
{
	FBXSDK_OBJECT_DECLARE(FbxSurfaceMaterial, FbxObject);

public:
	/**
	  * \name Standard Material Property Names
	  */
	//@{	

	static const char* sShadingModel;
	static const char* sMultiLayer;
	
	static const char* sEmissive;
	static const char* sEmissiveFactor;
	
	static const char* sAmbient;
	static const char* sAmbientFactor;
	
	static const char* sDiffuse;
	static const char* sDiffuseFactor;
	
	static const char* sSpecular;
	static const char* sSpecularFactor;
	static const char* sShininess;
	
	static const char* sBump;
	static const char* sNormalMap;
    static const char* sBumpFactor;

	static const char* sTransparentColor;
	static const char* sTransparencyFactor;
	
	static const char* sReflection;
	static const char* sReflectionFactor;

    static const char* sDisplacementColor;
    static const char* sDisplacementFactor;

    static const char* sVectorDisplacementColor;
    static const char* sVectorDisplacementFactor;
	//@}	

	/**
	  * \name Material Properties
	  */
	//@{	
	FbxPropertyT<FbxString> ShadingModel;
	FbxPropertyT<FbxBool> MultiLayer;
	//@}	

	//////////////////////////////////////////////////////////////////////////
	// Static values
	//////////////////////////////////////////////////////////////////////////

	/**
	  * \name Default property values
	  */
	//@{

	static const FbxBool sMultiLayerDefault;
	static const char*	sShadingModelDefault;

    //@}

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
protected:
	bool SetColorParameter(FbxProperty pProperty, FbxColor const& pColor);
	bool GetColorParameter(FbxProperty pProperty, FbxColor& pColor) const;
	bool SetDoubleParameter(FbxProperty pProperty, double pDouble);
	bool GetDoubleParameter(FbxProperty pProperty, double pDouble) const;
	
	virtual void ConstructProperties(bool pForceSet);
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_SCENE_SHADING_SURFACE_MATERIAL_H_ */
