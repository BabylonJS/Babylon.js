/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxclock.h
#ifndef _FBXSDK_CORE_SYNC_CLOCK_H_
#define _FBXSDK_CORE_SYNC_CLOCK_H_

#include <fbxsdk/fbxsdk_def.h>

#ifndef FBXSDK_ENV_WINSTORE

#include <fbxsdk/fbxsdk_nsbegin.h>

/** Put the current thread to sleep.
  * \param pMilliseconds The duration of the sleep in milli-seconds.
  */
FBXSDK_DLL void FbxSleep(int pMilliseconds);

/** Retrieves the current value of the high-resolution performance counter.
  * \return The current value of the high-resolution performance counter, in "counts".
  * \remarks To convert "counts" into time, divide it by the frequency available from FbxGetHighResFrequency().
  */
FBXSDK_DLL FbxLongLong FbxGetHighResCounter();

/** Retrieves the frequency of the high-resolution performance counter.
  * \return The frequency of the high-resolution performance counter value, in "counts" per second.
  * \remarks The first time this function is called, the frequency is queried from the system and then cached
  * so that further requests are fast. This means it is guaranteed to not change during run-time.
  */
FBXSDK_DLL FbxLongLong FbxGetHighResFrequency();

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* !FBXSDK_ENV_WINSTORE */

#endif /* _FBXSDK_CORE_SYNC_CLOCK_H_ */
