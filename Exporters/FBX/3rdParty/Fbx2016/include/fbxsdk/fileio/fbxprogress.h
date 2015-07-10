/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxprogress.h
#ifndef _FBXSDK_FILEIO_PROGRESS_H_
#define _FBXSDK_FILEIO_PROGRESS_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/core/base/fbxstring.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

typedef bool (*FbxProgressCallback)(void* pArgs, float pPercentage, const char* pStatus);

#if !defined(FBXSDK_ENV_WINSTORE) && !defined(FBXSDK_ENV_EMSCRIPTEN) 
	class FbxSpinLock;
#endif

/** Class for progress reporting
* \nosubgrouping
*/
class FBXSDK_DLL FbxProgress
{
public:
	/** Register a callback function for progress reporting in single thread mode.
	* \param pCallback Pointer of the callback function.
	* \param pArgs Pointer to the optional arguments passed to the callback function. */
	void SetProgressCallback(FbxProgressCallback pCallback, void* pArgs=NULL);

	/** Set the total amount of workload needed to complete the progress.
	* \param pTotal Total amount of workload.
	* \remark The default total is 100.0. */
	void SetTotal(float pTotal);

	/** Set the threshold at which the progress callback should be called.
	* \param pThreshold The threshold value, between 0.0 and 100.0, that triggers the callback.
	* \remark The default threshold is 1.0, meaning that every 1% the callback is triggered. */
	void SetThreshold(float pThreshold);

	/** Update current progress with recent workload.
	* \param pDelta Delta amount of workload progressed so far.
	* \param pStatus Optional current progress status string.
	* \remark If a callback is set, it will be called upon caling this function. */
	void Update(float pDelta, const char* pStatus=NULL);

	//! Reset the progress status percentage and status string.
	void Reset();

	/** Retrieve the progress status.
	* \param pStatus Optional current progress status string.
	* \return The current progress percentage. */
	float GetProgress(FbxString* pStatus=NULL);

	/** Set the progress status to completed.
	* \param pStatus Optional current progress status string. */
	void Complete(const char* pStatus=NULL);

	//! Cancel this progress.
	void Cancel();

	//! Query whether user canceled this progress.
	inline bool IsCanceled() const { return mCanceled; }

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
	FbxProgress();
	~FbxProgress();

private:
	void Acquire();
	void Release();
	float GetPercent() const;
	bool ExecuteCallback() const;

#if !defined(FBXSDK_ENV_WINSTORE) && !defined(FBXSDK_ENV_EMSCRIPTEN)
    FbxSpinLock*		mLock;
#endif
    float				mCurrent;
    float				mPrevious;
    float				mTotal;
    float				mThreshold;
    FbxString			mStatus;
    FbxProgressCallback	mCallback;
	void*				mCallbackArgs;
    bool				mCanceled;
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_FILEIO_PROGRESS_H_ */
