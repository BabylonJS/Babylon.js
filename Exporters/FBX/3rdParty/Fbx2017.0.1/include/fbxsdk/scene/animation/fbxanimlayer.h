/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxanimlayer.h
#ifndef _FBXSDK_SCENE_ANIMATION_LAYER_H_
#define _FBXSDK_SCENE_ANIMATION_LAYER_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/scene/fbxcollection.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

class FbxAnimCurveNode;

/** The animation layer is a collection of animation curve nodes. Its purpose is to store
  * a variable number of FbxAnimCurveNode. The class provides different states flags (bool properties), 
  * an animatable weight, and the blending mode flag to indicate how the data on this layer is interacting
  * with the data of the other layers during the evaluation. 
  * \nosubgrouping
  */
class FBXSDK_DLL FbxAnimLayer : public FbxCollection
{
    FBXSDK_OBJECT_DECLARE(FbxAnimLayer, FbxCollection);

public:
    //////////////////////////////////////////////////////////////////////////
    //
    // Properties
    //
    //////////////////////////////////////////////////////////////////////////

    /** This property stores the weight factor.
      * The weight factor is the percentage of influence this layer has during
      * the evaluation.
      *
      * Default value is \c 100.0
      */
    FbxPropertyT<FbxDouble>       Weight;

    /** This property stores the mute state.
      * The mute state indicates that this layer should be excluded from the evaluation.
      *
      * Default value is \c false
      */
    FbxPropertyT<FbxBool>         Mute;

    /** This property stores the solo state.
      * The solo state indicates that this layer is the only one that should be
      * processed during the evaluation.
      *
      * Default value is \c false
      */
    FbxPropertyT<FbxBool>         Solo;

    /** This property stores the lock state.
      * The lock state indicates that this layer has been "locked" from editing operations
      * and should no longer receive keyframes.
      *
      * Default value is \c false
      */
    FbxPropertyT<FbxBool>         Lock;

    /** This property stores the display color.
      * This color can be used by applications if they display a graphical representation
      * of the layer. The FBX SDK does not use it but guarantees that the value is saved to the FBX
      * file and retrieved from it.
      *
      * Default value is \c (0.8, 0.8, 0.8)
      */
    FbxPropertyT<FbxDouble3>       Color;

    /** This property stores the blend mode.
      * The blend mode is used to specify how this layer influences the animation evaluation. See the
      * BlendMode enumeration for the description of the modes.
      *
      * Default value is \c eModeAdditive
      */
    FbxPropertyT<FbxEnum>			BlendMode;

    /** This property stores the rotation accumulation mode.
      * This option indicates how the rotation curves on this layer combine with any preceding layers 
      * that share the same attributes. See the RotationAccumulationMode enumeration for the description
      * of the modes.
      *
      * Default value is \c eRotationByLayer
      */
    FbxPropertyT<FbxEnum>			RotationAccumulationMode;

    /** This property stores the scale accumulation mode.
      * This option indicates how the scale curves on this layer combine with any preceding layers 
      * that share the same attributes. See the ScaleAccumulationMode enumeration for the description
      * of the modes.
      *
      * Default value is \c eScaleMultiply
      */
    FbxPropertyT<FbxEnum>			ScaleAccumulationMode;

	//! Reset this object properties to their default value.
	void Reset();

    /**
      * \name BlendMode bypass functions
      * This section provides methods to bypass the current layer blend mode by data type.
      * When the state is \c true, the evaluators that are processing the layer will 
      * need to consider that, for the given data type, the blend mode is forced to be Overwrite. 
      * If the state is left to its default \c false value, then the layer blend mode applies.
      * \remarks This section only supports the basic types defined in the fbxtypes.h header file.
      */
    //@{

		/** Set the bypass flag for the given data type.
		  * \param pType The fbxType identifier.
		  * \param pState The new state of the bypass flag.
		  * \remarks If pType is eFbxTypeCount, then pState is applied to all the data types.
		  */
		void SetBlendModeBypass(EFbxType pType, bool pState);

		/** Get the current state of the bypass flag for the given data type.
		  * \param pType The fbxType identifier.
		  * \return The current state of the flag for a valid pType value and \c false in any other case.
		  */
		bool GetBlendModeBypass(EFbxType pType);

    //@}


    /** Blend mode type between animation layers.
      */
	enum EBlendMode
	{
		eBlendAdditive,	//! The layer "adds" its animation to layers that precede it in the stack and affect the same attributes.
		eBlendOverride,	//! The layer "overrides" the animation of any layer that shares the same attributes and precedes it in the stack.
		eBlendOverridePassthrough	/*!<This mode is like the eOverride but the Weight value 
									influence how much animation from the preceding layers is 
									allowed to pass-through. When using this mode with a Weight of 
									100.0, this layer is completely opaque and it masks any animation
									from the preceding layers for the same attribute. If the Weight
									is 50.0, half of this layer animation is mixed with half of the
									animation of the preceding layers for the same attribute. */
	};
    
    /** Rotation accumulation mode of animation layer.
      */
	enum ERotationAccumulationMode
	{
		eRotationByLayer,	//! Rotation values are weighted per layer and the result rotation curves are calculated using concatenated quaternion values.
		eRotationByChannel	//! Rotation values are weighted per component and the result rotation curves are calculated by adding each independent Euler XYZ value.
	};

    /** Scale accumulation mode of animation layer.
      */
	enum EScaleAccumulationMode
	{
		eScaleMultiply,	//! Independent XYZ scale values per layer are calculated using the layer weight value as an exponent, and result scale curves are calculated by multiplying each independent XYZ scale value.
		eScaleAdditive	//! Result scale curves are calculated by adding each independent XYZ value.
	};

    /**
      * \name CurveNode management
      */
    //@{
        /** Create a FbxAnimCurveNode based on the property data type.
          * \param pProperty The property that the created FbxAnimCurveNode will be connected to.
          * \return Pointer to the created FbxAnimCurveNode, or NULL if an error occurred.
          * \remarks This function will fail if the property FbxPropertyFlags::eAnimatable flag is not set.
          * \remarks This function sets the eAnimated flag of the property.
          * \remarks The newly created FbxAnimCurveNode is automatically connected to both
          *         this object and the property.
          */
        FbxAnimCurveNode* CreateCurveNode(FbxProperty& pProperty);
    //@}

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
protected:
	virtual void ConstructProperties(bool pForceSet);
	virtual FbxAnimLayer* GetAnimLayer();

private:
    FbxPropertyT<FbxULongLong>	mBlendModeBypass;	
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_SCENE_ANIMATION_LAYER_H_ */
