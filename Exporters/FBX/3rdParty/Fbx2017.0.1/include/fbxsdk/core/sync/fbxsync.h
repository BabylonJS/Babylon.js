/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxsync.h
#ifndef _FBXSDK_CORE_SYNC_H_
#define _FBXSDK_CORE_SYNC_H_

#include <fbxsdk/fbxsdk_def.h>

#if !defined(FBXSDK_ENV_WINSTORE) && !defined(FBXSDK_ENV_EMSCRIPTEN)

#include <fbxsdk/core/sync/fbxclock.h>
#include <fbxsdk/core/sync/fbxthread.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

class FbxMutexImpl;
class FbxSemaphoreImpl;
class FbxGateImpl;

/** A spinlock is the fastest and most simple thread lock mechanism available.
  * It is very efficient since it does not use any operating system calls; it is only a test and set on an atomic variable,
  * thus it is the fastest thread lock available. Spinlocks are efficient if threads are only likely to be blocked for a
  * short period of time, as they avoid overhead from operating system process re-scheduling or context switching. However,
  * spinlocks become wasteful if held for longer durations, both preventing other threads from running and requiring
  * re-scheduling.
  * \note Spinlocks does not support recursive locking. A thread attempting to lock the same spinlock twice will wait
  * indefinitely.
  */
class FBXSDK_DLL FbxSpinLock
{
public:
    FbxSpinLock();

	/** Acquire the lock; thread will wait indefinitely until it is available. */
    void Acquire();

	/** Release the lock; this will allow other threads to acquire the lock if they are waiting. */
    void Release();

private:
    FbxAtomic mSpinLock;
};

/** Mutually excluding thread lock mechanism.
  *	While the mutex is a much heavier implementation than a spinlock, it supports recursive locking; the same thread
  * can safely lock the same mutex more than once without blocking. But it will have to be released as many times as
  * it as been acquired before other threads can acquire the context. It is sometimes referred as a critical section.
  * This is the heaviest thread lock implementation, but also the most secure.
  */
class FBXSDK_DLL FbxMutex
{
public:
	/** Constructor
	  * \param pInitialOwnership If pInitialOwnership is true, the lock will be initialized as being locked by the
	  * current thread.
	  */
	FbxMutex(bool pInitialOwnership=false);
	virtual ~FbxMutex(); //!< Destructor

	/** Acquire the lock; thread will wait indefinitely until it is available.
	  * \remarks The same thread can acquire the lock multiple times without blocking.
	  */
	void Acquire();

	/** Try acquiring the lock; thread will not wait if it is not available.
	  * \param pRetryCount The number of retries in case the lock is not available.
	  * \return True if the lock is acquired, false otherwise.
	  * \remarks The same thread can acquire the lock multiple times without blocking.
	  */
	bool TryAcquire(unsigned int pRetryCount);

	/** Release the lock; this will allow other threads to acquire the lock if they are waiting.
	  * \remarks Only the owner thread should call Release(), and it needs to be released as many times as it was
	  * acquired.
	  */
	void Release();

private:
	FbxMutexImpl* mImpl;
};

/** Mutually excluding thread waiting mechanism with a counter.
  * Semaphore are generally used in situations when the current thread needs to wait for other threads before
  * proceeding to the next step. In other words, that thread waits a number of signals from other threads. This
  * is the best mechanism to use to synchronize threads since it doesn't require an heavy critical section.
  */
class FBXSDK_DLL FbxSemaphore
{
public:
	FbxSemaphore(); //!< Constructor
	virtual ~FbxSemaphore(); //!< Destructor

	/** Wait indefinitely until the semaphore as been signaled as many times as specified.
	  * \param pCount Number of signal to wait before this function returns.
	  * \return True if the wait exit without errors.
	  * \remarks If pCount is set to zero, this function returns immediately without waiting.
	  */
	bool Wait(unsigned int pCount=1);

	/** Signal the semaphore as many times as specified.
	  * \param pCount The number of signal to send to the semaphore.
	  * \return True if the semaphore was signaled without errors.
	  */
	bool Signal(unsigned int pCount=1);

private:
	FbxSemaphoreImpl* mImpl;
};

/** A gate thread locking mechanism is very similar to a semaphore, except that when it is opened, any
  * further call to wait will not wait until it is closed. It is generally used to block multiple threads
  * until one of them open the gate to release them all.
  */
class FBXSDK_DLL FbxGate
{
public:
    FbxGate(); //!< Constructor
    virtual ~FbxGate(); //!< Destructor

	/** Open the gate to release all threads waiting.
	  * \remarks All waiting threads will unblock until the gate is closed.
	  */
    void Open();

	/** Close the gate so that the next time a thread call Wait() it will be blocked. */
    void Close();

	/** Check if the gate is open.
	  * \return True if the gate is open, otherwise false.
	  */
    bool IsOpen();

	/** Wait indefinitely until the gate open.
	  * \return True if the wait completed without errors.
	  * \remarks If the gate is already open, this function returns immediately.
	  */
    bool Wait();

private:
	FbxGateImpl* mImpl;
};

/** A simple stack of linked items that is multi-thread safe, protected by a spinlock.
  */
class FBXSDK_DLL FbxSyncStack
{
public:
	//! A single link item to be used to construct the stack
	struct Item
	{
		Item* mNext;
		inline Item(){ mNext = NULL; }
		inline Item* Set(Item* pNext){ return mNext = pNext; }
		inline Item* Next(){ return mNext; }
	};

	//! Constructor
	FbxSyncStack();

	/** Add an item on the top of the stack.
	  * \param pItem The item to add on top of the stack.
	  */
	void Push(Item* pItem);

	/** Remove the item on the top of the stack.
	  * \return Returns the item on top of the stack, otherwise NULL if stack empty.
	  */
	Item* Pop();

private:
	FbxSpinLock	mLock;
	Item*		mTop;
};

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* !FBXSDK_ENV_WINSTORE && !FBXSDK_ENV_EMSCRIPTEN */

#endif /* _FBXSDK_CORE_SYNC_H_ */
