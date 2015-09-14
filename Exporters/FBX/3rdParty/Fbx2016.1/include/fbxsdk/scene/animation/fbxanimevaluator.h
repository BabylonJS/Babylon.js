/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxanimevaluator.h
#ifndef _FBXSDK_SCENE_ANIMATION_EVALUATOR_H_
#define _FBXSDK_SCENE_ANIMATION_EVALUATOR_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/core/fbxobject.h>
#include <fbxsdk/scene/animation/fbxanimevalstate.h>
#include <fbxsdk/scene/animation/fbxanimstack.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

/** The principal interface for animation evaluators. The animation evaluator is used to compute node transforms
* and property values at specific times during an animation. Evaluators simplify the process of computing transform 
* matrices by taking into account all of the parameters, such as pre- and post-rotations.
* This class is abstract so that SDK users can implement their own evaluator if needed. The default evaluator used
* by the FBX SDK is a FbxAnimEvalClassic. The default evaluator can be queried with the function 
* FbxScene::GetEvaluator(), and can be changed using FbxScene::SetEvaluator().
*
* When working with scene nodes, the evaluator will always return an affine transform matrix that contains the
* translation, rotation and scale of that node.
*
* When working with object properties, the evaluator will always return a structure that can contain as many components
* as the property can have. For example, an RGB color property would return a structure containing 3 channels. The 
* class FbxAnimCurveNode is used as a data container to store those values, because it can handle as many channels as 
* needed, even if the property is not a real curve node .
*
* Below is a typical usage of the evaluator class to retrieve the global transform matrix of each node in a scene:
* \code
* //Here we assume the user already imported a scene...
* for( int i = 0, c = MyScene->GetMemberCount(FbxNode::ClassId); i < c; ++i )
* {
*     FbxNode* CurrentNode = MyScene->GetMember(FbxNode::ClassId, i);
*     FbxAMatrix& NodeGlobalTransform = MyScene->GetEvaluator()->GetNodeGlobalTransform(CurrentNode);
* }
*
* //There is an equivalent call to retrieve a node's global transform, which is exactly the same as calling Scene->GetEvaluator() :
* FbxAMatrix& NodeGlobalTransform = CurrentNode->EvaluateGlobalTransform();
* \endcode
*
* Another typical usage of the evaluator class, but this time to retrieve the value of an animated color property on a material:
* \code
* //Assuming the user imported a scene with objects and materials...
* FbxColor Color = MyMaterial->GetDiffuseColor()->EvaluateValue();
* \endcode
*
* \note Note that all the methods to retrieve global/local matrices as well as property values returns references. 
* This is important for performance purposes, to prevent an extra memory copy.
* \see FbxScene, FbxAnimEvalClassic, FbxAnimCurveNode */
class FBXSDK_DLL FbxAnimEvaluator : public FbxObject
{
    FBXSDK_ABSTRACT_OBJECT_DECLARE(FbxAnimEvaluator, FbxObject);

public:
	/** Returns a node's global transformation matrix at the specified time. The node's translation, rotation and scaling limits are taken into consideration.
	* \param pNode The node to evaluate.
	* \param pTime The time used for evaluate. If FBXSDK_TIME_INFINITE is used, this returns the default value, without animation curves evaluation.
	* \param pPivotSet The pivot set to take into account
	* \param pApplyTarget Applies the necessary transform to align into the target node
	* \param pForceEval Force the evaluator to refresh the evaluation state cache even if its already up-to-date.
	* \return The resulting global transform of the specified node at the specified time. */
	FbxAMatrix& GetNodeGlobalTransform(FbxNode* pNode, const FbxTime& pTime=FBXSDK_TIME_INFINITE, FbxNode::EPivotSet pPivotSet=FbxNode::eSourcePivot, bool pApplyTarget=false, bool pForceEval=false);

	/** Returns a node's local transformation matrix at the specified time. The node's translation, rotation and scaling limits are taken into consideration.
	* \param pNode The node to evaluate.
	* \param pTime The time used for evaluate. If FBXSDK_TIME_INFINITE is used, this returns the default value, without animation curves evaluation.
	* \param pPivotSet The pivot set to take into account
	* \param pApplyTarget Applies the necessary transform to align into the target node
	* \param pForceEval Force the evaluator to refresh the evaluation state cache even if its already up-to-date.
	* \return The resulting local transform of the specified node for the specified time.
	* \remarks The local transform matrix is calculated in this way: ParentGlobal.Inverse * Global, all transforms such as pre/post rotation are taken into consideration.
	* This will return a different value than LclTranslation, LclRotation and LclScaling at the specified time. To evaluate these properties separately
	* without taking pre/post rotation, pivots and offsets into consideration, please use GetNodeLocalTranslation(), GetNodeLocalRotation() and GetNodeLocalScaling(). */
    FbxAMatrix& GetNodeLocalTransform(FbxNode* pNode, const FbxTime& pTime=FBXSDK_TIME_INFINITE, FbxNode::EPivotSet pPivotSet=FbxNode::eSourcePivot, bool pApplyTarget=false, bool pForceEval=false);

	/** Returns the value of a node's LclTranslation property at the specified time. 
	* No pivot, offsets, or any other transform is taken into consideration. The translation limit is applied.
	* \param pNode The transform node to evaluate.
	* \param pTime The time used for evaluate. If FBXSDK_TIME_INFINITE is used, this returns the default value, without animation curves evaluation.
	* \param pPivotSet The pivot set to take into account
	* \param pApplyTarget Applies the necessary transform to align into the target node
	* \param pForceEval Force the evaluator to refresh the evaluation state cache even if its already up-to-date.
	* \return The resulting value of LclTranslation property of the specified node at the specified time. */
	FbxVector4& GetNodeLocalTranslation(FbxNode* pNode, const FbxTime& pTime=FBXSDK_TIME_INFINITE, FbxNode::EPivotSet pPivotSet=FbxNode::eSourcePivot, bool pApplyTarget=false, bool pForceEval=false);

	/** Returns the value of a node's LclRotation property at the specified time. 
	* No pre/post rotation, rotation pivot, rotation offset or any other transform is taken into consideration. The rotation limit is applied.
	* \param pNode The transform node to evaluate.
	* \param pTime The time used for evaluate. If FBXSDK_TIME_INFINITE is used, this returns the default value, without animation curves evaluation.
	* \param pPivotSet The pivot set to take into account
	* \param pApplyTarget Applies the necessary transform to align into the target node
	* \param pForceEval Force the evaluator to refresh the evaluation state cache even if its already up-to-date.
	* \return The resulting value of LclRotation property of the specified node at the specified time. */
	FbxVector4& GetNodeLocalRotation(FbxNode* pNode, const FbxTime& pTime=FBXSDK_TIME_INFINITE, FbxNode::EPivotSet pPivotSet=FbxNode::eSourcePivot, bool pApplyTarget=false, bool pForceEval=false);

	/** Returns the value of a node's LclScaling property at the specified time. 
	* No scaling pivot, scaling offset or any other transform is taken into consideration. The scaling limit is applied.
	* \param pNode The transform node to evaluate.
	* \param pTime The time used for evaluate. If FBXSDK_TIME_INFINITE is used, this returns the default value, without animation curves evaluation.
	* \param pPivotSet The pivot set to take into account
	* \param pApplyTarget Applies the necessary transform to align into the target node
	* \param pForceEval Force the evaluator to refresh the evaluation state cache even if its already up-to-date.
	* \return The resulting value of LclScaling property of the specified node at the specified time. */
	FbxVector4& GetNodeLocalScaling(FbxNode* pNode, const FbxTime& pTime=FBXSDK_TIME_INFINITE, FbxNode::EPivotSet pPivotSet=FbxNode::eSourcePivot, bool pApplyTarget=false, bool pForceEval=false);

	/** Get a property's value at the specified time using the template type provided.
	* \param pProperty The property to evaluate.
	* \param pTime The time used for evaluate.
	* \param pForceEval Force the evaluator to refresh the evaluation state cache even if its already up-to-date.
	* \return The property value at the specified time converted to the template type provided, if possible.
	* \remark If the property type versus the template cannot be converted, the result is unknown. */
#if defined(__GNUC__) && (__GNUC__ < 4)
	template <class T> inline T GetPropertyValue(FbxProperty& pProperty, const FbxTime& pTime, bool pForceEval=false){ FbxPropertyEvalState* s = GetPropertyEvalState(pProperty, pTime, pForceEval); return s->Get<T>(); }
#else
    template <class T> inline T GetPropertyValue(FbxProperty& pProperty, const FbxTime& pTime, bool pForceEval=false){ return GetPropertyEvalState(pProperty, pTime, pForceEval)->Get<T>(); }
#endif

	/** Get a property's value at the specified time.
	* \param pProperty The property to evaluate.
	* \param pTime The time used for evaluate.
	* \param pForceEval Force the evaluator to refresh the evaluation state cache even if its already up-to-date.
	* \return The property value at the specified time. Use FbxPropertyValue::Get() to retrieve the value into a pointer location of your choice. */
	FbxPropertyValue& GetPropertyValue(FbxProperty& pProperty, const FbxTime& pTime, bool pForceEval=false);

	/** Get a property curve node from the evaluation state for quick access.
	* \param pProperty The property to search for its animation curve node.
	* \param pAnimLayer The animation layer on which the animation curve node must be searched.
	* \remark This function uses a map to store animation curve node search results. If animation curve nodes are replaced, the evaluation state must be reset. */
	FbxAnimCurveNode* GetPropertyCurveNode(FbxProperty& pProperty, FbxAnimLayer* pAnimLayer);

	/** Validate if the given time value is within animation stack time span range.
	* \param pTime The time value to validate.
	* \return The new validated time, clamped by the animation stack time span range.
	* \remarks If no animation stack are found, time zero is returned. This function is not used by the evaluator itself. */
    FbxTime ValidateTime(const FbxTime& pTime);

	/** Completely reset the evaluation state cache by deleting all entries. This reset automatically happens when changing the current context. */
	void Reset();

	/** Clears the specified node evaluation state cache, so the next time the evaluation is called for this node it get refreshed.
	* \param pNode The node that needs to be re-evaluated in next evaluation. */
	void Flush(FbxNode* pNode);

	/** Clears the specified property evaluation state cache, so the next time the evaluation is called for this property it get refreshed.
	* \param pProperty The property that needs to be re-evaluated in next evaluation. */
	void Flush(FbxProperty& pProperty);

	/** Compute node local TRS from global transform. Doesn't change cached state for current time.
	* \param[out] pRetLT Computed local translation.
	* \param[out] pRetLR Computed local rotation.
	* \param[out] pRetLS Computed local scaling.
	* \param pNode The transform node to evaluate.
	* \param pGX Global transformation state.
	* \param pTime The time used for evaluate.If FBXSDK_TIME_INFINITE is used, this returns the default value, without animation curves evaluation.
	* \param pPivotSet The pivot set to take into account.
	* \param pApplyTarget Applies the necessary transform to align into the target node.
	* \param pForceEval Force the evaluator to refresh the evaluation state cache even if its already up-to-date. */
	void ComputeLocalTRSFromGlobal(FbxVector4& pRetLT, FbxVector4& pRetLR, FbxVector4& pRetLS, FbxNode* pNode, FbxAMatrix& pGX, const FbxTime& pTime=FBXSDK_TIME_INFINITE, FbxNode::EPivotSet pPivotSet=FbxNode::eSourcePivot, bool pApplyTarget=false, bool pForceEval=false);

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
protected:
	virtual void Construct(const FbxObject* pFrom);
    virtual void Destruct(bool pRecursive);

    virtual void EvaluateNodeTransform(FbxNodeEvalState* pResult, FbxNode* pNode, const FbxTime& pTime, FbxNode::EPivotSet pPivotSet, bool pApplyTarget) = 0;
	virtual void EvaluatePropertyValue(FbxPropertyEvalState* pResult, FbxProperty& pProperty, const FbxTime& pTime) = 0;

	FbxAnimEvalState*		GetDefaultEvalState();
	FbxAnimEvalState*		GetEvalState(const FbxTime& pTime);
	FbxNodeEvalState*		GetNodeEvalState(FbxNode* pNode, const FbxTime& pTime, FbxNode::EPivotSet pPivotSet, bool pApplyTarget, bool pForceEval);
	FbxPropertyEvalState*	GetPropertyEvalState(FbxProperty& pProperty, const FbxTime& pTime, bool pForceEval);

private:
	FbxAnimEvalState*		mEvalState;
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_SCENE_ANIMATION_EVALUATOR_H_ */
