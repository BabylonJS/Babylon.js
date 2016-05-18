/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxanimstack.h
#ifndef _FBXSDK_SCENE_ANIMATION_STACK_H_
#define _FBXSDK_SCENE_ANIMATION_STACK_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/core/base/fbxtime.h>
#include <fbxsdk/scene/fbxcollection.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

// these symbols are defined for backward compatibility
#define FBXSDK_TAKENODE_DEFAULT_NAME	"Default"
#define FBXSDK_ROOTCURVE_DEFAULT_NAME	"Defaults"

class FbxTakeInfo;
class FbxThumbnail;
class FbxAnimEvaluator;

/** The Animation stack is a collection of animation layers. The Fbx document can have one or 
  * more animation stacks. Each stack can be viewed as one "take" in the previous versions of the FBX SDK. 
  * The "stack" terminology comes from the fact that the object contains 1 to n animation layers that 
  * are evaluated according to their blending modes to produce a resulting animation for a given attribute.
  * \nosubgrouping
  */
class FBXSDK_DLL FbxAnimStack : public FbxCollection
{
    FBXSDK_OBJECT_DECLARE(FbxAnimStack, FbxCollection);

public:
    //////////////////////////////////////////////////////////////////////////
    //
    // Properties
    //
    //////////////////////////////////////////////////////////////////////////
    /** This property stores a description string of this animation stack.
      * This string can be used to display, in a human readable format, information 
      * relative to this animation stack object. 
      * Default value is "".
      * \remarks The applications using the FBX SDK are not required to manipulate this information.
      */
    FbxPropertyT<FbxString> Description;

    /** This property stores the local time span "Start" time.
      * This "start" time should be seen as a time marker. Typically it would represent the whole animation
      * starting time but its use (and update) is left to the calling application (with one exception occurring
      * in the BakeLayers). The FBX SDK does not use this value internally and only guarantees that it will be stored 
      * to the FBX file and retrieved from it. 
      *
      * Default value is 0.
      */
    FbxPropertyT<FbxTime> LocalStart;

    /** This property stores the local time span "Stop" time.
      * This "stop" time should be seen as a time marker. Typically it would represent the whole animation
      * ending time but its use (and update) is left to the calling application (with one exception occurring 
      * in the BakeLayers). The FBX SDK does not use this value internally and only guarantees that it will be stored 
      * to the FBX file and retrieved from it. 
      *
      * Default value is 0
      */
    FbxPropertyT<FbxTime> LocalStop;

    /** This property stores the reference time span "Start" time.
      * This reference start time is another time marker that can be used by the calling application. The FBX SDK 
      * never uses it and only guarantees that this value is stored in the FBX file and retrieved from it. 
      *
      * Default value is 0
      */
    FbxPropertyT<FbxTime> ReferenceStart;

    /** This property stores the reference time span "Stop" time.
      * This reference stop time is another time marker that can be used by the calling application. The FBX SDK 
      * never uses it and only guarantees that this value is stored in the FBX file and retrieved from it. 
      *
      * Default value is 0
      */
    FbxPropertyT<FbxTime> ReferenceStop;
  
    /** Reset the object time spans either to their default values or from the pTakeInfo structure, if provided.
      * \param pTakeInfo The take info to be used during reset.
      */
    void Reset(const FbxTakeInfo* pTakeInfo = NULL);

    /**
      * \name Utility functions.
      *
      */
    //@{
        /** Get the LocalStart and LocalStop time properties as a FbxTimeSpan.
          * \return The current local time span.
          */
        FbxTimeSpan GetLocalTimeSpan() const;

        /** Set the LocalStart and LocalStop time properties from a FbxTimeSpan.
          * \param pTimeSpan The new local time span.
          */
        void SetLocalTimeSpan(FbxTimeSpan& pTimeSpan);

        /** Get the ReferenceStart and ReferenceStop time properties as a FbxTimeSpan.
          * \return The current reference time span.
          */
        FbxTimeSpan GetReferenceTimeSpan() const;

        /** Set the ReferenceStart and ReferenceStop time properties from a FbxTimeSpan.
          * \param pTimeSpan The new reference time span.
          */
        void SetReferenceTimeSpan(FbxTimeSpan& pTimeSpan);

        /** Bake all the animation layers on the base layer.
          * This function will process all the properties on every animation layer and generate a re-sampled set of
          * animation keys (representing the layers' evaluated result) on the base layer. Once this operation is completed
          * successfully, all the layers (except the base one) are destroyed. Properties that are only defined on the base 
          * layer will remain unaffected by the re-sampling. The stack local timespan is updated with the overall animation range.
          * 
          * \param pEvaluator The layer evaluator. This is the engine that evaluates the overall result of any given
          *                   property according to the layers flags.
          * \param pStart   The start time of the re-sampling range.
          * \param pStop    The stop time of the re-sampling range.
          * \param pPeriod  The time increment for the re-sampling.
          * \return \c true if the operation was successful and \c false in case of errors.
          * \remarks If this AnimStack contains only one AnimLayer, the function will return false and do nothing.
          */
        bool BakeLayers(FbxAnimEvaluator* pEvaluator, FbxTime pStart, FbxTime pStop, FbxTime pPeriod);
    //@}

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
protected:
    virtual void ConstructProperties(bool pForceSet);
	virtual void Destruct(bool pRecursive);
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_SCENE_ANIMATION_STACK_H_ */
