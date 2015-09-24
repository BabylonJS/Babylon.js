/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxanimcurvefilters.h
#ifndef _FBXSDK_SCENE_ANIMATION_CURVE_FILTERS_H_
#define _FBXSDK_SCENE_ANIMATION_CURVE_FILTERS_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/core/base/fbxtime.h>
#include <fbxsdk/core/base/fbxstatus.h>
#include <fbxsdk/scene/animation/fbxanimcurve.h>
#include <fbxsdk/fileio/fbxiosettings.h>
#include <fbxsdk/core/math/fbxtransforms.h>		// for FbxLimits

#include <fbxsdk/fbxsdk_nsbegin.h>

class FbxObject;
class FbxAnimStack;
class FbxRotationOrder;

/** Base class for animation curve filters.
* Animation curves can be modified through filters. The filters act on 
* the curve keys and values. They can move, add or remove keys,
* modify key values and key tangents, depending on the desired action
* of the filter.
* Some simple examples are:
* \li A scale filter, that would multiply all key
* values of a curve, and the curve default value, by a given scale.
* \li A constant key reducer filter, that would clean a curve by removing
* redundant keys that all have the same value.
*
* Filters can act on a single animation curve (FbxAnimCurve), but some 
* filters need to work on many animation curves at the same time. For
* this reason, the input to a filter can be an animation stack (FbxAnimStack), an object (FbxObject)
* with animated properties, an animation curve node (FbxAnimCurveNode), or an array of animation
* curves (FbxAnimCurve).
* For example, an unroll filter acts on 3 Euler rotation curves (X, Y and Z) at the same time.
*
* A filter has a start time (that can be as low as TC_MINFINITY) and a stop time (that can be as high as TC_INFINITY).
* The filter is only applied to the parts of the animation curves that are between the start and stop time.
* 
* The following are two code samples about how to use filter.
* Code sample to use sync filter:
* \code
*    FbxAnimCurve* lWorkCurves[3]; //Put some keys in the lWorkCurves and they sync them up.
*    FbxAnimCurveFilterKeySync lSyncFilter;
*    FbxTime pStart, pStop; //Given start and stop time.
*    lSyncFilter.SetStartTime( pStart );
*    lSyncFilter.SetStopTime ( pStop  );
*    if( lSyncFilter.NeedApply( lWorkCurves, 3 ) )
*    {
*        lSyncFilter.Apply( lWorkCurves, 3 );
*    }
* \endcode
*
* Code sample to use unroll filter:
* \code
*    FbxAnimCurveNode* pCurveNode; //An Euler rotation animation curve node.
*    FbxAnimCurveFilterUnroll lUnrollFilter;
*    lUnrollFilter.SetForceAutoTangents(true);
*    lUnrollFilter.Apply(*pCurveNode);
* \endcode
* 
* \nosubgrouping
*/
class FBXSDK_DLL FbxAnimCurveFilter
{
public:
    //! Constructor.
    FbxAnimCurveFilter();

    //! Destructor.
    virtual ~FbxAnimCurveFilter() {};

	/**
	 * \name Member functions
	 */
	//@{
    /** Get the name of the filter.
      * \return     Pointer to the name.
      */
    virtual const char* GetName() const {return NULL;}

    /** Get the start time for the application of the filter.
	  * The part of the animation curves before the start time will remain untouched.
      * \return     The time expressed as FbxTime.
      */
    FbxTime& GetStartTime() {return mStart;}

    /** Set the start time for the application of the filter.
	  * The part of the animation curves before the start time will remain untouched.
      * \param pTime     The time to be set.
      */
    void SetStartTime(FbxTime& pTime) { mStart = pTime; }

    /** Get the stop time for the application of the filter.
	  * The part of the animation curves after the stop time will remain untouched.
      * \return     The time expressed as FbxTime.
      */
    FbxTime& GetStopTime() {return mStop;}

    /** Set the stop time for the application of the filter.
	  * The part of the animation curves after the stop time will remain untouched.
      * \param pTime     The time to be set.
      */
    void SetStopTime(FbxTime& pTime) { mStop = pTime; }

    /** Get the index of start key on the given curve. This is the index of the first key
	  * after (or on) the filter's start time.
      * \param pCurve     Curve on which we want to retrieve the start key.
      * \return           Index of the start key.
      */
    int GetStartKey(FbxAnimCurve& pCurve) const;

    /** Get the index of stop key on the given curve. This is the index of the last key
	  * before (or on) the filter's stop time.
      * \param pCurve     Curve on which we want to retrieve the stop key.
      * \return           Index of the stop key.
      */
    int GetStopKey(FbxAnimCurve& pCurve) const;

    /** Check if any curve on the animation stack needs an application of the filter.
      * \param pAnimStack     Animation stack where to retrieve the animation curves
      * \param pStatus        The FbxStatus object to hold error codes.
      * \return               \c true if at least one animated property needs an application of the filter.
      */
    virtual bool NeedApply(FbxAnimStack* pAnimStack, FbxStatus* pStatus=NULL);

    /** Check if all the animated properties of the object need an application of the filter.
      * \param pObj           Object containing the properties to test.
      * \param pAnimStack     Animation stack where to retrieve the animation curves
      * \param pStatus        The FbxStatus object to hold error codes.
      * \return               \c true if at least one animated property needs an application of the filter.
      */
    virtual bool NeedApply(FbxObject* pObj, FbxAnimStack* pAnimStack, FbxStatus* pStatus=NULL);

    /** Check if the animation curve node needs an application of the filter.
      * \param pCurveNode     Curve node to test.
      * \param pStatus        The FbxStatus object to hold error codes.
      * \return               \c true if the animation curve node needs an application of the filter.
      * \remarks              This method collects all the FbxAnimCurve objects connected to the curve node
      *                       and calls NeedApply(FbxAnimCurve**, int)
      */
    virtual bool NeedApply(FbxAnimCurveNode& pCurveNode, FbxStatus* pStatus=NULL);

    /** Check if the given animation curve need an application of the filter.
      * \param pCurve     Array of curves to test if they need the and application of the filter.
      * \param pCount     Number of curves in array.
      * \param pStatus    The FbxStatus object to hold error codes.
      * \return           \c true if at least one animation curve in the array needs an application of the filter.
      */
    virtual bool NeedApply(FbxAnimCurve** pCurve, int pCount, FbxStatus* pStatus=NULL);

    /** Check if an animation curve need an application of the filter.
      * \param pCurve     Curve to test if it needs application of filter.
      * \param pStatus    The FbxStatus object to hold error codes.
      * \return           \c true if the animation curve needs an application of the filter.
      */
    virtual bool NeedApply(FbxAnimCurve& pCurve, FbxStatus* pStatus=NULL);

    /** Apply filter to all the curves stored in the animation stack.
      * \param pAnimStack     Animation stack where to retrieve the animation curves
      * \param pStatus        The FbxStatus object to hold error codes.
      * \return               \c true if the curve filtering operation was successful, \c false otherwise.
      */
    virtual bool Apply(FbxAnimStack* pAnimStack, FbxStatus* pStatus = NULL);

    /** Apply filter to all the animated properties of the object.
      * \param pObj           Object containing the animated properties to which the filter is applied.
      * \param pAnimStack     Animation stack where to retrieve the animation curves
      * \param pStatus        The FbxStatus object to hold error codes.
      * \return               \c true if the curve filtering operation was successful, \c false otherwise.
      */
    virtual bool Apply(FbxObject* pObj, FbxAnimStack* pAnimStack, FbxStatus* pStatus = NULL);

    /** Apply filter on all the curves of an animation curve node.
      * \param pCurveNode     Curve node to which the filter is applied.
      * \param pStatus        The FbxStatus object to hold error codes.
      * \return               \c true if the curve filtering operation was successful, \c false otherwise.
      * \remarks              This method collects all the FbxAnimCurve objects connected to the curve node
      *                       and calls Apply(FbxAnimCurve**, int)
      */
    virtual bool Apply(FbxAnimCurveNode& pCurveNode, FbxStatus* pStatus = NULL);

    /** Apply filter on an array of animation curves.
      * \param pCurve     Array of curves to which the filter is applied.
      * \param pCount     Number of curves in the array.
      * \param pStatus    The FbxStatus object to hold error codes.
      * \return           \c true if the curve filtering operation was successful, \c false otherwise.
      */
    virtual bool Apply(FbxAnimCurve** pCurve, int pCount, FbxStatus* pStatus = NULL);

    /** Apply filter on an animation curve.
      * \param pCurve         Curve to which the filter is applied.
      * \param pStatus        The FbxStatus object to hold error codes.
      * \return               \c true if the curve filtering operation was successful, \c false otherwise.
      */
    virtual bool Apply(FbxAnimCurve& pCurve, FbxStatus* pStatus = NULL) = 0;

    /** Reset the filter to its default parameters.
    */
    virtual void Reset() 
    { 
        mStart= FBXSDK_TIME_MINUS_INFINITE;
        mStop = FBXSDK_TIME_INFINITE;    
    }

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
	static bool GetContinuousOffset(FbxRotationOrder& pOrder, FbxVector4& pOffset, FbxVector4& pNew, FbxVector4& pOld);

protected:
    void GetKFCurvesFromAnimCurve(FbxAnimCurve** pSrc, int pSrcCount, KFCurve** pDst, int& pDstCount);

    // Called for progress bar update, indicating what portion of work is done.
    virtual void UpdateProgressInformation(FbxTime /*pStart*/, FbxTime /*pStop*/) {};

    // Time span for applying the filter.
    FbxTime mStart, mStop;

#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};


/** Constant key reducing filter.
  * \nosubgrouping
  * Filter to test if each key is really necessary to define the curve
  * at a definite degree of precision. It filters recursively from the
  * strongest difference first. All useless keys are eliminated.
  */
class FBXSDK_DLL FbxAnimCurveFilterConstantKeyReducer : public FbxAnimCurveFilter
{
public:
    //! Constructor.
    FbxAnimCurveFilterConstantKeyReducer();

    //! Destructor.
    virtual ~FbxAnimCurveFilterConstantKeyReducer() {};

    /** Get the name of the filter.
      * \return     Pointer to name.
      */
    virtual const char* GetName() const;

    /**
	 * \name Exposed parent class methods.
	 */
	//@{
    virtual bool Apply(FbxAnimStack* pAnimStack, FbxStatus* pStatus=NULL)                   { return FbxAnimCurveFilter::Apply(pAnimStack, pStatus); }
    virtual bool Apply(FbxObject* pObj, FbxAnimStack* pAnimStack, FbxStatus* pStatus=NULL)  { return FbxAnimCurveFilter::Apply(pObj, pAnimStack, pStatus); }
    virtual bool Apply(FbxAnimCurve** pCurve, int pCount, FbxStatus* pStatus=NULL)          { return FbxAnimCurveFilter::Apply(pCurve, pCount, pStatus); }
    //@}

    /** Apply filter on all the curves of an animation curve node.
      * \param pCurveNode     Curve node to which the filter is applied.
      * \param pStatus        The FbxStatus object to hold error codes.
      * \return               \c true if the curve filtering operation was successful, \c false otherwise.
      * \remarks              This method collects all the FbxAnimCurve objects connected to the curve node
      *                       and calls Apply(FbxAnimCurve**, int)
      */
    virtual bool Apply(FbxAnimCurveNode& pCurveNode, FbxStatus* pStatus=NULL);

    /** Apply filter on an animation curve.
      * \param pCurve         Curve to which the filter is applied.
      * \param pStatus        The FbxStatus object to hold error codes.
      * \return               \c true if the curve filtering operation was successful, \c false otherwise.
      */
    virtual bool Apply(FbxAnimCurve& pCurve, FbxStatus* pStatus=NULL);

    /** Reset the filter to its default parameters.
      */
    virtual void Reset();

    /** Get the current derivative tolerance.
      * \return     The value of the current derivative tolerance.
      */
    double GetDerivativeTolerance() const;

    /** Set the derivative tolerance.
      * \param pValue     Value derivative tolerance.
      */
    void SetDerivativeTolerance(double pValue);

    /** Get the tolerance value.
      * \return     The tolerance value.
      */
    double GetValueTolerance() const;

    /** Set the tolerance value.
      * \param pValue     Tolerance value.
      */
    void SetValueTolerance(double pValue);

    /** Get the state of the KeepFirstAndLastKeys flag.
      * \return      \c true if the filter keeps the first and last keys.
      */
    bool GetKeepFirstAndLastKeys() const;

    /** Set the state of the KeepFirstAndLastKeys flag.
      * \param pKeepFirstAndLastKeys     Set to \c true if you want the filter to keep the first and last keys.
      */
    void SetKeepFirstAndLastKeys( bool pKeepFirstAndLastKeys );

    /** Get the state of the KeepOneKey flag.
	  * If all the keys are constant and this flag is c\ true, the filter will keep the first key.  
	  * If all the keys are constant and this flag is c\ false, the filter will delete all the keys. 
      * \return     \c true if the filter keeps the first key when all keys are constant.
      */
    bool GetKeepOneKey() const;

    /** Set the state of the KeepOneKey flag.
	  * If all the keys are constant and this flag is c\ true, the filter will keep the first key.  
	  * If all the keys are constant and this flag is c\ false, the filter will delete all the keys. 
      * \param pKeepOneKey     Set to \c true if you want the filter to keep the first key when all keys are constant.
      */
    void SetKeepOneKey( bool pKeepOneKey );

    /** Tell the filter to keep CUBIC curve keys which are not pure AUTO.
	  * \param pKeep KeepNotPureAutoKeys flag.
	  */
	void SetKeepNotPureAutoKeys(bool pKeep);

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
    //
    //  If ValueTolerance is default, we use the thresholds here, otherwise
    //  it is the ValueTolerance that is used. (Mainly for backward compatibility)
    //
    void SetTranslationThreshold    ( double pTranslationThreshold );
    void SetRotationThreshold       ( double pRotationThreshold );
    void SetScalingThreshold        ( double pScalingThreshold );
    void SetDefaultThreshold        ( double pDefaultThreshold );

    void SetModes(bool pExporting, FbxIOSettings& pIOS);

private:
    double  mDerTol;
    double  mValTol;

    double  mTranslationThreshold;
    double  mRotationThreshold;
    double  mScalingThreshold;
    double  mDefaultThreshold;

    bool   mKeepFirstAndLastKeys;
    bool   mKeepOneKey;
    bool   mKeepNotPureAutoKeys;

    bool IsKeyConstant(FbxAnimCurve& pCurve, int pIndex, int pFirstIndex, int pLastIndex, double pMinValue, double pMaxValue, bool pOnlyCheckAutoKeys);
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};

/**This filter tries to compensate parent's scale to children's scale.
 * This filter is used to convert scale animation curves of nodes whose transform inherit type are eInheritRrs.
 * In the eInheritRrs mode, child objects do not inherit scaling from parent objects at all.
 * When a parent object is scaled, the child does not scale, but translates in order to keep proportional distance between models.
 * If you want to change the inherit type of certain nodes from eInheritRrs to eInheritRrSs, 
 * you may call this filter to compensate scale.
 */
class FBXSDK_DLL FbxAnimCurveFilterScaleCompensate : public FbxAnimCurveFilter
{
public:
    //! Constructor.
    FbxAnimCurveFilterScaleCompensate();
    //! Return name of the filter.
    virtual const char* GetName() const;

    /**
	 * \name Exposed parent class methods.
	 */
	//@{
    virtual bool Apply(FbxAnimStack* pAnimStack, FbxStatus* pStatus=NULL)                   { return FbxAnimCurveFilter::Apply(pAnimStack, pStatus); }
    virtual bool Apply(FbxObject* pObj, FbxAnimStack* pAnimStack, FbxStatus* pStatus=NULL)  { return FbxAnimCurveFilter::Apply(pObj, pAnimStack, pStatus); }
    virtual bool Apply(FbxAnimCurveNode& pCurveNode, FbxStatus* pStatus = NULL)             { return FbxAnimCurveFilter::Apply(pCurveNode, pStatus);       }
    virtual bool Apply(FbxAnimCurve** pCurve, int pCount, FbxStatus* pStatus = NULL)        { return FbxAnimCurveFilter::Apply(pCurve, pCount, pStatus);   }
    //@}

    /**Compensate parent's scale to children's scale. 
     * \param pCurve    In pCurve, index 0 is the curve to be filtered. index 1 is the parent curve.
     * \param pCount    Need to be 2.
     * \param pIOS      IO setting object.   
     * \param pStatus   The FbxStatus object to hold error codes.
     * \return       \c true if the curve filtering operation was successful, \c false otherwise.
     * \remarks      This filter will re-sample the animation curves.
     */
    virtual bool Apply(FbxAnimCurve** pCurve, int pCount, FbxIOSettings& pIOS, FbxStatus* pStatus = NULL);
    /** Always fail because this filter needs 2 curves. */
    virtual bool Apply(FbxAnimCurve& pCurve, FbxStatus* pStatus = NULL);
};

/**GimbleKiller filter.
  *\nosubgrouping
  * This filter try to minimize gimble locks on rotation curves.
  * \remarks The current implementation of this filter expects to process 3 curves at the same time.
  * \remarks This filter has been superseded by the Unroll filter. It is strongly advised to use
  *          the latter.
  */
class FBXSDK_DLL FbxAnimCurveFilterGimbleKiller : public FbxAnimCurveFilter
{
public:
    //! Constructor.
    FbxAnimCurveFilterGimbleKiller();

    //! Destructor.
    virtual ~FbxAnimCurveFilterGimbleKiller();

    /** Get the name of the filter.
      * \return     Pointer to name.
      */
    virtual const char* GetName() const;

    /** This filter expects to work with 3 interdependent curves. Passing the animation stack makes no sense.
      * since this object would not know which curves to handle.
      * \param pAnimStack     Animation stack
      * \param pStatus        The FbxStatus object to hold error codes.
      * \return               \c false.
      */
    virtual bool NeedApply(FbxAnimStack* /*pAnimStack*/, FbxStatus* pStatus=NULL) { FBX_UNUSED(pStatus); return false; }

    /** This filter expects to work with 3 interdependent curves. Collecting all the animation curves from
      * the properties defined in \e pObj could not guarantee that we are manipulating 3 interdependent curves.
      * \param pObj           Object containing the properties to test.
      * \param pAnimStack     Animation stack where to retrieve the animation curves
      * \param pStatus        The FbxStatus object to hold error codes.
      * \return               \c false
      */
    virtual bool NeedApply(FbxObject* /*pObj*/, FbxAnimStack* /*pAnimStack*/, FbxStatus* pStatus=NULL) { FBX_UNUSED(pStatus); return false; }

    /** Check if the animation curve node needs an application of the filter.
      * \param pCurveNode     Curve node to test.
      * \param pStatus        The FbxStatus object to hold error codes.
	  * \return               \c true if the animation curve node needs an application of the filter, \c false otherwise.
	  * \remarks              This method checks that the \e pCurveNode is representing an Euler rotation. 
	  *                       It will validate that 3 animation curves are defined. 
	  *                       If the condition is not met, the method will return \c false.
      */
    virtual bool NeedApply(FbxAnimCurveNode& pCurveNode, FbxStatus* pStatus=NULL);

    /** Check if the given animation curve need an application of the filter.
      * \param pCurve         Array of curves to test if they need the and application of the filter.
      * \param pCount         Number of curves in array.
      * \param pStatus        The FbxStatus object to hold error codes.
      * \return               \c true if at least one animation curve in the array needs an application of the filter.
      * \remarks              Because this method only receives an array of interdependent curves, this filter assumes 
      *                       that they are all coming from an Euler rotation anim curve node. Therefore, it expects 
      *                       \e pCount to be equal to 3.
      */
    virtual bool NeedApply(FbxAnimCurve** pCurve, int pCount, FbxStatus* pStatus=NULL);

     /** This filter expects to work with interdependent curves. Receiving one single curve is useless.
       * \return              \c false
       */
    virtual bool NeedApply(FbxAnimCurve& /*pCurve*/, FbxStatus* pStatus=NULL) { FBX_UNUSED(pStatus); return false; }
    
    /** This filter expects to work with 3 interdependent curves. Passing the animation stack makes no sense
      * since this object would not know which curves to handle.
      * \param pAnimStack     Animation stack
      * \param pStatus        The FbxStatus object to hold error codes.
      * \return               \c false.
      */
    virtual bool Apply(FbxAnimStack* /*pAnimStack*/, FbxStatus* pStatus=NULL) { FBX_UNUSED(pStatus); return false; }

    /** This filter expects to work with 3 interdependent curves. Collecting all the animation curves from
      * the properties defined in \e pObj could not guarantee that we are manipulating 3 interdependent curves.
      * \param pObj           Object containing the properties to test.
      * \param pAnimStack     Animation stack where to retrieve the animation curves
      * \param pStatus        The FbxStatus object to hold error codes.
      * \return               \c false
      */
    virtual bool Apply(FbxObject* /*pObj*/, FbxAnimStack* /*pAnimStack*/, FbxStatus* pStatus=NULL) { FBX_UNUSED(pStatus); return false; }

    /** Apply filter on all the curves of an animation curve node.
      * \param pCurveNode     Curve node to which the filter is applied.
      * \param pStatus        The FbxStatus object to hold error codes.
      * \return               \c true if the curve filtering operation was successful, \c false otherwise.
      * \remarks              This method collects all the FbxAnimCurve objects connected to the curve node
      *                       and calls Apply(FbxAnimCurve**, int)
      */
    virtual bool Apply(FbxAnimCurveNode& pCurveNode, FbxStatus* pStatus = NULL);

    /** Apply filter on the given animation curve.
      * \param pCurve         Array of curve to which the filter is applied.
      * \param pCount         Number of curves in array.
      * \param pStatus        The FbxStatus object to hold error codes.
      * \return               \c true if the curve filtering operation was successful, \c false otherwise.
      * \remarks              Because this method only receives an array of interdependent curves, this filter assumes 
      *                       that they are all coming from an Euler rotation anim curve node. Therefore, it expects 
      *                       \e pCount to be equal to 3.
      */
    virtual bool Apply(FbxAnimCurve** pCurve, int pCount, FbxStatus* pStatus = NULL);

    /** This filter expects to work with interdependent curves. Receiving one single curve is useless.
      * \return               \c false
      */
    virtual bool Apply(FbxAnimCurve& /*pCurve*/, FbxStatus* pStatus = NULL) { FBX_UNUSED(pStatus); return false; }

    /** Reset the filter to its default parameters.
      */
    virtual void Reset();

	//! Return \c true if key sync filter is enabled.
	bool GetApplyKeySyncFilter() const;

	/** Set to \c true to enable key sync filter.
	  * \param pFlag Key sync filter flag.
	  */
	void SetApplyKeySyncFilter(bool pFlag);

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
private:
    FbxRotationOrder*   mRotationOrder;
    bool                mApplyKeySyncFilter;
    int                 mRotationLayerType;
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};

/** Key reducing filter.
  * \nosubgrouping
  * Filter to test if each key is really necessary to define the curve
  * at a definite degree of precision. It filters recursively from the
  * strongest difference first. All useless keys are eliminated.
  */
class FBXSDK_DLL FbxAnimCurveFilterKeyReducer : public FbxAnimCurveFilter
{
public:
    //! Constructor.
    FbxAnimCurveFilterKeyReducer();

    //! Destructor.
    virtual ~FbxAnimCurveFilterKeyReducer() {};

    /** Get the name of the filter.
      * \return     Pointer to name.
      */
    virtual const char* GetName() const;

    /**
	 * \name Exposed parent class methods.
	 */
	//@{
    virtual bool Apply(FbxAnimStack* pAnimStack, FbxStatus* pStatus=NULL)                   { return FbxAnimCurveFilter::Apply(pAnimStack, pStatus); }
    virtual bool Apply(FbxObject* pObj, FbxAnimStack* pAnimStack, FbxStatus* pStatus=NULL)  { return FbxAnimCurveFilter::Apply(pObj, pAnimStack, pStatus); }
    virtual bool Apply(FbxAnimCurveNode& pCurveNode, FbxStatus* pStatus=NULL)               { return FbxAnimCurveFilter::Apply(pCurveNode, pStatus); }
    //@}

    /** Apply filter on the given animation curve.
      * \param pCurve         Array of curve to which the filter is applied.
      * \param pCount         Number of curves in array.
      * \param pStatus        The FbxStatus object to hold error codes.
      * \return               \c true if the curve filtering operation was successful, \c false otherwise.
      */
    virtual bool Apply(FbxAnimCurve** pCurve, int pCount, FbxStatus* pStatus=NULL);

    /** Apply filter on an animation curve.
      * \param pCurve         Curve to which the filter is applied.
      * \param pStatus        The FbxStatus object to hold error codes.
      * \return               \c true if the curve filtering operation was successful, \c false otherwise.
      */
    virtual bool Apply(FbxAnimCurve& pCurve, FbxStatus* pStatus=NULL);

    /** Reset the filter to its default parameters.
      */
    virtual void Reset();

	//!	Get precision.
	double GetPrecision() const;

	/**	Set precision.
	  * \param pPrecision The precision to set.
	  */
	void SetPrecision(double pPrecision);

	//!	Return \c true key sync is applied at the end.
	bool GetKeySync() const;

	/**	Set to \c true to apply key sync at the end.
	  * \param pKeySync Key sync flag.
	  */
	void SetKeySync(bool pKeySync);

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
private:
    bool  KeyReducer(FbxAnimCurve& pSCurve, FbxAnimCurve& pTCurve, FbxTime pStart, FbxTime pStop);
    bool  Subdivise(FbxAnimCurve& pSCurve, FbxAnimCurve& pTCurve, int pLeft, int pRight);
    double FindMaxError(FbxAnimCurve& pSCurve, FbxAnimCurve& pTCurve, int pLeft, int pRight, int& pSplit);
    	
    // User parameters.
    double  mPrecision;
    int    mProgressCurrentRecurseLevel;
    bool   mKeySync;
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};


/**	Key sync filter.
  * \nosubgrouping
  * Filter to synchronize the keys of a set of animation curves.
*/
class FBXSDK_DLL FbxAnimCurveFilterKeySync : public FbxAnimCurveFilter
{
public:
    //! Constructor.
    FbxAnimCurveFilterKeySync();

    //! Destructor.
    virtual ~FbxAnimCurveFilterKeySync() {};

    /** Get the name of the filter.
      * \return     Pointer to name.
      */
    virtual const char* GetName() const;

    /**
	 * \name Exposed parent class methods.
	 */
	//@{
    virtual bool NeedApply(FbxAnimStack* pAnimStack, FbxStatus* pStatus=NULL)                   { return FbxAnimCurveFilter::NeedApply(pAnimStack, pStatus); }
    virtual bool NeedApply(FbxObject* pObj, FbxAnimStack* pAnimStack, FbxStatus* pStatus=NULL)  { return FbxAnimCurveFilter::NeedApply(pObj, pAnimStack, pStatus); }
    virtual bool NeedApply(FbxAnimCurveNode& pCurveNode, FbxStatus* pStatus=NULL)               { return FbxAnimCurveFilter::NeedApply(pCurveNode, pStatus); }
    virtual bool Apply(FbxAnimStack* pAnimStack, FbxStatus* pStatus=NULL)                       { return FbxAnimCurveFilter::Apply(pAnimStack, pStatus); }
    virtual bool Apply(FbxObject* pObj, FbxAnimStack* pAnimStack, FbxStatus* pStatus=NULL)      { return FbxAnimCurveFilter::Apply(pObj, pAnimStack, pStatus); }
    virtual bool Apply(FbxAnimCurveNode& pCurveNode, FbxStatus* pStatus=NULL)                   { return FbxAnimCurveFilter::Apply(pCurveNode, pStatus); }
    //@}

    /** Check if the given animation curve need an application of the filter.
      * \param pCurve         Array of curves to test if they need the and application of the filter.
      * \param pCount         Number of curves in array.
      * \param pStatus        The FbxStatus object to hold error codes.
      * \return               \c true if at least one animation curve in the array needs an application of the filter.
      */
    virtual bool NeedApply(FbxAnimCurve** pCurve, int pCount, FbxStatus* pStatus=NULL);

    /** One single curve cannot be sync'ed.
      * \param pCurve     Curve to test if it needs application of filter.
      * \param pStatus    The FbxStatus object to hold error codes.
      * \return           \c false
      */
    virtual bool NeedApply(FbxAnimCurve& /*pCurve*/, FbxStatus* pStatus=NULL) { FBX_UNUSED(pStatus); return false; }

    /** Apply filter on the given animation curve.
      * \param pCurve         Array of curve to which the filter is applied.
      * \param pCount         Number of curves in array.
      * \param pStatus        The FbxStatus object to hold error codes.
      * \return               \c true if the curve filtering operation was successful, \c false otherwise.
      */
    virtual bool Apply(FbxAnimCurve** pCurve, int pCount, FbxStatus* pStatus=NULL);

    /** Apply filter on an animation curve.
      * \param pCurve         Curve to which the filter is applied.
      * \param pStatus        The FbxStatus object to hold error codes.
      * \return               \c true.
      * \remarks              Has no effect since there is only one curve.
      */
    virtual bool Apply(FbxAnimCurve& /*pCurve*/, FbxStatus* pStatus=NULL) { FBX_UNUSED(pStatus); return true; }
};


/** Re-sampling filter.
  * \nosubgrouping
  * Filter to re-sample animation curves.
  */
class FBXSDK_DLL FbxAnimCurveFilterResample : public FbxAnimCurveFilter
{
public:
    //! Constructor.
    FbxAnimCurveFilterResample();

    //! Destructor.
    virtual ~FbxAnimCurveFilterResample() {};

    /** Get the name of the filter.
      * \return     Pointer to name.
      */
    virtual const char* GetName() const;

    /**
	 * \name Exposed parent class methods.
	 */
	//@{
    virtual bool Apply(FbxAnimStack* pAnimStack, FbxStatus* pStatus=NULL)                       { return FbxAnimCurveFilter::Apply(pAnimStack, pStatus); }
    virtual bool Apply(FbxObject* pObj, FbxAnimStack* pAnimStack, FbxStatus* pStatus=NULL)      { return FbxAnimCurveFilter::Apply(pObj, pAnimStack, pStatus); }
    virtual bool Apply(FbxAnimCurveNode& pCurveNode, FbxStatus* pStatus=NULL)                   { return FbxAnimCurveFilter::Apply(pCurveNode, pStatus); }
    virtual bool Apply(FbxAnimCurve** pCurve, int pCount, FbxStatus* pStatus=NULL)              { return FbxAnimCurveFilter::Apply(pCurve, pCount, pStatus); }
    //@}

    /** Apply the filter on an animation curve.
      * \param pCurve         Curve to which the filter is applied.
      * \param pStatus        The FbxStatus object to hold error codes.
      * \return               \c true if the curve filtering operation was successful, \c false otherwise.
      */
    virtual bool Apply(FbxAnimCurve& pCurve, FbxStatus* pStatus=NULL);

    /** Reset the filter to its default parameters.
      */
    virtual void Reset();

    /** Set if the keys are on frame.
      * \param pKeysOnFrame     value if keys are set on frame multiples.
      */
    void SetKeysOnFrame(bool pKeysOnFrame);

    /** Get if the keys are on frame.
      * \return     Value if keys are on frame multiples.
      */
    bool GetKeysOnFrame() const;

    /** Get the re-sampling period
      * \return     The re-sampling period.
      */
    FbxTime GetPeriodTime() const;

    /** Set the re-sampling period
      * \param pPeriod     The re-sampling period to be set.
      */
    void SetPeriodTime(FbxTime &pPeriod);


    /**Get the mode that determines how the re-sample filter will set the interpolation and tangent of each key.
      * \return     \c true if the intelligent mode is on, \c false otherwise.
	  * \remarks If intelligent mode is on, interpolation type and tangent mode of each created curve key 
	  *          are set equal to the interpolation type and tangent mode of the closest curve key encountered.
	  *          If intelligent mode is off, the interpolation type of each created curve key 
	  *          will always be set to CUBIC, and tangent mode will always be set to AUTO.
      */
    bool  GetIntelligentMode() const;

    /** Set the mode that determines how the re-sample filter will set the interpolation and tangent of each key.
	  * \param pIntelligent     \c true, set interpolation type and tangent mode of each created curve key equal to
	  *                         the interpolation type and tangent mode of the closest curve key encountered.
	  *                         \c false, always set the interpolation type of each created curve key to CUBIC,
	  *                         and always set the tangent mode to AUTO.
      */
    void  SetIntelligentMode( bool pIntelligent );

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
private:
    bool    mKeysOnFrame;
    FbxTime   mPeriod;
	bool    mIntelligent;
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};


/**	Key scale filter.
  * \nosubgrouping
  * Filter to scale the keys of a set of animation curves.
*/
class FBXSDK_DLL FbxAnimCurveFilterScale : public FbxAnimCurveFilter
{
public:
    //! Constructor.
    FbxAnimCurveFilterScale();

    //! Destructor.
    virtual ~FbxAnimCurveFilterScale() {};

    /** Get the name of the filter.
      * \return     Pointer to name.
      */
    virtual const char* GetName() const;

    /**
	 * \name Exposed parent class methods.
	 */
	//@{
    virtual bool Apply(FbxAnimStack* pAnimStack, FbxStatus* pStatus=NULL)                       { return FbxAnimCurveFilter::Apply(pAnimStack, pStatus); }
    virtual bool Apply(FbxObject* pObj, FbxAnimStack* pAnimStack, FbxStatus* pStatus=NULL)      { return FbxAnimCurveFilter::Apply(pObj, pAnimStack, pStatus); }
    virtual bool Apply(FbxAnimCurve** pCurve, int pCount, FbxStatus* pStatus=NULL)              { return FbxAnimCurveFilter::Apply(pCurve, pCount, pStatus); }
    //@}

     /** Apply filter on all the curves of an animation curve node.
      * \param pCurveNode     Curve node to which the filter is applied.
      * \param pStatus        The FbxStatus object to hold error codes.
      * \return               \c true if the curve filtering operation was successful, \c false otherwise.
      * \remarks              This method collects all the FbxAnimCurve objects connected to the curve node
      *                       and calls Apply(FbxAnimCurve**, int)
      */
    virtual bool Apply(FbxAnimCurveNode& pCurveNode, FbxStatus* pStatus=NULL);

    /** Apply filter on an animation curve.
      * \param pCurve         Curve to which the filter is applied.
      * \param pStatus        The FbxStatus object to hold error codes.
      * \return               \c true if the curve filtering operation was successful, \c false otherwise.
      */
    virtual bool Apply(FbxAnimCurve& pCurve, FbxStatus* pStatus=NULL);

    /** Reset the filter to its default parameters.
      */
    virtual void Reset();

    /** Get the scale factor.
	  *	\return The current scale factor.
	  */
	double GetScale() const;

	/** Set the scale factor.
      * \param pScale The new scale factor to set.
	  */
	void SetScale(double pScale);

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
private:
    double mScale;
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};


/**	Key scale filter.  Instead of scaling by a constant float value, we will scale by using another anim curve
  * Use a single channel curve only to scale
  * \nosubgrouping
  * Filter to scale the keys of a set of animation curves.
*/
class FBXSDK_DLL FbxAnimCurveFilterScaleByCurve : public FbxAnimCurveFilter
{
public:
    //! Constructor.
    FbxAnimCurveFilterScaleByCurve();

    //! Destructor.
    virtual ~FbxAnimCurveFilterScaleByCurve() {};

    /** Get the name of the filter.
      * \return     Pointer to name.
      */
    virtual const char* GetName() const;

    /**
	 * \name Exposed parent class methods.
	 */
	//@{
    virtual bool Apply(FbxAnimStack* pAnimStack, FbxStatus* pStatus=NULL)                       { return FbxAnimCurveFilter::Apply(pAnimStack, pStatus); }
    virtual bool Apply(FbxObject* pObj, FbxAnimStack* pAnimStack, FbxStatus* pStatus=NULL)      { return FbxAnimCurveFilter::Apply(pObj, pAnimStack, pStatus); }
    virtual bool Apply(FbxAnimCurve** pCurve, int pCount, FbxStatus* pStatus=NULL)              { return FbxAnimCurveFilter::Apply(pCurve, pCount, pStatus); }
    //@}

     /** Apply filter on all the curves of an animation curve node.
      * \param pCurveNode     Curve node to which the filter is applied.
      * \param pStatus        The FbxStatus object to hold error codes.
      * \return               \c true if the curve filtering operation was successful, \c false otherwise.
      * \remarks              This method collects all the FbxAnimCurve objects connected to the curve node
      *                       and calls Apply(FbxAnimCurve**, int)
      */
    virtual bool Apply(FbxAnimCurveNode& pCurveNode, FbxStatus* pStatus=NULL);

    /** Apply filter on an animation curve.
      * \param pCurve         Curve to which the filter is applied.
      * \param pStatus        The FbxStatus object to hold error codes.
      * \return               \c true if the curve filtering operation was successful, \c false otherwise.
      */
    virtual bool Apply(FbxAnimCurve& pCurve, FbxStatus* pStatus=NULL);

    /** Reset the filter to its default parameters. (null curve)
      */
    virtual void Reset();

    /** Get the scale factor.
	  *	\return The current scale factor.
	  */
	FbxAnimCurve* GetScale() const;

	/** Set the scale factor.
      * \param pScale The new scale factor to set.
	  */
	void SetScale(FbxAnimCurve* pScale);

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
private:
    FbxAnimCurve* mScale;
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};

/**Time shift and scale filter.
  *\nosubgrouping
  * Filter to shift key times and scale key values on animation curves.
  */
class FBXSDK_DLL FbxAnimCurveFilterTSS : public FbxAnimCurveFilter
{
public:
    //! Constructor. 
    FbxAnimCurveFilterTSS();

    //! Destructor.
    virtual ~FbxAnimCurveFilterTSS() {};

    /** Get the name of the filter.
      * \return     Pointer to name.
      */
    virtual const char* GetName() const;

    /**
	 * \name Exposed parent class methods.
	 */
	//@{
    virtual bool Apply(FbxAnimStack* pAnimStack, FbxStatus* pStatus=NULL)                       { FBX_UNUSED(pStatus); return FbxAnimCurveFilter::Apply(pAnimStack); }
    virtual bool Apply(FbxObject* pObj, FbxAnimStack* pAnimStack, FbxStatus* pStatus=NULL)      { FBX_UNUSED(pStatus); return FbxAnimCurveFilter::Apply(pObj, pAnimStack); }
    virtual bool Apply(FbxAnimCurveNode& pCurveNode, FbxStatus* pStatus=NULL)                   { FBX_UNUSED(pStatus); return FbxAnimCurveFilter::Apply(pCurveNode); }
    virtual bool Apply(FbxAnimCurve** pCurve, int pCount, FbxStatus* pStatus=NULL)              { FBX_UNUSED(pStatus); return FbxAnimCurveFilter::Apply(pCurve, pCount); }
    //@}

    /** Apply filter on an animation curve.
      * \param pCurve         Curve to which the filter is applied.
      * \param pStatus        The FbxStatus object to hold error codes.
      * \return               \c true if the curve filtering operation was successful, \c false otherwise.
      */
    virtual bool Apply(FbxAnimCurve& pCurve, FbxStatus* pStatus=NULL);

    /** Reset the filter to its default parameters.
      */
    virtual void Reset();

    /** Get the time shift value.
    * \return     The time value used for the shift.
    */
	FbxTime GetShift() const;

    /** Set the time shift value.
      * \param pShift     The time value used for the shift.
      */
	void SetShift(FbxTime& pShift);

    /** Get the scale factor.
    * \return     The current scale factor.
    */
	double GetScale() const;

    /** Set the scale factor.
      * \param pScale     The new scale factor to set.
      */
	void SetScale(double pScale);

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
private:
    FbxTime  mShift;
    double  mScale;
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};

/** Unroll filter.
  *\nosubgrouping
  * Filter to apply continuous rotation values to animation curves. Due to Euler rotation
  * properties, when a rotation angle cross over the 180 degree value, it becomes -179. This
  * filter tries to keep a continuous rotation effectively by producing increasing values, to 
  * actually become 181 degrees, etc...
  * \remarks The current implementation of this filter expects to process 3 curves at the same time.
  * \remarks By default, this filter does not affect the tangent values of the modified keys.
  *          This means that, for CUBIC interpolation curves containing keys with USER or BREAK
  *          tangents, the unrolled curves will correctly match the original rotation exactly on 
  *          the curve keys but not in-between them. The filter can be configured to automatically 
  *          convert the USER and BREAK tangents to AUTO tangents by setting the ForceAutoTangents flag.
  *          Using the AUTO tangents mode can result in a more consistent interpolation between
  *          the curve keys.
  */
class FBXSDK_DLL FbxAnimCurveFilterUnroll : public FbxAnimCurveFilter
{
public:
    //! Constructor.
    FbxAnimCurveFilterUnroll();

    //! Destructor.
    virtual ~FbxAnimCurveFilterUnroll() {};
   
    /** Get the name of the filter.
      * \return     Pointer to the name.
      */
    virtual const char* GetName() const;

    /** This filter expects to work with 3 interdependent curves. Passing the animation stack makes no sense
      * since this object would not know which curves to handle.
      * \param pAnimStack     Animation stack
      * \param pStatus        The FbxStatus object to hold error codes.
      * \return               \c false.
      */
    virtual bool NeedApply(FbxAnimStack* /*pAnimStack*/, FbxStatus* pStatus=NULL) { FBX_UNUSED(pStatus); return false; };

    /** This filter expects to work with 3 interdependent curves. Collecting all the animation curves from
      * the properties defined in \e pObj could not guarantee that we are manipulating 3 interdependent curves.
      * \param pObj           Object containing the properties to test.
      * \param pAnimStack     Animation stack where to retrieve the animation curves
      * \param pStatus        The FbxStatus object to hold error codes.
      * \return               \c false.
      */
    virtual bool NeedApply(FbxObject* /*pObj*/, FbxAnimStack* /*pAnimStack*/, FbxStatus* pStatus=NULL) { FBX_UNUSED(pStatus); return false; }

    /** Check if the animation curve node needs an application of the filter.
      * \param pCurveNode     Curve node to test.
      * \param pStatus        The FbxStatus object to hold error codes.
      * \return               \c true if the animation curve node needs an application of the filter, \c false otherwise.
      * \remarks              This method checks that the \e pCurveNode is representing an Euler rotation. 
	  *                       It will validate that 3 animation curves are defined. 
	  *                       If the condition is not met, the method will return \c false.
      */
    virtual bool NeedApply(FbxAnimCurveNode& pCurveNode, FbxStatus* pStatus=NULL);

    /** Check if the given animation curve needs an application of the filter.
      * \param pCurve         Array of curves to test if they need an application of the filter.
      * \param pCount         Number of curves in array.
      * \param pStatus        The FbxStatus object to hold error codes.
      * \return               \c true if at least one animation curve in the array needs an application of the filter, 
	  *                       \c false otherwise.
      * \remarks              Because this method only receives an array of interdependent curves, this filter assumes 
      *                       that they are all coming from an Euler rotation anim curve node. Therefore, it expects 
      *                       \e pCount to be equal to 3.
      */
    virtual bool NeedApply(FbxAnimCurve** pCurve, int pCount, FbxStatus* pStatus=NULL);

    /** This filter expects to work with interdependent curves. Receiving one single curve is useless.
      * \return               \c false.
      */
    virtual bool NeedApply(FbxAnimCurve& /*pCurve*/, FbxStatus* pStatus=NULL) { FBX_UNUSED(pStatus); return false; };

    /** This filter expects to work with 3 interdependent curves. Passing the animation stack makes no sense
      * since this object would not know which curves to handle.
      * \param pAnimStack     Animation stack where to retrieve the animation curves.
      * \param pStatus        The FbxStatus object to hold error codes.
      * \return               \c false.
      */
    virtual bool Apply(FbxAnimStack* /*pAnimStack*/, FbxStatus* pStatus=NULL) { FBX_UNUSED(pStatus); return false; };

    /** This filter expects to work with 3 interdependent curves. Collecting all the animation curves from
      * the properties defined in \e pObj could not guarantee that we are manipulating 3 interdependent curves.
      * \param pObj           Object containing the properties to test.
      * \param pAnimStack     Animation stack where to retrieve the animation curves.
      * \param pStatus        The FbxStatus object to hold error codes.
      * \return               \c false.
      */
    virtual bool Apply(FbxObject* /*pObj*/, FbxAnimStack* /*pAnimStack*/, FbxStatus* pStatus=NULL) { FBX_UNUSED(pStatus); return false; }

    /** Apply filter on all the curves of an animation curve node.
      * \param pCurveNode     Curve node to which the filter is applied.
      * \param pStatus        The FbxStatus object to hold error codes.
      * \return               \c true if the curve filtering operation was successful, \c false otherwise.
      * \remarks              This filter expects a Euler rotation curve node with three curves.
      */
    virtual bool Apply(FbxAnimCurveNode& pCurveNode, FbxStatus* pStatus=NULL);

    /** Apply filter on the given animation curve.
      * \param pCurve         Array of curve to which the filter is applied.
      * \param pCount         Number of curves in array.
      * \param pStatus        The FbxStatus object to hold error codes.
      * \return               \c true if the curve filtering operation was successful, \c false otherwise.
      * \remarks              Because this method only receives an array of interdependent curves, this filter assumes 
      *                       that they are all coming from an Euler rotation anim curve node. Therefore, it expects 
      *                       \e pCount to be equal to 3.
      */
    virtual bool Apply(FbxAnimCurve** pCurve, int pCount, FbxStatus* pStatus=NULL);

    /** This filter expects to work with 3 interdependent curves. Receiving one single curve is useless.
      * \return               \c false.
      */
    virtual bool Apply(FbxAnimCurve& /*pCurve*/, FbxStatus* pStatus=NULL) { FBX_UNUSED(pStatus); return false; }

    /** Reset the filter to its default parameters.
      */
    virtual void Reset();

    /** Get the unroll quality tolerance.
    * \return     The current unroll quality tolerance.
	* \remarks    This value is only used when SetTestForPath() is set to true. 
    */
    double GetQualityTolerance() const;

    /** Set the unroll quality tolerance.
      * \param pQualityTolerance     The unroll quality tolerance to set.
	  * \remarks                     This value is only used when SetTestForPath() is set to true. 
      */
    void SetQualityTolerance(double pQualityTolerance);

    /** Get if the test path is enabled.
      * \return     \c true if test for path is enabled.
	  * \remarks The unroll filter takes a key as a reference key and updates the following keys accordingly to try to keep
	  *          the continuity between this reference key and its following keys.
	  *          If the test path is enabled, the filter can use the same key as reference key to update the following keys
	  *          until the difference of continuity between the newly updated key and the reference key exceeds the 
	  *          quality tolerance, then the reference key will be updated as the newly updated key.
	  *          If the test path is not enabled, the filter will always use the newly updated key as reference to update the next key.
	  *          The quality tolerance can be set and queried by SetQualityTolerance() and GetQualityTolerance().
      */
    bool GetTestForPath() const;

    /** Set if the test path is enabled.
      * \param pTestForPath     Value to set if test for path is to be enabled.
	  * \remarks The unroll filter takes a key as a reference key and updates the following keys accordingly to try to keep
	  *          the continuity between this reference key and its following keys.
	  *          If the test path is enabled, the filter can use the same key as reference key to update the following keys
	  *          until the difference of continuity between the newly updated key and the reference key exceeds the 
	  *          quality tolerance, then the reference key will be updated as the newly updated key.
	  *          If the test path is not enabled, the filter will always use the newly updated key as reference to update the next key.
	  *          The quality tolerance can be set and queried by SetQualityTolerance() and GetQualityTolerance().
      */
    void SetTestForPath(bool pTestForPath);

    /** Get the current state of the ForceAutoTangents flag.
      * \return     \c true if forcing AUTO tangents is enabled.
      * \remarks This flag is considered only on curves using the CUBIC interpolation and
      *          keys with the USER or BREAK tangents. For any other type of interpolations
      *          or tangents, this flag is ignored.
      */
    bool GetForceAutoTangents() const;

    /** Set the new state of the ForceAutoTangents flag.
      * \param pForceAutoTangents     New value of the flag.
      * \remarks This flag is considered only on curves using the CUBIC interpolation and
      *          keys with the USER or BREAK tangents. For any other type of interpolations
      *          or tangents, this flag is ignored.
      */
    void SetForceAutoTangents(bool pForceAutoTangents);

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
    void SetRotationOrder(FbxEuler::EOrder pOrder);

private:
    double  InterpolationQualityFactor(FbxVector4& lV1, FbxVector4& lV2);

    double           mQualityTolerance;
    bool             mTestForPath;
    bool             mForceAutoTangents;
    FbxEuler::EOrder mRotationOrder;
    int              mRotationLayerType;
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};

/** Matrix conversion filter.
  * \nosubgrouping
  * \remarks The current implementation of this filter expects to process 9 curves. If the 
  *          ApplyUnroll flag is enabled, set with a call to SetApplyUnroll(), the 
  *          internal unroll filter will automatically be configured to convert USER and 
  *          BREAK tangents to AUTO (refer to the FbxAnimCurveFilterUnroll documentation).
  */
class FBXSDK_DLL FbxAnimCurveFilterMatrixConverter : public FbxAnimCurveFilter
{
public:
    //! Constructor.
    FbxAnimCurveFilterMatrixConverter();

    //! Destructor.
    virtual ~FbxAnimCurveFilterMatrixConverter();

    /** Get the name of the filter.
      * \return     Pointer to name.
      */
    virtual const char* GetName() const;

    /**
	 * \name Exposed parent class methods.
	 */
	//@{
    virtual bool NeedApply(FbxAnimCurve** pCurve, int pCount, FbxStatus* pStatus=NULL)          { return FbxAnimCurveFilter::NeedApply(pCurve, pCount,pStatus); }
    virtual bool NeedApply(FbxAnimCurveNode& pCurveNode, FbxStatus* pStatus=NULL)               { return FbxAnimCurveFilter::NeedApply(pCurveNode, pStatus);    }
    virtual bool Apply(FbxAnimCurveNode& pCurveNode, FbxStatus* pStatus = NULL)                 { return FbxAnimCurveFilter::Apply(pCurveNode, pStatus);        }
    //@}

    /** This filter expects to work with interdependent curves. Passing the animation stack makes no sense
      * since this object would not know which curves to handle.
      * \param pAnimStack     Animation stack. 
      * \param pStatus        The FbxStatus object to hold error codes.
      * \return               \c false 
      */
    virtual bool NeedApply(FbxAnimStack* /*pAnimStack*/, FbxStatus* pStatus=NULL) { FBX_UNUSED(pStatus); return false; }

    /** This filter expects to work with 9 interdependent curves. Collecting all the animation curves from
      * the properties defined in \e pObj could not guarantee that we are manipulating 9 interdependent curves.
      * \param pObj           Object containing the properties to test.
      * \param pAnimStack     Animation stack where to retrieve the animation curves
      * \param pStatus        The FbxStatus object to hold error codes.
      * \return               \c false
      */
    virtual bool NeedApply(FbxObject* /*pObj*/, FbxAnimStack* /*pAnimStack*/, FbxStatus* pStatus=NULL) { FBX_UNUSED(pStatus); return false; }

    /** Check if the animation curve nodes need an application of the filter.
      * \param pCurveNode     Curves to test if they need an application of the filter.
      * \param pStatus        The FbxStatus object to hold error codes.
      * \return               \c true if the animation curve nodes need an application of the filter and 
      *                       \c false if they don't or an incompatible configuration is detected.
      * \remarks              This method assumes that \e pCurveNode[0] holds the translation curve,
      *                       \e pCurveNode[1] holds the rotation curves and \e pCurveNode[2] holds the
      *                       scaling curves.
      */
    virtual bool NeedApply(FbxAnimCurveNode* pCurveNode[3], FbxStatus* pStatus=NULL);

    /** This filter expects to work with interdependent curves. Receiving one single curve is useless.
      * \return               \c false.
      */
    virtual bool NeedApply(FbxAnimCurve& /*pCurve*/, FbxStatus* pStatus=NULL) { FBX_UNUSED(pStatus); return false; }

    /** This filter expects to work with interdependent curves. Passing the animation stack makes no sense
      * since this object would not know which curves to handle.
      * \param pAnimStack     Animation stack where to retrieve the animation curves.
      * \param pStatus        The FbxStatus object to hold error codes.
      * \return               \c false.
      */
    virtual bool Apply(FbxAnimStack* /*pAnimStack*/, FbxStatus* pStatus=NULL) { FBX_UNUSED(pStatus); return false; }

    /** This filter expects to work with 9 interdependent curves. Collecting all the animation curves from
      * the properties defined in \e pObj could not guarantee that we are manipulating 9 interdependent curves.
      * \param pObj           Object containing the properties to test.
      * \param pAnimStack     Animation stack where to retrieve the animation curves.
      * \param pStatus        The FbxStatus object to hold error codes.
      * \return               \c false.
      */
    virtual bool Apply(FbxObject* /*pObj*/, FbxAnimStack* /*pAnimStack*/, FbxStatus* pStatus=NULL) { FBX_UNUSED(pStatus); return false; }

    /** Apply filter on all the curves of the animation curve nodes.
      * \param pCurveNode     Curve nodes to which the filter is applied.
      * \param pStatus        The FbxStatus object to hold error codes.
      * \return               \c true if the curve filtering operation was successful, \c false otherwise.
      * \remarks              This method assumes that \e pCurveNode[0] holds the translation curve,
      *                       \e pCurveNode[1] holds the rotation curves and \e pCurveNode[2] holds the
      *                       scaling curves.
      */
    virtual bool Apply(FbxAnimCurveNode* pCurveNode[3], FbxStatus* pStatus=NULL);

    /** Apply filter on the given animation curves.
      * \param pCurve         Array of curve to which the filter is applied.
      * \param pCount         Number of curves in array.
      * \param pStatus        The FbxStatus object to hold error codes.
      * \return               \c true if the curve filtering operation was successful, \c false otherwise.
      * \remarks              \e pCount must be equal to 9
      * \remarks              Because this method only manipulates FbxAnimCurve objects, it cannot set/get
      *                       the channels value. If the calling application wishes to use this flavor of the
      *                       Apply() method, it is strongly suggested to use the method: 
      *                       FbxAnimCurveFilterMatrixConverter::Apply(FbxAnimCurve** pCurve, double& pVals[9]);
      *                       The Apply(FbxAnimCurveNode*) method is not affected by this limitation since
      *                       the channel values can be accessed via the animation curve node. 
      */
    virtual bool Apply(FbxAnimCurve** pCurve, int pCount, FbxStatus* pStatus=NULL);

    /** Apply filter on the given animation curves.
      * \param pCurve         Array of curve to which the filter is applied.
      * \param pVals          Array of channel values (same size as \e pCurve).
      * \param pStatus        The FbxStatus object to hold error codes.
      * \return               \c true if the curve filtering operation was successful, \c false otherwise.
      * \remarks              This method assumes that \e pCurve contains exactly 9 curves.
      * \remarks              \e pVals must be correctly initialized with the channels values and, if the
      *                       method calculates new values, they will be returned in this array.
      * \remarks              The curves are assumed to represent: Translation X,Y and Z, Rotation X,Y and Z and
      *                       Scaling X,Y and Z in this order.
      */
    bool Apply(FbxAnimCurve** pCurve, double* pVals, FbxStatus* pStatus=NULL);

    /** This filter expects to work with interdependent curves. Receiving one single curve is useless.
      * \return               \c false.
      */
    virtual bool Apply(FbxAnimCurve& /*pCurve*/, FbxStatus* pStatus=NULL) { FBX_UNUSED(pStatus); return false; };

    /** Reset the filter to its default parameters.
      */
    virtual void Reset();

    /** \enum EMatrixIndex Matrix index type
      * - \e ePreGlobal
      * - \e ePreTranslate
      * - \e ePostTranslate
      * - \e ePreRotate
      * - \e ePreScale
      * - \e ePostGlobal
      * - \e eScaleOffset
      * - \e eInactivePre
      * - \e eInactivePost
      * - \e eRotationPivot
      * - \e eScalingPivot
      * - \e eMatrixIndexCount
      */
    enum EMatrixIndex
    {
        ePreGlobal,
        ePreTranslate,
        ePostTranslate,
        ePreRotate,
        ePostRotate,
        ePreScale,
        ePostScale,
        ePostGlobal,
        eScaleOffset,
        eInactivePre,
        eInactivePost,
        eRotationPivot,
        eScalingPivot,
        eMatrixIndexCount
    };

    /** Get the Translation Rotation Scaling source matrix
      * \param pIndex      The matrix ID.
      * \param pMatrix     The matrix used to receive the source matrix.
      */
    void GetSourceMatrix(EMatrixIndex pIndex, FbxAMatrix& pMatrix) const;

    /** Set the Translation Rotation Scaling source matrix.
      * \param pIndex      The matrix ID.
      * \param pMatrix     The matrix used to set the source matrix.
      */
    void SetSourceMatrix(EMatrixIndex pIndex, FbxAMatrix& pMatrix);

    /** Get the Translation Rotation Scaling destination matrix.
      * \param pIndex      The matrix ID.
      * \param pMatrix     The matrix used to receive the destination matrix.
      */
    void GetDestMatrix(EMatrixIndex pIndex, FbxAMatrix& pMatrix) const;

    /** Set the Translation Rotation Scaling destination matrix.
      * \param pIndex      The matrix ID.
      * \param pMatrix     The matrix used to set the destination matrix.
      */
    void SetDestMatrix(EMatrixIndex pIndex, FbxAMatrix& pMatrix);

    /** Get the re-sampling period.
      * \return     the re-sampling period.
      */
    FbxTime GetResamplingPeriod () const;

    /** Set the re-sampling period.
      * \param pResamplingPeriod     The re-sampling period to be set.
      */
    void SetResamplingPeriod (FbxTime& pResamplingPeriod);

    /** Get the current state of the flag which determines if the last key should be generated exactly at the end time or not.
	  * This filter handles 9 animation curves, each of them has a stop time, the latest one is defined as the end time.
      * \return     \c true if last key is set exactly at end time, \c false otherwise.
      */
    bool GetGenerateLastKeyExactlyAtEndTime() const;

    /** Set the flag to determine if the last key will be generated exactly at the end time or not.
	  * This filter handles 9 animation curves, each of them has a stop time, the latest one is defined as the end time.
      * \param pFlag    Set to \c true to generate the last key exactly at the end time, \c false otherwise.
      */
    void SetGenerateLastKeyExactlyAtEndTime(bool pFlag);

    /** Check if re-sampling is on frame rate multiple.
      * \return     \c true if re-sampling is on a frame rate multiple.
      */
    bool GetResamplingOnFrameRateMultiple() const;

    /** Set the re-sample on a frame rate multiple.
      * \param pFlag     The value to be set.
      * \remarks         It might be necessary that the starting time of the converted
      *                  animation starts at an multiple of frame period starting from time 0.
      *                  Most softwares play their animation at a definite frame rate, starting
      *                  from time 0.  As re-sampling occurs when we can't guarantee interpolation,
      *                  keys must match with the moment when the curve is evaluated.
      */
    void SetResamplingOnFrameRateMultiple(bool pFlag);

    /** Get the current state of the ApplyUnroll flag.
      * \return     \c true if the internal unroll filter is applied, \c false otherwise.
	  * \remarks    Enable the internal unroll filter to get continuous rotation animation curves.
	  * \see        FbxAnimCurveFilterUnroll.
      */
    bool GetApplyUnroll() const;

    /** Set the state of the ApplyUnroll flag.
      * \param pFlag     Set to \c true to apply an unroll filter to the rotation curves internally, 
	  * \                set to \c false otherwise.
      */
    void SetApplyUnroll(bool pFlag);

    /** Get the current state of the flag that determines if constant key reducer is used or not.
      * \return     \c true if constant key reducer is applied, \c false otherwise.
      */
    bool GetApplyConstantKeyReducer() const;

    /** Set the state of the flag that determines if constant key reducer is used or not.
      * \param pFlag     Set to \c true to apply the constant key reducer,
      * \                Set to \c false otherwise.
      */
    void SetApplyConstantKeyReducer(bool pFlag);

    /** Get the current state of the flag that determines if the translation data should be re-sampled or not.
      * \return      \c true if translation data is re-sampled upon conversion, \c false otherwise.
      * \remarks     If this flag is \c false, translation data must be calculated
      *              after the conversion process, overriding the re-sampling process.
      */
    bool GetResampleTranslation() const;

    /** Set the state of the flag that determines if the translation data should be re-sampled or not.
      * \param pFlag     Set to \c true to re-sample the translation data, set to \c false otherwise.
      * \remarks         If this flag is set to \c false, translation data must be calculated
      *                  after the conversion process, overriding the re-sampling process.
      */
    void SetResampleTranslation(bool pFlag);

    /** Set the rotation order of the source matrix.
      * \param pOrder     The rotation order to be set.
      */
    void SetSrcRotateOrder(FbxEuler::EOrder pOrder);

    /** Set the rotation order of the destination matrix.
      * \param pOrder     The rotation order to be set.
      */
    void SetDestRotateOrder(FbxEuler::EOrder pOrder);

    /** Set the state of the flag to force usage of the filter even if source and destination matrices are equivalent.
      * \param pVal     Set to \c true to force usage of the filter, set to \c false otherwise.
      */
    void SetForceApply(bool pVal);

    /** Get the current state of the flag to force usage of the filter even if source and destination matrices are equivalent.
      * \return     \c true to force usage of the filter, \c false otherwise.
      */
    bool GetForceApply() const;

    /** Set the Translation limits to be applied during conversion. Only active limits are applied.
      * \param limit     The rotation limit to be set.
      */
    void SetTranslationLimits(FbxLimits &limit );

    /** Set the rotation limits to be applied during conversion. Only active limits are applied.
      * \param limit     The rotation limit to be set.
      */
    void SetRotationLimits(FbxLimits &limit );

    /** Set the scaling limits to be applied during conversion. Only active limits are applied.
      * \param limit     The scaling limit to be set.
      */
    void SetScalingLimits(FbxLimits &limit );

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
private:
    // Nicer than referring to 0, 1, 2...
    enum EAxisIndex {eX, eY, eZ, eAxisCount};
		
	// Convert parameter cell.
    class Cell;
    
    bool MatricesEquivalence(FbxAMatrix pMatArrayA [eMatrixIndexCount], FbxAMatrix pMatArrayB [eMatrixIndexCount]) const;

    bool DoConvert(FbxAnimCurve** pCurve, 
                    double pT[eAxisCount], 
                    double pR[eAxisCount], 
                    double pS[eAxisCount]);

    void FindTimeInterval
    (
        FbxTime& pStart, 
        FbxTime& pEnd,
        FbxAnimCurve* pTFCurve [eAxisCount], 
        FbxAnimCurve* pRFCurve [eAxisCount], 
        FbxAnimCurve* pSFCurve [eAxisCount]
    );

    void ComputeTotalMatrix
    (
        FbxAMatrix& pGlobal, 
        Cell& pCell,
        FbxAMatrix& pTranslate,
        FbxAMatrix& pRotate,
        FbxAMatrix& pScale
	);

    void ExtractTransforms
    (
        FbxVector4& pScaleVector,
        FbxVector4& pRotateVector,
        FbxVector4& pTranslateVector,
        FbxAMatrix& pGlobal,
        Cell& pDest
    );

    void SetDestFCurve(FbxAnimCurve* pCurve [eAxisCount], 
                       int pIndex, 
                       FbxTime pTime, 
                       FbxVector4 pVector,
                       FbxAnimCurveDef::EInterpolationType pInterpMode[eAxisCount], 
                       FbxAnimCurveDef::ETangentMode pTangentMode[eAxisCount]);

    void FillInterpAndTangeant(FbxTime& pTime, 
                               FbxAnimCurve* pSourceCurve[eAxisCount], 
                               FbxAnimCurveDef::EInterpolationType* pInterp, 
                               FbxAnimCurveDef::ETangentMode* pTangeant);

    void SetDestFCurveTangeant(FbxAnimCurve* pCurve [eAxisCount], 
                               int pIndex, 
                               FbxAnimCurveDef::ETangentMode pTangentMode[eAxisCount], 
                               FbxVector4 pKeyValue, 
                               FbxVector4 pNextKeyValue);

    Cell* mSource;
    Cell* mDest;

    FbxTime mResamplingPeriod;
    bool mResamplingOnFrameRateMultiple;

    bool mApplyUnroll;
    bool mApplyConstantKeyReducer;

    // PP : So that the concatenation of matrices takes into account the rotation order
    FbxRotationOrder* mSrcRotationOrder;
    FbxRotationOrder* mDestRotationOrder;

    // Set last key exactly at end time or a frame period later.	
    bool mGenerateLastKeyExactlyAtEndTime;

    // Translation re-sampling flag.
    bool mResampleTranslation;

    // Force Apply
    bool mForceApply;

    // Limits
    FbxLimits mTranslationLimits;
    FbxLimits mRotationLimits;
    FbxLimits mScalingLimits;

    // internal usage
    FbxAnimCurveNode* mRotationCurveNode;
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_SCENE_ANIMATION_CURVE_FILTERS_H_ */
