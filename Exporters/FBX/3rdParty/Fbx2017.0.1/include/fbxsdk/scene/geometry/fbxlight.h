/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxlight.h
#ifndef _FBXSDK_SCENE_GEOMETRY_LIGHT_H_
#define _FBXSDK_SCENE_GEOMETRY_LIGHT_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/scene/geometry/fbxnodeattribute.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

class FbxTexture;

/** \brief This node attribute contains methods for accessing the properties of a light.
  * \nosubgrouping
  */
class FBXSDK_DLL FbxLight : public FbxNodeAttribute
{
	FBXSDK_OBJECT_DECLARE(FbxLight, FbxNodeAttribute);

public:
	/**
	  * \name Light Properties
	  */
	//@{
		/** \enum EType Light types.
		  * - \e ePoint
		  * - \e eDirectional
		  * - \e eSpot
		  * - \e eArea
		  * - \e eVolume
		  */
		enum EType
		{
			ePoint, 
			eDirectional, 
			eSpot,
			eArea,
			eVolume
		};

		/** \enum EDecayType     Decay types. Used for setting the attenuation of the light.
		  * - \e eNone          No decay. The light's intensity will not diminish with distance.		
		  * - \e eLinear        Linear decay. The light's intensity will diminish linearly with the distance from the light.
		  * - \e eQuadratic     Quadratic decay. The light's intensity will diminish with the squared distance from the light.
		  *                     This is the most physically accurate decay rate.
		  * - \e eCubic         Cubic decay. The light's intensity will diminish with the cubed distance from the light.
		  */
		enum EDecayType
		{
			eNone,
			eLinear,
			eQuadratic,
			eCubic
		};

		/** \enum EAreaLightShape	Supported area light types.
		  * - \e eRectangle			Rectangle (or often called a plane) area light type.
		  * - \e eSphere			Area light that illuminate all directions.
		  */
		enum EAreaLightShape
		{
			eRectangle,
			eSphere
		};

		/** Set the shadow texture for the light.
		* \param pTexture     The texture cast by the light shadow.
		*/
		void SetShadowTexture(FbxTexture* pTexture);

		/** Get the light state.
		* \return     Pointer to the texture cast by the light shadow, or \c NULL if the shadow texture has not been set.
		*/
		FbxTexture* GetShadowTexture() const;
	//@}

	/**
	* \name Properties
	*/
	//@{	
		/** This property handles the light type.
		  *
		  * Default value is ePoint
		  */
		FbxPropertyT<EType> LightType;

		/** This property handles the cast light on object flag.
		  *
		  * Default value is true
		  */
		FbxPropertyT<FbxBool> CastLight;

		/** This property handles the draw volumetric light flag.
		  *
		  * Default value is true
		  */
		FbxPropertyT<FbxBool> DrawVolumetricLight;

		/** This property handles the draw ground projection flag.
		  *
		  * Default value is true
		  */
		FbxPropertyT<FbxBool> DrawGroundProjection;

		/** This property handles the draw facing volumetric projection flag.
		  *
		  * Default value is false
		  */
		FbxPropertyT<FbxBool> DrawFrontFacingVolumetricLight;

		/** This property handles the light color.
		  *
		  * Default value is (1.0, 1.0, 1.0)
		  */
		FbxPropertyT<FbxDouble3> Color;

		/** This property handles the light intensity.
		  *
		  * Default value is 100.0
		  */
		FbxPropertyT<FbxDouble> Intensity;

		/** This property handles the light inner cone angle (in degrees). Also know as the HotSpot
		  *
		  * Default value is 45.0
		  */
		FbxPropertyT<FbxDouble> InnerAngle;

		/** This property handles the light outer cone angle (in degrees). Also known as the Falloff
		  *
		  * Default value is 45.0
		  */
		FbxPropertyT<FbxDouble> OuterAngle;

		/** This property handles the light fog intensity
		  *
		  * Default value is 50.0
		  */
		FbxPropertyT<FbxDouble> Fog;

		/** This property handles the decay type 
		  *
		  * Default value is eNone
		  */
		FbxPropertyT<EDecayType> DecayType;

		/** This property handles the decay start distance
		  *
		  * Default value is 0.0
		  */
		FbxPropertyT<FbxDouble> DecayStart;

		/** This property handles the gobo file name
		  *
		  * Default value is ""
		  */
		FbxPropertyT<FbxString> FileName;

		/** This property handles the enable near attenuation flag
		  *
		  * Default value is false
		  */
		FbxPropertyT<FbxBool> EnableNearAttenuation;

		/** This property handles the near attenuation start distance
		  *
		  * Default value is 0.0
		  */
		FbxPropertyT<FbxDouble> NearAttenuationStart;

		/** This property handles the near end attenuation 
		  *
		  * Default value is 0.0
		  */
		FbxPropertyT<FbxDouble> NearAttenuationEnd;

		/** This property handles the enable far attenuation flag
		  *
		  * Default value is false
		  */
		FbxPropertyT<FbxBool> EnableFarAttenuation;

		/** This property handles the far attenuation start distance
		  *
		  * Default value is 0.0
		  */
		FbxPropertyT<FbxDouble> FarAttenuationStart;

		/** This property handles the attenuation end distance
		  *
		  * Default value is 0.0
		  */
		FbxPropertyT<FbxDouble> FarAttenuationEnd;

		/** This property handles the cast shadow flag
		  *
		  * Default value is false
		  */
		FbxPropertyT<FbxBool> CastShadows;

		/** This property handles the shadow color
		  *
		  * Default value is (0.0, 0.0, 0.0)
		  */
		FbxPropertyT<FbxDouble3> ShadowColor;

		/** This property handles type when LightType is eArea
		  *
		  * Default value is eRectangle
		  */
		FbxPropertyT<EAreaLightShape> AreaLightShape;

		/** This property handles the left barn door angle
		  *
		  * Default value is 20.0
		  */
		FbxPropertyT<FbxFloat> LeftBarnDoor;

		/** This property handles the right barn door angle
		  *
		  * Default value is 20.0
		  */
		FbxPropertyT<FbxFloat> RightBarnDoor;

		/** This property handles the top barn door angle
		  *
		  * Default value is 20.0
		  */
		FbxPropertyT<FbxFloat> TopBarnDoor;

		/** This property handles the bottom barn door angle
		  *
		  * Default value is 20.0
		  */
		FbxPropertyT<FbxFloat> BottomBarnDoor;

		/** This property handles active status of barn doors
		  *
		  * Default value is false
		  */
		FbxPropertyT<FbxBool> EnableBarnDoor;
	//@}

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
	virtual FbxNodeAttribute::EType GetAttributeType() const;

protected:
	virtual void ConstructProperties(bool pForceSet);
	virtual FbxStringList	GetTypeFlags() const;
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};

inline EFbxType FbxTypeOf(const FbxLight::EType&){ return eFbxEnum; }
inline EFbxType FbxTypeOf(const FbxLight::EDecayType&){ return eFbxEnum; }
inline EFbxType FbxTypeOf(const FbxLight::EAreaLightShape&){ return eFbxEnum; }

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_SCENE_GEOMETRY_LIGHT_H_ */
