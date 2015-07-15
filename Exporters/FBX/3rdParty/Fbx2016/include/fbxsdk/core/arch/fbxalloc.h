/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

/** \file fbxalloc.h
  * Allocation functions definition.
  *
  * It is possible to override memory allocation functions throughout the FBX SDK by
  * providing system memory allocation functions using the handler set functions below.
  * The Microsoft Windows implementation in debug mode allows to specify where the
  * allocations happen by providing the standard block type, file name and line number.
  */
#ifndef _FBXSDK_CORE_ARCH_ALLOC_H_
#define _FBXSDK_CORE_ARCH_ALLOC_H_

#include <fbxsdk/fbxsdk_def.h>

#if defined(_DEBUG) && defined(FBXSDK_ENV_WIN)
	#include <crtdbg.h>
#endif

#if defined(FBXSDK_ENV_MAC)
	#include <malloc/malloc.h>
#else
	#include <malloc.h>
#endif

#include <fbxsdk/fbxsdk_nsbegin.h>

#if defined(FBXSDK_CPU_32) && !defined(FBXSDK_ENV_IOS)
	#define FBXSDK_MEMORY_ALIGNMENT ((size_t)8U)
#else
	#define FBXSDK_MEMORY_ALIGNMENT ((size_t)16U)
#endif

#define FBXSDK_MEMORY_COPY(dst, src, size) {memcpy(dst,src,size);}

typedef void*	(*FbxMallocProc)(size_t);			//! Function pointer signature used to replace "malloc"
typedef void*	(*FbxCallocProc)(size_t, size_t);	//! Function pointer signature used to replace "calloc"
typedef void*	(*FbxReallocProc)(void*, size_t);	//! Function pointer signature used to replace "realloc"
typedef void	(*FbxFreeProc)(void*);				//! Function pointer signature used to replace "free"

/** Set the global memory allocation function used internally by the FBX SDK.
* \param pHandler Function pointer that implements the necessary procedure to allocate memory in the system. */
FBXSDK_DLL void FbxSetMallocHandler(FbxMallocProc pHandler);

/** Set the global zero'd memory allocation function used internally by the FBX SDK.
* \param pHandler Function pointer that implements the necessary procedure to allocate zero'd memory in the system. */
FBXSDK_DLL void FbxSetCallocHandler(FbxCallocProc pHandler);

/** Set the global memory re-allocation function used internally by the FBX SDK.
* \param pHandler Function pointer that implements the necessary procedure to re-allocate memory in the system. */
FBXSDK_DLL void FbxSetReallocHandler(FbxReallocProc pHandler);

/** Set the global memory freeing function used internally by the FBX SDK.
* \param pHandler Function pointer that implements the necessary procedure to free memory in the system. */
FBXSDK_DLL void FbxSetFreeHandler(FbxFreeProc pHandler);

/** Get the global memory allocation function used internally by the FBX SDK.
* \return pHandler Function pointer on FBX's internal malloc */
FBXSDK_DLL FbxMallocProc FbxGetMallocHandler();

/** Get the global zero'd memory allocation function used internally by the FBX SDK.
* \return pHandler Function pointer on FBX's internal calloc */
FBXSDK_DLL FbxCallocProc FbxGetCallocHandler();

/** Get the global memory re-allocation function used internally by the FBX SDK.
* \return pHandler Function pointer on FBX's internal realloc */
FBXSDK_DLL FbxReallocProc FbxGetReallocHandler();

/** Get the global memory freeing function used internally by the FBX SDK.
* \return pHandler Function pointer on FBX's internal free */
FBXSDK_DLL FbxFreeProc FbxGetFreeHandler();

/** Get the default global memory allocation function used internally by the FBX SDK.
* \return pHandler Function pointer on FBX's internal malloc */
FBXSDK_DLL FbxMallocProc FbxGetDefaultMallocHandler();

/** Get the default global zero'd memory allocation function used internally by the FBX SDK.
* \return pHandler Function pointer on FBX's internal calloc */
FBXSDK_DLL FbxCallocProc FbxGetDefaultCallocHandler();

/** Get the default global memory re-allocation function used internally by the FBX SDK.
* \return pHandler Function pointer on FBX's internal realloc */
FBXSDK_DLL FbxReallocProc FbxGetDefaultReallocHandler();

/** Get the default global memory freeing function used internally by the FBX SDK.
* \return pHandler Function pointer on FBX's internal free */
FBXSDK_DLL FbxFreeProc FbxGetDefaultFreeHandler();

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
	FBXSDK_DLL void* FbxMalloc(size_t pSize);
	FBXSDK_DLL void* FbxCalloc(size_t pCount, size_t pSize);
	FBXSDK_DLL void* FbxRealloc(void* pData, size_t pSize);
	FBXSDK_DLL void FbxFree(void* pData);
	FBXSDK_DLL char* FbxStrDup(const char* pString);
	FBXSDK_DLL wchar_t* FbxStrDupWC(const wchar_t* pString);

	//These versions of allocators use the default system mallocs, and on Windows we also pass the debugging parameters.
	//If you define FBXSDK_ALLOC_DEBUG in your project, the FBX SDK will use these debug versions everywhere.
	FBXSDK_DLL void* FbxMallocDebug(size_t pSize, int pBlock, const char* pFile, int pLine);
	FBXSDK_DLL void* FbxCallocDebug(size_t pCount, size_t pSize, int pBlock, const char* pFile, int pLine);
	FBXSDK_DLL void* FbxReallocDebug(void* pData, size_t pSize, int pBlock, const char* pFile, int pLine);
	FBXSDK_DLL void FbxFreeDebug(void* pData, int pBlock);

	//When FBXSDK_ALLOC_DEBUG is defined, redirect allocation calls to the debug version.
	#if defined(FBXSDK_ALLOC_DEBUG)
		#define FbxMalloc(s) FbxMallocDebug(s, _NORMAL_BLOCK, __FILE__, __LINE__)
		#define FbxCalloc(c, s) FbxCallocDebug(c, s, _NORMAL_BLOCK, __FILE__, __LINE__)
		#define FbxRealloc(p, s) FbxReallocDebug(p, s, _NORMAL_BLOCK, __FILE__, __LINE__)
		#define FbxFree(p) FbxFreeDebug(p, _NORMAL_BLOCK)
	#endif
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/

//! Deletion policy for pointer template classes that uses the delete operator.
template <class Type> class FbxDeletionPolicyDefault
{
public:
	//! Destruction policy implementation.
	static inline void DeleteIt(Type** pPtr)
	{
		if( *pPtr )
		{
			delete *pPtr;
			*pPtr = NULL;
		}
	}
};

//! Deletion policy for pointer template classes that uses the FbxDelete() function.
template<typename T> void FbxDelete(T* p);
template<typename T> void FbxDelete(const T* p);
template <class Type> class FbxDeletionPolicyDelete
{
public:
	//! Destruction policy implementation.
	static inline void DeleteIt(Type** mPtr)
	{
		if( *mPtr )
		{
			FbxDelete(*mPtr);
			*mPtr = NULL;
		}
	}
};

//! Deletion policy for pointer template classes that uses the FbxFree() function.
template <class Type> class FbxDeletionPolicyFree
{
public:
	//! Destruction policy implementation.
	static inline void DeleteIt(Type** pPtr)
	{
		if( *pPtr )
		{
			FbxFree(*pPtr);
			*pPtr = NULL;
		}
	}
};

//! Deletion policy for pointer template classes that uses the Destroy() function.
template <class Type> class FbxDeletionPolicyObject
{
public:
	//! Destruction policy implementation.
	static inline void DeleteIt(Type** pPtr)
	{
		if( *pPtr )
		{
			(*pPtr)->Destroy();
			*pPtr = NULL;
		}
	}
};

/** FbxAutoPtr mimics the \c auto_ptr class template implementation available in the C++ Standard Library. The \c auto_ptr template
* class describes an object that stores a pointer to a single allocated object of type Type* that ensures that the object to which
* it points gets destroyed automatically when control leaves a scope. */
template<class Type, class Policy=FbxDeletionPolicyDefault<Type> > class FbxAutoPtr
{
public:
	//! Construct from a pointer.
	explicit FbxAutoPtr(Type* pPtr=0) : mPtr(pPtr){}

	//! Destructor.
	~FbxAutoPtr() { Policy::DeleteIt(&mPtr); }

	//! Retrieve the pointer it holds.
	inline Type* Get() const { return mPtr; }

	//! Member access operator.
	inline Type* operator->() const { return mPtr; }

	//! Convert to a Type pointer.
	inline operator Type* () const { return mPtr; }

	//! Dereference operator.
	inline Type& operator*() const { return *mPtr; }

	//! Logical not operator.
	inline bool operator!() const { return mPtr == 0; }

	//! Convert to boolean value.
	inline operator bool () const { return mPtr != 0; }

	//! Reset the scoped pointer by swapping with another pointer.
	inline void Reset(Type* pPtr=0)
	{
		FBX_ASSERT(pPtr == 0 || pPtr != mPtr);	//Catch self-reset errors
		FbxAutoPtr<Type, Policy>(pPtr).Swap(*this);
	}

	//! Swap with another pointer.
	inline void Swap(FbxAutoPtr& pOther)
	{
		Type* TmpPtr = pOther.mPtr;
		pOther.mPtr = mPtr;
		mPtr = TmpPtr;
	}

	//! Release the pointer, so that it won't perform deletion in its destruction.
	inline Type* Release()
	{
		Type* TmpPtr = mPtr;
		mPtr = NULL;
		return TmpPtr;
	}

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
private:
	FbxAutoPtr(const FbxAutoPtr&);
	FbxAutoPtr& operator=(const FbxAutoPtr&);

	Type* mPtr;
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};

//! Scoped pointer for FbxMalloc allocations, which call FbxFree() to deallocate.
template <class Type> class FbxAutoFreePtr : public FbxAutoPtr<Type, FbxDeletionPolicyFree<Type> >
{
public:
	//! Construct from a pointer.
    explicit FbxAutoFreePtr(Type* pPtr=0) : FbxAutoPtr<Type, FbxDeletionPolicyFree<Type> >(pPtr){}
};

//! Scoped pointer for FbxNew allocations, which call FbxDelete() to deallocate.
template <class Type> class FbxAutoDeletePtr : public FbxAutoPtr<Type, FbxDeletionPolicyDelete<Type> >
{
public:
	//! Construct from a pointer.
    explicit FbxAutoDeletePtr(Type* pPtr=0) : FbxAutoPtr<Type, FbxDeletionPolicyDelete<Type> >(pPtr){}
};

//! Scoped pointer for FbxObject derived classes, which call Destroy() to deallocate.
template <class Type> class FbxAutoDestroyPtr : public FbxAutoPtr<Type, FbxDeletionPolicyObject<Type> >
{
public:
	//! Construct from a pointer.
    explicit FbxAutoDestroyPtr(Type* pPtr=0) : FbxAutoPtr<Type, FbxDeletionPolicyObject<Type> >(pPtr){}
};


/** FbxSharedPtr class describes an object that stores a pointer to a single allocated object of type 
* Type* that ensures that the object to which it points gets destroyed automatically when the control 
* leaves a scope and the reference count is 0. */
class RefCount
{
public:
 	RefCount()	{ Init(); };
	~RefCount() { Init(); };

	void    Init()   { count = 0; }
	void	IncRef() { count++; }
	int	    DecRef() { count--; if (count < 0) count = 0; return count; }
	
private:
	int  count;
};

template<class Type, class Policy=FbxDeletionPolicyDefault<Type> > class FbxSharedPtr
{
public:
	// Default constructor.
	FbxSharedPtr() : 
		mPtr(0),
		mRef(0)
	{}

	//! Construct from a pointer.
	explicit FbxSharedPtr(Type* pPtr) : 
		mPtr(pPtr),
		mRef(0)
	{ 
		if (pPtr != 0) 
		{
			mRef = (RefCount*)FbxMalloc(sizeof(RefCount)); 
			mRef->Init();
			mRef->IncRef(); 
		}
	}

	//! Copy constructor
	FbxSharedPtr(const FbxSharedPtr& pSPtr) : 
		mPtr(pSPtr.mPtr), 
		mRef(pSPtr.mRef) 
	{ 
		if (pSPtr.mPtr != 0 && mRef != 0) 
			mRef->IncRef(); 
	}

	// Assignment operator
	FbxSharedPtr& operator=(const FbxSharedPtr& pSPtr)
	{
		if (this != &pSPtr) // avoid self assignment
		{
			Reset();

			if (pSPtr.mPtr)
			{
				mPtr = pSPtr.mPtr;
				mRef = pSPtr.mRef;
				FBX_ASSERT(mRef != NULL);
				mRef->IncRef();
			}
		}
		return *this;
	}

	//! Destructor.
	~FbxSharedPtr() { Destroy(); }

	void Destroy() { Reset(); }

	//! Retrieve the pointer it holds.
	inline Type* Get() const { return mPtr; }

	//! Member access operator.
	inline Type* operator->() const { return mPtr; }

	//! Convert to a Type pointer.
	inline operator Type* () const { return mPtr; }

	//! Dereference operator.
	inline Type& operator*() const { return *mPtr; }

	//! Logical not operator.
	inline bool operator!() const { return mPtr == 0; }

	//! Convert to boolean value.
	inline operator bool () const { return mPtr != 0; }


/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
private:
	void Reset() 
	{		
		if (mRef)
		{
			FBX_ASSERT(mPtr != 0);
			if (mRef->DecRef() == 0)
			{
				Policy::DeleteIt(&mPtr); 
				FbxFree(mRef);
				mRef = NULL;
			}
		}
	}

	Type* mPtr;
	RefCount* mRef;
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};

//! Scoped pointer for FbxMalloc allocations, which call FbxFree() to deallocate.
template <class Type> class FbxSharedFreePtr : public FbxSharedPtr<Type, FbxDeletionPolicyFree<Type> >
{
public:
	//! Construct from a pointer.
    explicit FbxSharedFreePtr(Type* pPtr=0) : FbxSharedPtr<Type, FbxDeletionPolicyFree<Type> >(pPtr){}
};

//! Scoped pointer for FbxNew allocations, which call FbxDelete() to deallocate.
template <class Type> class FbxSharedDeletePtr : public FbxSharedPtr<Type, FbxDeletionPolicyDelete<Type> >
{
public:
	//! Construct from a pointer.
    explicit FbxSharedDeletePtr(Type* pPtr=0) : FbxSharedPtr<Type, FbxDeletionPolicyDelete<Type> >(pPtr){}
};

//! Scoped pointer for FbxObject derived classes, which call Destroy() to deallocate.
template <class Type> class FbxSharedDestroyPtr : public FbxSharedPtr<Type, FbxDeletionPolicyObject<Type> >
{
public:
	//! Construct from a pointer.
    explicit FbxSharedDestroyPtr(Type* pPtr=0) : FbxSharedPtr<Type, FbxDeletionPolicyObject<Type> >(pPtr){}
};



#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_CORE_ARCH_ALLOC_H_ */
