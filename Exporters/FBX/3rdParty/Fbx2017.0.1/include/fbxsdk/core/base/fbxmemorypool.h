/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxmemorypool.h
#ifndef _FBXSDK_CORE_BASE_MEMORY_H_
#define _FBXSDK_CORE_BASE_MEMORY_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/core/sync/fbxatomic.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

/** \brief Class to create a simple fixed-size-blocks memory pool to allocate memory dynamically. */
class FBXSDK_DLL FbxMemoryPool
{
public:
	/** Memory pool constructor.
	* \param pBlockSize		The size of one memory block.
	* \param pBlockCount	The count of block that should be pre-allocated.
	* \param pResizable		Whether memory pool can grow if no block are availalbe upon calling Allocate.
	* \param pConcurrent	Whether the pool supports concurrent allocation and release operations.
	* \remark				All memory blocks must be released before the memory pool is destroyed, otherwise a memory leak will occur. */
	FbxMemoryPool(size_t pBlockSize, FbxInt64 pBlockCount=0, bool pResizable=true, bool pConcurrent=true);

	/** Memory pool destructor. Upon destruction, all memory blocks of the pool will be de-allocated. */
	~FbxMemoryPool();

	/** Free memory of all memory blocks from this memory pool, also effectively resetting the block count to zero.
	* \remark The block size and alignment/resize/concurrent support will remain unchanged. */
	void Reset();

	/** Allocate or lock a memory block for usage.
	* \return An memory block pointer that can be NULL if the memory pool cannot grow in size and no blocks are available. */
	void* Allocate();

	/** Dispose or unlock a memory block.
	* \param pMemBlock A pointer to the memory block to release. This will not free the block's memory, instead simply putting it back in the available stack. */
	void Release(void* pMemBlock);

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
private:
    void*		Pop();

	FbxInt64	mMaxBlockCount;
    FbxAtomic	mFreeBlockCount;
    void*		mFreeBlocksStack;
    size_t		mBlockSize;
    bool		mResizable;
    bool		mSupportConcurrentAccess;
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_CORE_BASE_MEMORY_H_ */
