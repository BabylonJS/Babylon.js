/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxanimevalclassic.h
#ifndef _FBXSDK_SCENE_ANIMATION_EVALUATOR_CLASSIC_H_
#define _FBXSDK_SCENE_ANIMATION_EVALUATOR_CLASSIC_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/core/fbxobject.h>
#include <fbxsdk/scene/animation/fbxanimevaluator.h>
#include <fbxsdk/scene/animation/fbxanimlayer.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

/** An evaluator implementation that behaves like the original FBX SDK (2010 and previous) evaluation system.
  *
  * It works by implementing the abstract class FbxAnimEvaluator, which is used as the main interface for evaluators.
  * \note While this class can be instanced at any time, it is preferable to access the evaluator via the function
  * FbxScene::GetEvaluator(), which will automatically return the default evaluator used in the current FBX SDK.
  * This is very useful because it will allow the user to use the very same evaluator used by the FBX SDK internally.
  * \see FbxAnimEvaluator, FbxScene
  */
class FBXSDK_DLL FbxAnimEvalClassic : public FbxAnimEvaluator
{
    FBXSDK_OBJECT_DECLARE(FbxAnimEvalClassic, FbxAnimEvaluator);
	
	enum EBlendType {eSimple, eRotation, eScaling};

	/** Calculate values of properties LclTranslation, LclRotation, LclScaling of a node at the specified time 
	*   and update the mLT, mLR, mLT fields of the node's NodeEvalState.
	* \param pResult The NodeEvalState to update.
	* \param pNode The node to evaluate.
	* \param pTime The time used for evaluate. If FBXSDK_TIME_INFINITE is used, this returns the default value, without animation curves evaluation.
	* \param pStack The current animation stack used by the evaluator.
	* \remarks Values of properties LclTranslation, LclRotation, LclScaling will be updated to pResult->mLT, pResult->mLR, pResult->mLS. 
	*  The translation, rotation and scaling limits are taken into consideration.
	*  Only LclTranslation, LclRotation and LclScaling are taken into accounts, no other transform, such as pivot, offset are calculated here.
	*/
	void ComputeTRSLocal(FbxNodeEvalState* pResult, FbxNode* pNode, const FbxTime& pTime, FbxAnimStack* pStack);
	
	/** Calculate global transform of a node at the specified time and update the mGX field of the node's NodeEvalState.
	* \param pResult The NodeEvalState to update.
	* \param pNode The node to evaluate.
	* \param pTime The time used for evaluate. If FBXSDK_TIME_INFINITE is used, this returns the default value, without animation curves evaluation.
	* \param pStack The current animation stack used by the evaluator.
	* \param pPivotSet The pivot set to take into account.
	* \param pApplyTarget Applies the necessary transform to align into the target node
	* \remarks 	Calculated global transform will be updated to pResult->mGX.
	* ComputeGlobalTransform must be called after the call to ComputeTRSLocal, there is a dependency.
	* All transforms are taken into account, including:
	* Transform = Translation * RotationOffset* RotationPivot* PreRotation * LocalRotation* PostRotation * RotationPivotInverse* ScalingOffset* ScalingPivot* LocalScaling* ScalingPivotInverse
	* Also,the translation, rotation and scaling limits are taken into consideration.
	*/
	void ComputeGlobalTransform(FbxNodeEvalState* pResult, FbxNode* pNode, const FbxTime& pTime, FbxAnimStack* pStack, FbxNode::EPivotSet pPivotSet, bool pApplyTarget);
	
	/** Calculate local transform of a node at the specified time and update the mLX field of the node's NodeEvalState.
	* \param pResult The NodeEvalState to update.
	* \param pNode The node to evaluate.
	* \param pTime The time used for evaluate. If FBXSDK_TIME_INFINITE is used, this returns the default value, without animation curves evaluation.
	* \param pStack The current animation stack used by the evaluator.
	* \param pPivotSet The pivot set to take into account.
	* \param pApplyTarget Applies the necessary transform to align into the target node
	* \remarks 	Calculated local transform will be updated to pResult->mLX.
	* ComputeLocalTransform must be called after the call to ComputeGlobalTransform, there is a dependency.
	* The local transform matrix is calculated in this way: ParentGlobal.Inverse() * Global, all transforms such as pre/post rotation are taken into consideration.
	* To get values of properties LclTranslation, LclRotaion and LclScaling at the specified time, please use ComputeTRSLocal.
	* Also,the translation, rotation and scaling limits are taken into consideration.
	*/
	void ComputeLocalTransform(FbxNodeEvalState* pResult, FbxNode* pNode, const FbxTime& pTime, FbxAnimStack* pStack, FbxNode::EPivotSet pPivotSet, bool pApplyTarget);
	
	/** Check if the property has corresponding animation curve node on the specified animation layer.
	* \param pProperty  The property to check.
	* \param pAnimLayer The animation layer to check on.
	* \return           \c true if pProperty has corresponding animation curve node on pAnimLayer, \c false otherwise.
	*/
	bool HasAnimationCurveNode(FbxProperty& pProperty, FbxAnimLayer* pAnimLayer);

	/** Calculate values of properties LclTranslation, LclRotation, LclScaling of a node at the specified time on certain animation layer.
	* \param pResult The NodeEvalState to update.
	* \param pNode The node to evaluate.
	* \param pLT To take the calculated value of LclTranslation.
	* \param pLR To take the calculated value of LclRotation.
	* \param pLS To take the calculated value of LclScaling.
	* \param pTime The time used for evaluate. 
	* \param pLayer The current animation layer used to do the calculation.
	* \param pBlend if \c false, only animation on current layer will be taken into account, and pResult->mCurveNode will be updated accordingly.
	                if \c true, the value on this animation layer will be blended with current value of pLT, pLR and pLS.
    * \remarks The usual usage of this function is to call it on the first animation layer with out blending, then call it repeatedly on other 
	*  animation layers with blending to get the blended value of pLT, pLR and pLS of all animation layers.
	*/
	void ComputeTRSAnimationLayer(FbxNodeEvalState* pResult, FbxNode* pNode, FbxVector4& pLT, FbxVector4& pLR, FbxVector4& pLS, const FbxTime& pTime, FbxAnimLayer* pLayer, bool pBlend);
	
	/** Blend value of a property on certain animation layer to pResult.
	* \param pResult The blended value of the property.
	* \param pResultSize The elements number of the property value.
	* \param pProperty  The property to be blended.
	* \param pEvalState An auxiliary parameter, the NodeEvalState to get rotation order for eRotation type blending.
	* \param pTime The time used for evaluate. 
	* \param pLayer The current animation layer used to do the calculation.
	* \param pType There are three blend types, eSimple, eRotation, eScaling
	* \remarks The blended value will be kept in pResult.
	*/
	void BlendPropertyEvalWithLayer(double* pResult, int pResultSize, FbxProperty& pProperty, FbxNodeEvalState* pEvalState, const FbxTime& pTime, FbxAnimLayer* pLayer, EBlendType pType);
	
	/** Blends two arrays of values in a simple weighted linear blending way.
	* \param pResult The first array of values to be blended.
	* \param pResultSize The number of elements of the first value to be blended.
	* \param pApply  The second array of values to be blended.
	* \param pApplySize The number of elements of the second value to be blended.
	* \param pWeight The weight used to blend. 
	* \param pBlendMode The blend mode to use.
	* \see BlendMode
	* \remarks The blended value will be kept in pResult.
	*/
	void BlendSimple(double* pResult, int pResultSize, double* pApply, int pApplySize, double pWeight, FbxAnimLayer::EBlendMode pBlendMode);
	
	/** Blends two arrays of values representing rotations.
	* \param pResult The first array of values to be blended.
	* \param pResultSize The number of elements of the first value to be blended.
	* \param pApply  The second array of values to be blended.
	* \param pApplySize The number of elements of the second value to be blended.
	* \param pWeight The weight used to blend. 
	* \param pBlendMode The blend mode to use.
	* \param pRotAccuMode The rotation accumulation mode.
	* \param pRotationOrder The rotation order to be used for blending.
	* \remarks The blended value will be kept in pResult. And this blend should not be used with anything other than rotations.
	* \see BlendMode, RotationAccumulationMode
	*/
	void BlendRotation(double* pResult, int pResultSize, double* pApply, int pApplySize, double pWeight, FbxAnimLayer::EBlendMode pBlendMode, FbxAnimLayer::ERotationAccumulationMode pRotAccuMode, int pRotationOrder);
	
	/** Blends two arrays of values representing scaling transforms.
	* \param pResult The first array of values to be blended.
	* \param pResultSize The number of elements of the first value to be blended.
	* \param pApply  The second array of values to be blended.
	* \param pApplySize The number of elements of the second value to be blended.
	* \param pWeight The weight used to blend. 
	* \param pBlendMode The blend mode to use.
	* \param pScaleAccuMode The scaling accumulation mode.
	* \remarks The blended value will be kept in pResult.And this blend should not be used with anything other than scaling transform.
	* \see BlendMode, ScaleAccumulationMode.
	*/
	void BlendScaling(double* pResult, int pResultSize, double* pApply, int pApplySize, double pWeight, FbxAnimLayer::EBlendMode pBlendMode, FbxAnimLayer::EScaleAccumulationMode pScaleAccuMode);

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
protected:
	virtual void Construct(const FbxObject* pFrom);
	virtual void Destruct(bool pRecursive);

	virtual void EvaluateNodeTransform(FbxNodeEvalState* pResult, FbxNode* pNode, const FbxTime& pTime, FbxNode::EPivotSet pPivotSet, bool pApplyTarget);
	virtual void EvaluatePropertyValue(FbxPropertyEvalState* pResult, FbxProperty& pProperty, const FbxTime& pTime);

private:
	double* mPropertyValues;
	int		mPropertySize;

	double*	mCurveNodeEvalValues;
	int		mCurveNodeEvalSize;
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_SCENE_ANIMATION_EVALUATOR_CLASSIC_H_ */
