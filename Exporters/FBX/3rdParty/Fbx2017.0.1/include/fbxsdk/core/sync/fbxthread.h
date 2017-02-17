/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxthread.h
#ifndef _FBXSDK_CORE_SYNC_THREAD_H_
#define _FBXSDK_CORE_SYNC_THREAD_H_

#include <fbxsdk/fbxsdk_def.h>

#if !defined(FBXSDK_ENV_WINSTORE) && !defined(FBXSDK_ENV_EMSCRIPTEN)

#include <fbxsdk/fbxsdk_nsbegin.h>

class FbxThreadImpl;

//! Definition of a thread procedure function signature.
typedef void (*FbxThreadProc)(void*);

/** This class implement a standard way to use threads across platforms.
  */
class FBXSDK_DLL FbxThread
{
public:
	enum EState {eUnknown, eRunning, eDead};
	enum EPriority {eNone, eIdle, eLowest, eLow, eNormal, eHigh, eHighest, eRealTime};

	/** Constructor
	  * \param pProc The procedure called upon thread startup.
	  * \param pArg The arguments passed to the procedure.
	  * \param pSuspend Start the thread suspended.
	  */
	FbxThread(FbxThreadProc pProc, void* pArg, bool pSuspend=false);

	/** Constructor
	  * \param pProc The procedure called upon thread startup.
	  * \param pArg The arguments passed to the procedure.
	  * \param pPriority The thread priority to set upon creation.
	  * \param pSuspend Start the thread suspended.
	  */
	FbxThread(FbxThreadProc pProc, void* pArg, EPriority pPriority, bool pSuspend=false);

	//! Destructor
	virtual ~FbxThread();

	/** Suspend the execution of the thread.
	  * \return Return true if the thread was successfully suspended, otherwise false.
	  * \remarks It should be used only if you can control where the thread will be suspended in its procedure,
	  * otherwise the state of the thread and its memory is unknown, since the code will stop anywhere.
	  */
	bool Suspend();

	/** Resume the execution of the thread.
	  * \return Return true if the thread was successfully resumed, otherwise false.
	  */
	bool Resume();

	/** Wait for the thread completion.
	  * \return True if the thread successfully returned from its procedure.
	  */
	bool Join();

	/** Do not wait for the thread completion and terminate it.
	  * \return True if the thread successfully died.
	  */
	bool Kill();

	/** Retrieve the priority of the thread.
	  * \return The thread's priority.
	  */
	EPriority GetPriority();

	/** Set the thread priority.
	  * \param pPriority The priority to set to this thread.
	  * \return True if the thread priority was successfully changed.
	  */
	bool SetPriority(EPriority pPriority);

	/** Retrieve the thread current state.
	  * \return The state of the thread.
	  */
	EState GetState();

private:
	FbxThreadImpl* mImpl;
};

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* !FBXSDK_ENV_WINSTORE && !FBXSDK_ENV_EMSCRIPTEN */

#endif /* _FBXSDK_CORE_SYNC_THREAD_H_ */
