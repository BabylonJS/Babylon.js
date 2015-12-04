/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxsurfacelambert.h
#ifndef _FBXSDK_SCENE_SHADING_SURFACE_LAMBERT_H_
#define _FBXSDK_SCENE_SHADING_SURFACE_LAMBERT_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/scene/shading/fbxsurfacematerial.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

/** This class contains settings for Lambert Materials.
  * \nosubgrouping
  */
class FBXSDK_DLL FbxSurfaceLambert : public FbxSurfaceMaterial
{
	FBXSDK_OBJECT_DECLARE(FbxSurfaceLambert,FbxSurfaceMaterial);

public:
	/**
	 * \name Material properties
	 */
	//@{
	
    //! Emissive color property.
    FbxPropertyT<FbxDouble3> Emissive;

    /** Emissive factor property. This factor is used to
	 *  attenuate the emissive color.
     */
    FbxPropertyT<FbxDouble> EmissiveFactor;

    //! Ambient color property.
    FbxPropertyT<FbxDouble3> Ambient;

    /** Ambient factor property. This factor is used to
	 * attenuate the ambient color.
     */
    FbxPropertyT<FbxDouble> AmbientFactor;

    //! Diffuse color property.
    FbxPropertyT<FbxDouble3> Diffuse;

    /** Diffuse factor property. This factor is used to
	 * attenuate the diffuse color.
     */
    FbxPropertyT<FbxDouble> DiffuseFactor;

    /** NormalMap property. This property can be used to specify the distortion of the surface 
     * normals and create the illusion of a bumpy surface.
     */
   	FbxPropertyT<FbxDouble3> NormalMap;

    /** Bump property. This property is used to distort the
	 * surface normal and create the illusion of a bumpy surface.
     */
   	FbxPropertyT<FbxDouble3> Bump;

    /** Bump factor property. This factor is used to
     * make a surface more or less bumpy.
     */
    FbxPropertyT<FbxDouble> BumpFactor;

    //! Transparent color property.
    FbxPropertyT<FbxDouble3> TransparentColor;

    /** Transparency factor property.  This property is used to make a
	 * surface more or less opaque (0 = opaque, 1 = transparent).
     */
    FbxPropertyT<FbxDouble> TransparencyFactor;

    //! Displacement color property.
    FbxPropertyT<FbxDouble3> DisplacementColor;

    //! Displacement factor property.
    FbxPropertyT<FbxDouble> DisplacementFactor;

    //! Vector displacement color property.
    FbxPropertyT<FbxDouble3> VectorDisplacementColor;

    //! Vector displacement factor property.
    FbxPropertyT<FbxDouble> VectorDisplacementFactor;

	//@}

	//////////////////////////////////////////////////////////////////////////
	// Static values
	//////////////////////////////////////////////////////////////////////////

	/**
	  * \name Default property values
	  */
	//@{

	static const FbxDouble3 sEmissiveDefault;
	static const FbxDouble sEmissiveFactorDefault;

	static const FbxDouble3 sAmbientDefault;
	static const FbxDouble sAmbientFactorDefault;

	static const FbxDouble3 sDiffuseDefault;
	static const FbxDouble sDiffuseFactorDefault;
	
	static const FbxDouble3 sBumpDefault;
    static const FbxDouble3 sNormalMapDefault;
    static const FbxDouble sBumpFactorDefault;

	static const FbxDouble3 sTransparentDefault;
	static const FbxDouble sTransparencyFactorDefault;

    static const FbxDouble3 sDisplacementDefault;
    static const FbxDouble sDisplacementFactorDefault;

    static const FbxDouble3 sVectorDisplacementDefault;
    static const FbxDouble sVectorDisplacementFactorDefault;

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

#endif /* _FBXSDK_SCENE_SHADING_SURFACE_LAMBERT_H_ */
