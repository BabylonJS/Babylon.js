/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxanimcurvebase.h
#ifndef _FBXSDK_SCENE_ANIMATION_CURVE_BASE_H_
#define _FBXSDK_SCENE_ANIMATION_CURVE_BASE_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/core/fbxobject.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

class FbxIO;

/** This is the base class interface for the FBX animation curve keys.
  * \nosubgrouping
  *
  * \remarks For an example of implemented class, please see FbxAnimCurveKey.
  */
class FBXSDK_DLL FbxAnimCurveKeyBase
{
public:
    /** Data member representing time value.
    */
    FbxTime mTime;

    /** Constructor.
    */
    FbxAnimCurveKeyBase()
    {
        mTime = FBXSDK_TIME_ZERO;
    }

    /** Destructor.
    */
    virtual ~FbxAnimCurveKeyBase() {};

    /** Get time value.
    * \return Time value.
    */
    virtual FbxTime GetTime() const
	{
		return mTime;
	}

    /** Set time value.
    * \param pTime Time value to set.
    */
    virtual void  SetTime(const FbxTime& pTime) {
		mTime = pTime;
	}
};

/** This is the base class for implementing animation curves.
  * \nosubgrouping
  * It is a pure virtual class that defines the general interface to animation
  * key management and manipulation.
  *
  * \see FbxAnimCurve for fully implemented class.
  */
class FBXSDK_DLL FbxAnimCurveBase : public FbxObject
{
    FBXSDK_ABSTRACT_OBJECT_DECLARE(FbxAnimCurveBase, FbxObject);

public:
    /**
      * \name Key management.
      *
      */
    //@{
        //! Remove all the keys and free buffer memory.
        virtual void KeyClear () = 0;
        
        //! Get the number of keys.
        virtual int KeyGetCount () const = 0;

        /** Add a key at given time.
          * \param pTime Time to add the key.
          * \param pKey Key to add.
          * \param pLast Index of the last processed key to speed up search. If this 
          *              function is called in a loop, initialize this value to 0 and let it 
          *              be updated by each call.
          * \return Index of the key at given time, no matter if it was added 
          *         or already present.
          */
        virtual int KeyAdd (FbxTime pTime, FbxAnimCurveKeyBase& pKey, int* pLast = NULL) = 0;

        /** Set key at given index.
          * \param pIndex Index of where the key should be set.
          * \param pKey The key to set.
          * \return \c true if key time is superior to previous key and inferior 
          *         to next key, \c false otherwise.
          * \remarks Result is undetermined if function curve has no key or index 
          *          is out of bounds.
          */
        virtual bool KeySet(int pIndex, FbxAnimCurveKeyBase& pKey) = 0;

        /** Remove key at given index.
          * \param pIndex Index of key to remove.
		  *	\return \c true on success, \c false otherwise.
          */
        virtual bool KeyRemove(int pIndex) = 0;

        /** Remove all the keys in the given range.
          * \param pStartIndex Index of the first key to remove (inclusive).
          * \param pEndIndex Index of the last key to remove (inclusive).
		  *	\return \c true on success, \c false otherwise.
          */
        virtual bool KeyRemove(int pStartIndex, int pEndIndex) = 0;

    //@}

    /**
    * \name Key Time Manipulation
    */
    //@{
        /** Get key time.
          * \param pKeyIndex Key index.
          * \return Key time (time at which this key is occurring).
          */
        virtual FbxTime KeyGetTime(int /*pKeyIndex*/) const { return FBXSDK_TIME_INFINITE; }

        /** Set key time.
          * \param pKeyIndex Key index.
          * \param pTime Key time (time at which this key is occurring).
          */
        virtual void KeySetTime(int pKeyIndex, FbxTime pTime) = 0;

    //@}

    /**
    * \name Extrapolation 
    * Extrapolation defines the function curve value before and after the keys.
    * Pre-extrapolation defines the function curve value before first key.
    * Post-extrapolation defines the function curve value after last key.
    * <ul><li>CONSTANT means a constant value matching the first/last key.
    *     <li>REPETITION means the entire function curve is looped.
    *     <li>MIRROR_REPETITION means the entire function curve is looped once backward, once forward and so on. 
    *     <li>KEEP_SLOPE means a linear function with a slope matching the first/last key.
    *     <li>RELATIVE_REPETITION means entire function curve is looped and one loop is relative to the last loop in value.</ul>
    */
    //@{
        enum EExtrapolationType
		{
            eConstant = 1,
            eRepetition = 2,
            eMirrorRepetition = 3,
            eKeepSlope = 4,
            eRelativeRepetition = 5
        } ;

        /** Set pre-extrapolation mode.
          * \param pExtrapolation The pre-extrapolation mode to set.
          */
        void SetPreExtrapolation(EExtrapolationType pExtrapolation);
            
        /** Get pre-extrapolation mode.
          * \return The current pre-extrapolation mode.
          */
        EExtrapolationType GetPreExtrapolation() const { return mPreExtrapolation; }
        
        /** Set pre-extrapolation count.
          * \param pCount Number of repetitions if pre-extrapolation mode is
          *       REPETITION or MIRROR_REPETITION.
          */
        void SetPreExtrapolationCount(unsigned long pCount);
        
        /** Get pre-extrapolation count.
          * \return Number of repetitions if pre-extrapolation mode is
          *         REPETITION or MIRROR_REPETITION.
          */
        unsigned long GetPreExtrapolationCount() const { return mPreExtrapolationCount; }
        
        /** Set post-extrapolation mode.
          * \param pExtrapolation The post-extrapolation mode to set.
          */
        void SetPostExtrapolation(EExtrapolationType pExtrapolation);
        
        /** Get post-extrapolation mode.
          * \return The current post-extrapolation mode.
          */
        EExtrapolationType GetPostExtrapolation() const { return mPostExtrapolation; }
        
        /** Set post-extrapolation count.
          * \param pCount Number of repetitions if post-extrapolation mode is
          *               REPETITION or MIRROR_REPETITION.
          */
        void SetPostExtrapolationCount(unsigned long pCount);
            
        /** Get post-extrapolation count.
          * \return Number of repetitions if post-extrapolation mode is
          *         REPETITION or MIRROR_REPETITION.
          */
        unsigned long GetPostExtrapolationCount() const { return mPostExtrapolationCount; }
    //@}

    /**
      * \name Evaluation and Analysis
      */
    //@{
        /** Evaluate curve value at a given time.
          * \param pTime Time of evaluation.
          * \param pLast Index of the last processed key to speed up search. If this 
          *              function is called in a loop, initialize this value to 0 and let it 
          *              be updated by each call.
          * \return Evaluated curve value.
          * \remarks This function take extrapolation into account.
          */
          virtual float Evaluate (FbxTime pTime, int* pLast = NULL) = 0;

        /** Evaluate curve value at the given key index.
          * \param pIndex Any value from 0 to KeyGetCount() - 1.
          *               If this index falls between keys, the curve value will
          *               be interpolated based on the surrounding keys.
          * \return Evaluated curve value.
          */
        virtual float EvaluateIndex( double pIndex) = 0;
    //@}

    /**
      * \name Utility functions.
      *
      */
    //@{
        /** Find out start and end time of the animation curve.
          * This function retrieves the Curve's time span.
          * \param pTimeInterval Reference to receive start time and end time.
          * \return \c true on success, \c false otherwise.
          */
        virtual bool GetTimeInterval(FbxTimeSpan& pTimeInterval);
    //@}

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
    virtual FbxObject& Copy(const FbxObject& pObject);
    virtual bool Store(FbxIO* pFileObject, bool pLegacyVersion=false) = 0;
    virtual bool Retrieve(FbxIO* pFileObject) = 0;
	virtual void ExtrapolationSyncCallback() = 0;

protected:
	virtual void Construct(const FbxObject* pFrom);

private:
    EExtrapolationType mPreExtrapolation;
    unsigned long      mPreExtrapolationCount;
    EExtrapolationType mPostExtrapolation;
    unsigned long      mPostExtrapolationCount;
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};

#include <fbxsdk/fbxsdk_nsend.h>

#endif // FBXFILESDK_KFBXPLUGINS_KFBXANIMCURVEBASE_H
