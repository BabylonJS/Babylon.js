/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxanimevalstate.h
#ifndef _FBXSDK_SCENE_ANIMATION_EVALUATION_STATE_H_
#define _FBXSDK_SCENE_ANIMATION_EVALUATION_STATE_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/core/base/fbxtime.h>
#include <fbxsdk/core/fbxpropertydef.h>
#include <fbxsdk/scene/geometry/fbxnode.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

class FbxTransform;
class FbxNodeEvalState;
class FbxPropertyEvalState;

typedef FbxMap<FbxNode*, FbxNodeEvalState*> FbxNodeEvalStateMap;
typedef FbxMap<FbxProperty, FbxPropertyEvalState*> FbxPropertyEvalStateMap;
typedef FbxMap<FbxAnimLayer*, FbxAnimCurveNode*> FbxAnimLayerCurveNodeMap;
typedef FbxMap<FbxProperty, FbxAnimLayerCurveNodeMap*> FbxPropertyCurveNodeMap;

/** This class hold results from animation evaluations. To clear an evaluation state for re-use, it is possible to invalidate
  * or to reset it. For the same scene with the same objects, invalidating an evaluation state is the quickest way to clear
  * an evaluation state object for re-use because it only zeroes all the entries. A reset will delete all the entries.
  * Unless the scene changes, for performance purposes it is recommended to invalidate evaluation states instead of resetting them.
  * 
  * \internal
  * \see FbxAnimEvaluator
  */
class FBXSDK_DLL FbxAnimEvalState
{
public:
	/** Get the time associated with this evaluation state.
	* \return The time associated with this evaluation state. */
    FbxTime GetTime() const;

    /** Reset an evaluation state by deleting the cache it contains. This will remove all entries in the cache. */
    void Reset();

	/** Start a new evaluation state frame by zeroing the cache it contains, and changing its associated time. All
	* node and property entries will remain in the list, but their evaluation state will not be up-to-date.
	* \param pTime The time at which the evaluation state should be set after the invalidation. */
    void Begin(const FbxTime& pTime);

	/** Invalidate a node evaluation state to force update on next evaluation.
	* \param pNode The node that needs to be updated on next evaluation. */
	void Flush(FbxNode* pNode);

	/** Invalidate a property evaluation state to force update on next evaluation.
	* \param pProperty The property that needs to be updated on next evaluation. */
	void Flush(FbxProperty& pProperty);

	/** Get node transform evaluation result from the evaluation state.
	* \param pNode The node for which the value was stored.
	* \return The global or local matrix transform for the specified node. */
	FbxNodeEvalState* GetNodeEvalState(FbxNode* pNode);

	/** Get a property evaluation result from the evaluation state.
	* \param pProperty The property for which the value was stored.
	* \return The result value that was stored. */
    FbxPropertyEvalState* GetPropertyEvalState(FbxProperty& pProperty);

	/** Get a property curve node from the evaluation state for quick access.
	* \param pProperty The property to search for its animation curve node.
	* \param pAnimLayer The animation layer on which the animation curve node must be searched.
	* \remark This function uses a map to store animation curve node search results. If animation curve nodes are replaced, the evaluation state must be reset. */
	FbxAnimCurveNode* GetPropertyCurveNode(FbxProperty& pProperty, FbxAnimLayer* pAnimLayer);

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
    FbxAnimEvalState();
    virtual ~FbxAnimEvalState();

private:
	FbxTime					mTime;
	FbxNodeEvalStateMap		mNodeMap;
	FbxPropertyEvalStateMap	mPropertyMap;
	FbxPropertyCurveNodeMap	mPropertyCurveNodeMap;
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};

//! This class serves as the base class for an evaluation state element.
class FBXSDK_DLL FbxEvalState
{
public:
	FbxEvalState() : mUpToDate(false){}
	bool mUpToDate;	//!< If \c true, the evaluation state element is up-to-date for the current evaluation time.
};

//! This class hold results for node evaluation.
class FBXSDK_DLL FbxNodeEvalState : public FbxEvalState
{
public:
	FbxNodeEvalState(FbxNode* pNode);

	FbxVector4 mLT;	//!< Used to hold result value of LclTranslation property from node evaluation.
	FbxVector4 mLR;	//!< Used to hold result value of LclRotation property from node evaluation.
	FbxVector4 mLS;	//!< Used to hold result value of LclScaling property from node evaluation.
	FbxAMatrix mLX;	//!< Used to hold result local transform matrix from node evaluation. Pivots, offsets, pre/post rotation and all other transforms are taken into consideration.
	FbxAMatrix mGX;	//!< Used to hold result global transform matrix from node evaluation. Pivots, offsets, pre/post rotation and all other transforms are taken into consideration.

	/** mTransform is used to hold the corresponding FbxTransform of the node.
	* This FbxTransform takes all transform-related info, including pivots, offsets, pre/post rotation, rotation order, limits, etc.
	* The evaluation is actually done through the utility functions of FbxTransform. */
	FbxTransform* mTransform;
};

//! This class hold results for property evaluation.
class FBXSDK_DLL FbxPropertyEvalState : public FbxEvalState
{
public:
	FbxPropertyEvalState(FbxProperty& pProperty);
	virtual ~FbxPropertyEvalState();

	template <class T> inline T Get() const { T lValue; mValue->Get(&lValue, FbxTypeOf(lValue)); return lValue; }
	template <class T> inline bool Set(const T& pValue){ return mValue->Set(&pValue, FbxTypeOf(pValue)); }

	FbxPropertyValue* mValue;
};

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_SCENE_ANIMATION_EVALUATION_STATE_H_ */
