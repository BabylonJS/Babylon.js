/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxsurfacephong.h
#ifndef _FBXSDK_SCENE_SHADING_SURFACE_PHONG_H_
#define _FBXSDK_SCENE_SHADING_SURFACE_PHONG_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/scene/shading/fbxsurfacelambert.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

/** This class contains settings for Phong Materials.
  * \nosubgrouping
  */
class FBXSDK_DLL FbxSurfacePhong : public FbxSurfaceLambert
{
	FBXSDK_OBJECT_DECLARE(FbxSurfacePhong, FbxSurfaceLambert);

public:
	/**
	 * \name Material properties
	 */
	//@{
    //! Specular property.
    FbxPropertyT<FbxDouble3> Specular;
	
    /** Specular factor property. This factor is used to 
     *  attenuate the specular color.
     */
	FbxPropertyT<FbxDouble> SpecularFactor;

    /** Shininess property. This property controls the aspect
	 *  of the shiny spot. It is the specular exponent in the Phong
	 *  illumination model.
     */
	FbxPropertyT<FbxDouble> Shininess;

    /** Reflection color property. This property is used to
	 * implement reflection mapping.
     */
	FbxPropertyT<FbxDouble3> Reflection;

    /** Reflection factor property. This property is used to
	 * attenuate the reflection color.
     */
	FbxPropertyT<FbxDouble> ReflectionFactor;
	//@}

	//////////////////////////////////////////////////////////////////////////
	// Static values
	//////////////////////////////////////////////////////////////////////////

	/**
	  * \name Default property values
	  */
	//@{
	
	static const FbxDouble3 sSpecularDefault;
	static const FbxDouble sSpecularFactorDefault;

	static const FbxDouble sShininessDefault;
	
	static const FbxDouble3 sReflectionDefault;
	static const FbxDouble sReflectionFactorDefault;

    //@}

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
protected:
	virtual void ConstructProperties(bool pForceSet);

	// Local
	void Init();
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_SCENE_SHADING_SURFACE_PHONG_H_ */
