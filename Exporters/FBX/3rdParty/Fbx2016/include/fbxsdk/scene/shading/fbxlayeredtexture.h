/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxlayeredtexture.h
#ifndef _FBXSDK_SCENE_SHADING_LAYERED_TEXTURE_H_
#define _FBXSDK_SCENE_SHADING_LAYERED_TEXTURE_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/scene/shading/fbxtexture.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

/** FbxLayeredTexture is a combination of multiple textures(FbxTexture) blended sequentially.
  * For example, you can access individual texture by:
  * \code
  * FbxTexture* pIndiTexture = lLayeredTexture->GetSrcObject(FbxTexture::ClassId, pTextureIndex);
  * \endcode
  * Another example to construct a layered texture with two sub textures.
  * \code
  * FbxFileTexture *background, *file1;
  * FbxLayeredTexture* layeredTexture;
  *
  * // connect two file textures to a layered texture via OO connections
  * layeredTexture->ConnectSrcObject(background);
  * layeredTexture->ConnectSrcObject(file1);
  *
  * // set the second file texture's blend mode and alpha.
  * layeredTexture->SetTextureBlendMode(1, FbxLayeredTexture::eOver);
  * layeredTexture->SetTextureAlpha(1, 0.5);
  * \endcode
  * \nosubgrouping
  * \see FbxTexture
  */
class FBXSDK_DLL FbxLayeredTexture : public FbxTexture
{
	FBXSDK_OBJECT_DECLARE(FbxLayeredTexture, FbxTexture);

public:
	/** \enum EBlendMode Blend modes.
      * - \e eTranslucent,        The new texture layer is transparent (depending on the Alpha value).
      * - \e eAdditive,           Add the color of the new texture to the previous texture.
      * - \e eModulate,           Multiples the color value of the new texture by the color values of all previous layers of texture.
      * - \e eModulate2,          Multiples the color value of the new texture by two and then by the color values of all previous layers of texture.
      * - \e eOver,               Equivalent to eTranslucent. Blends the new texture over top of the old texture, according to the new texture's alpha channel.
      * - \e eNormal,		      The colors of the two layers will not interact in any way, and it will display the full value of the colors in layer 1.
      * - \e eDissolve,           Dissolve makes the lower layer take on the colors of the top layer, and how much depends on the opacity of the upper layer. 
      * - \e eDarken,		      Darken compares each pixel value of the upper layer to its counterpart's pixel value of the lower layer and chooses the darker of the two to display.
      * - \e eColorBurn,          Color Burn burns in the color of the upper layer with the lower layer. No part of the image will get lighter.
      * - \e eLinearBurn, 	      Linear Burn works like multiply but the results are more intense.
      * - \e eDarkerColor,        This blend mode simply divides pixel values of one layer with the other.
      * - \e eLighten,		      Lighten compares the two layers pixel for pixel and uses the lightest pixel value. No part of the image gets darker. 
      * - \e eScreen,		      Screen brightens by lightning the lower layer based on the lightness of the upper layer
      * - \e eColorDodge,         Color Dodge dodges the lower layer with the upper layer, resulting in a lighter image. No part of the image will be darkened.
      * - \e eLinearDodge,        Linear Dodge works like screen but with more intense results.
      * - \e eLighterColor,       This blend mode has the opposite effect of the Darker Color mode. It compares all the values in both layers, then displays the lightest values.
      * - \e eSoftLight,          Soft Light will multiply the dark tones and screen the light tones.
      * - \e eHardLight,          Hard Light multiplies the dark colors and screens the light colors.
      * - \e eVividLight,         Vivid Light will dodges or burn the lower layer pixels depending on whether the upper layer pixels are brighter or darker than neutral gray. It works on the contrast of the lower layer.
      * - \e eLinearLight,        Linear Light is the same as Vivid light but it works on the brightness of the lower layer.
      * - \e ePinLight,           Pin Light changes the lower layer pixels depending on how bright the pixels are in the upper layer.
      * - \e eHardMix,		      Produces either white or black, depending on similarities between A and B.
      * - \e eDifference, 	      Difference reacts to the differences between the upper and lower layer pixels.
      * - \e eExclusion, 	      Exclusion uses the darkness of the lower layer to mask the difference between upper and lower layers.
      * - \e eSubtract,           The result color is the foreground color subtracted from the background color. The result color is then applied over the background color using the foreground alpha to define the opacity of the result.
      * - \e eDivide,             This blend mode simply divides pixel values of one layer with the other.
      * - \e eHue, 			      Hue changes the hue of the lower layer to the hue of the upper layer but leaves brightness and saturation alone.
      * - \e eSaturation,	      Saturation changes the saturation of the lower layer to the hue of the upper layer but leaves brightness and hue alone.
      * - \e eColor,              Color changes the hue and saturation of the lower layer to the hue and saturation of the upper layer but leaves luminosity alone.
      * - \e eLuminosity,         Luminosity changes the luminosity of the lower layer to the luminosity of the upper layer while leaving hue and saturation the same.
      * - \e eOverlay,            Multiplies (darkens) when the layer on which the mode is set is dark and screens (brightens) when the layer on which the mode is applied is lighter.
      * - \e eBlendModeCount,           Marks the end of the blend mode enum.
	  */
	enum EBlendMode
	{
		eTranslucent,
		eAdditive,
		eModulate,
		eModulate2,
        eOver,
        eNormal,		
        eDissolve,
        eDarken,			
        eColorBurn,
        eLinearBurn, 	
        eDarkerColor,
        eLighten,			
        eScreen,		
        eColorDodge,
        eLinearDodge,
        eLighterColor,
        eSoftLight,		
        eHardLight,		
        eVividLight,
        eLinearLight,
        ePinLight, 		
        eHardMix,		
        eDifference, 		
        eExclusion, 		
        eSubtract,
        eDivide,
        eHue, 			
        eSaturation,		
        eColor,		
        eLuminosity,
        eOverlay,
        eBlendModeCount
	};

	/** Equivalence operator.
	  * \param pOther                      The object for comparison.
	  * \return                            \c True if pOther is equivalent to this object, returns \c false otherwise.
	  */
	bool operator==( const FbxLayeredTexture& pOther ) const;

    /** Sets the blending mode of a specified texture.
      * \param pIndex                      The texture index.
      * \param pMode                       The blend mode to be set.
      * \return                            \c True if successful, returns \c false otherwise.
      */
    bool SetTextureBlendMode( int pIndex, EBlendMode pMode ); 

    /** Returns the blending mode of a specified texture
      * \param pIndex                      The texture index.
      * \param pMode                       The parameter that will hold the returned blend mode.
      * \return                            \c True if successful, returns \c false otherwise.
      */
    bool GetTextureBlendMode( int pIndex, EBlendMode& pMode ) const;

     /** Sets the alpha of a specified texture.
      * \param pIndex                      The texture index.
      * \param pAlpha                      The alpha to be set.
      * \return                            \c True if successful, returns \c false otherwise.
      */
    bool SetTextureAlpha( int pIndex, double pAlpha );

    /** Returns the alpha of a specified texture
      * \param pIndex                      The texture index.
      * \param pAlpha                      The parameter that will hold the returned alpha.
      * \return                            \c True if successful, returns \c false otherwise.
      */
    bool GetTextureAlpha( int pIndex, double& pAlpha ) const;

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
    virtual FbxObject& Copy(const FbxObject& pObject);

protected:
    struct InputData
    {
        EBlendMode mBlendMode;
        double mAlpha;
    };

public:
    FbxArray<InputData> mInputData;

protected:
    virtual bool ConnectNotify (FbxConnectEvent const &pEvent);

    bool RemoveInputData( int pIndex );
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};

inline EFbxType FbxTypeOf(const FbxLayeredTexture::EBlendMode&){ return eFbxEnum; }

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_SCENE_SHADING_LAYERED_TEXTURE_H_ */
