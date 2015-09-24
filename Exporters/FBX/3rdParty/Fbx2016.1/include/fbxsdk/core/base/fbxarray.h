/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxarray.h
#ifndef _FBXSDK_CORE_BASE_ARRAY_H_
#define _FBXSDK_CORE_BASE_ARRAY_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

/** Class for array of basic elements such as pointers and basic types. This class will not
* call constructor and destructor for elements, thus it is not suitable for object references.
* Memory allocations are always done in a single contiguous memory region. */
template <class T> class FbxArray
{
public:
	//! Element compare function pointer definition
	typedef int (*CompareFunc)(const void*, const void*);

	//! Constructor.
	FbxArray() : mSize(0), mCapacity(0), mArray(NULL){}

	//! Reserve constructor.
	FbxArray(const int pCapacity) : mSize(0), mCapacity(0), mArray(NULL){ if( pCapacity > 0 ) Reserve(pCapacity); }

	//! Copy constructor.
	FbxArray(const FbxArray& pArray) : mSize(0), mCapacity(0), mArray(NULL){ *this = pArray; }

	/** Destructor.
	* \remark The destructor for each element will not be called. */
	~FbxArray(){ Clear(); }

	/** Insert an element at the given position, growing the array if capacity is not sufficient.
	* \param pIndex Position where to insert the element. Must be a positive value.
	* \param pElement Element to insert in the array.
	* \param pCompact If \c true and capacity is exceeded, grow capacity by one, otherwise double capacity (default).
	* \return -1 if insert failed, otherwise the position of the inserted element in the array.
	* \remark If the given index is greater than Size(), the element is appended at the end. Use compact mode only if you need to save memory. */
	inline int InsertAt(const int pIndex, const T& pElement, bool pCompact=false)
	{
		FBX_ASSERT_RETURN_VALUE(pIndex >= 0, -1);
		int lIndex = FbxMin(pIndex, mSize);
		if( mSize >= mCapacity )
		{
			T lElement = pElement;	//Copy element because we might move memory
			int lNewCapacity = FbxMax(pCompact ? mCapacity + 1 : mCapacity * 2, 1);	//We always double capacity when not compacting
			T* lArray = Allocate(lNewCapacity);
			FBX_ASSERT_RETURN_VALUE(lArray, -1);
			mArray = lArray;
			mCapacity = lNewCapacity;
			return InsertAt(pIndex, lElement);	//Insert copied element because reference might be moved
		}

		if( lIndex < mSize )	//Move elements to leave a space open to insert the new element
		{
			//If pElement is inside memmove range, copy element and insert copy instead
			if( (&pElement >= &mArray[lIndex]) && (&pElement < &mArray[mSize]) )
			{
				T lElement = pElement;
				return InsertAt(pIndex, lElement);
			}
			memmove(&mArray[lIndex + 1], &mArray[lIndex], (mSize - lIndex) * sizeof(T));
		}

		memcpy(&mArray[lIndex], &pElement, sizeof(T));
		mSize++;

		return lIndex;
	}

	/** Append an element at the end of the array, doubling the array if capacity is not sufficient.
	* \param pElement Element to append to the array.
	* \return -1 if add failed, otherwise the position of the added element in the array. */
	inline int Add(const T& pElement)
	{
		return InsertAt(mSize, pElement);
	}

	/** Append an element at the end of array, if not already present, doubling the array if capacity is not sufficient.
	* \param pElement Element to append to the array.
	* \return -1 if add failed, otherwise the position of the added element in the array. */
	inline int AddUnique(const T& pElement)
	{
		int lIndex = Find(pElement);
		return ( lIndex == -1 ) ? Add(pElement) : lIndex;
	}

	/** Append an element at the end of the array, growing the array by one element if capacity is not sufficient.
	* \param pElement Element to append to the array.
	* \return -1 if add failed, otherwise the position of the added element in the array. */
	inline int AddCompact(const T& pElement)
	{
		return InsertAt(mSize, pElement, true);
	}

	/** Retrieve the number of element contained in the array. To increase the capacity without increasing the size, please use Reserve().
	* \return The number of element in the array.
	* \remark The size of the array cannot exceed its capacity. */
	inline int Size() const { return mSize; }

	/** Retrieve the current allocated memory capacity of the array.
	* \return The capacity of the array in number of element.
	* \remark The capacity will always be greater or equal to its size. */
	inline int Capacity() const { return mCapacity; }

	/** Retrieve a reference of the element at given index position in the array.
	* \param pIndex Position of element in the array.
	* \return A reference to the element at the specified position in the array.
	* \remark No error will be thrown if the index is out of bounds. */
	inline T& operator[](const int pIndex) const
	{
	#ifdef _DEBUG
		FBX_ASSERT_MSG(pIndex >= 0, "Index is out of range!");
		if( pIndex >= mSize )
		{
			if( pIndex < mCapacity )
			{
				FBX_ASSERT_NOW("Index is out of range, but not outside of capacity! Call SetAt() to use reserved memory.");
			}
			else FBX_ASSERT_NOW("Index is out of range!");
		}
	#endif
		return (T&)mArray[pIndex];
	}

	/** Retrieve a copy of the element at given index position in the array.
	* \param pIndex Position of element in the array.
	* \return The value of the element at the specified position in the array.
	* \remark No error will be thrown if the index is out of bounds. */
	inline T GetAt(const int pIndex) const
	{
		return operator[](pIndex);
	}

	/** Retrieve a copy of the first element.
	* \return Copy of the first element.
	* \remark The array should have at least one element and no error will be thrown if the array is empty. */
	inline T GetFirst() const
	{
		return GetAt(0);
	}

	/** Retrieve a copy of the last element.
	* \return Copy of the last element.
	* \remark The array should have at least one element and no error will be thrown if the array is empty. */
	inline T GetLast() const
	{
		return GetAt(mSize-1);
	}

	/** Find first matching element, from first to last.
	* \param pElement The element to be compared to each of the elements.
	* \param pStartIndex The position to start searching from.
	* \return Position of first matching element or -1 if there is no matching element. */
	inline int Find(const T& pElement, const int pStartIndex=0) const
	{
		FBX_ASSERT_RETURN_VALUE(pStartIndex >= 0, -1);
		for( int i = pStartIndex; i < mSize; ++i )
		{
			if( operator[](i) == pElement ) return i;
		}
		return -1;
	}

	/** Find first matching element, from last to first.
	* \param pElement The element to be compared to each of the elements.
	* \param pStartIndex The position to start searching from.
	* \return Position of first matching element or -1 if there is no matching element. */
	inline int FindReverse(const T& pElement, const int pStartIndex=FBXSDK_INT_MAX) const
	{
		for( int i = FbxMin(pStartIndex, mSize-1); i >= 0; --i )
		{
			if( operator[](i) == pElement ) return i;
		}
		return -1;
	}

	/** Request for allocation of additional memory without inserting new elements. After the memory has been reserved, please use SetAt() to initialize elements.
	* \param pCapacity The number of additional element memory allocation requested.
	* \return \c true if the memory allocation succeeded or if the capacity is unchanged, \c false otherwise.
	* \remark If the requested capacity is less than or equal to the current capacity, this call has no effect. In either case, Size() is unchanged. */
	inline bool Reserve(const int pCapacity)
	{
		FBX_ASSERT_RETURN_VALUE(pCapacity > 0, false);
		if( pCapacity > mCapacity )
		{
			T* lArray = Allocate(pCapacity);
			FBX_ASSERT_RETURN_VALUE(lArray, false);
			mArray = lArray;
			mCapacity = pCapacity;

			//Initialize new memory to zero
			memset(&mArray[mSize], 0, (mCapacity - mSize) * sizeof(T));
		}
		return true;
	}

	/** Set the element at given position in the array.
	* \param pIndex Position of element in the array.
	* \param pElement The new element.
	* \remark If the index is outside range, and outside capacity, this call has no effect. However, if index is
	* within capacity range, element count is increased such that Size() will become pIndex + 1. */
	inline void SetAt(const int pIndex, const T& pElement)
	{
		FBX_ASSERT_RETURN(pIndex < mCapacity);
		if( pIndex >= mSize ) mSize = pIndex + 1;
		if( mArray ) memcpy(&mArray[pIndex], &pElement, sizeof(T));
	}

	/** Set the value of the first element.
	* \param pElement The new value of the last element.
	* \remark The array should have at least one element and no error will be thrown if the array is empty. */
	inline void SetFirst(const T& pElement)
	{
		SetAt(0, pElement);
	}

	/** Set the value of the last element.
	* \param pElement The new value of the last element.
	* \remark The array should have at least one element and no error will be thrown if the array is empty. */
	inline void SetLast(const T& pElement)
	{
		SetAt(mSize-1, pElement);
	}

	/** Remove an element at the given position in the array.
	* \param pIndex Position of the element to remove.
	* \return Removed element.
	* \remark No error will be thrown if the index is out of bounds. */
	inline T RemoveAt(const int pIndex)
	{
		T lElement = GetAt(pIndex);
		if( pIndex + 1 < mSize )
		{
			memmove(&mArray[pIndex], &mArray[pIndex + 1], (mSize - pIndex - 1) * sizeof(T));
		}
		mSize--;
		return lElement;
	}

	/** Remove the first element in the array.
	* \return Removed element.
	* \remark The array should have at least one element and no error will be thrown if the array is empty. */
	inline T RemoveFirst()
	{
		return RemoveAt(0);
	}

	/** Remove the last element in the array.
	* \return Removed element.
	* \remark The array should have at least one element and no error will be thrown if the array is empty. */
	inline T RemoveLast()
	{
		return RemoveAt(mSize-1);
	}

	/** Remove first matching element in the array.
	* \param pElement Element to be removed.
	* \return \c true if a matching element is found and removed, \c false otherwise. */
	inline bool RemoveIt(const T& pElement)
	{
		int Index = Find(pElement);
		if( Index >= 0 )
		{
			RemoveAt(Index);
			return true;
		}
		return false;
	}

	/** Remove a range of elements at the given position in the array.
	* \param pIndex Begin position of the elements to remove.
	* \param pCount The count of elements to remove.
	* \return \c true if successful, otherwise \c false. */
	inline void RemoveRange(const int pIndex, const int pCount)
	{
		if( pIndex + pCount < mSize )
		{
			memmove(&mArray[pIndex], &mArray[pIndex + pCount], (mSize - pIndex - pCount) * sizeof(T));
		}
		mSize -= pCount;
	}

	/** Inserts or erases elements at the end such that Size() becomes pSize, increasing capacity if needed. Please use SetAt() to initialize any new elements.
	* \param pSize The new count of elements to set the array to. Must be greater or equal to zero.
	* \return \c true if the memory (re)allocation succeeded, \c false otherwise.
	* \remark If the requested element count is less than or equal to the current count, elements are freed from memory. Otherwise, the array grows and elements are unchanged. */
	inline bool Resize(const int pSize)
	{
		if( pSize == mSize && mSize == mCapacity ) return true;

		if( pSize == 0 )
		{
			Clear();
			return true;
		}

		FBX_ASSERT_RETURN_VALUE(pSize > 0, false);
		if( pSize != mCapacity )
		{
			T* lArray = Allocate(pSize);
			FBX_ASSERT_RETURN_VALUE(lArray, false);
			mArray = lArray;
		}

		if( pSize > mCapacity )	//Initialize new memory to zero
		{
			memset(&mArray[mSize], 0, (pSize - mSize) * sizeof(T));
		}

		mSize = pSize;
		mCapacity = pSize;
		return true;
	}

	/** Increase size of array by the specified size.
	* \param pSize The size to add to the array size.
	* \return \c true if operation succeeded, \c false otherwise. */
	inline bool Grow(const int pSize)
	{
		return Resize(mSize + pSize);
	}

	/** Reduce size of array by the specified size.
	* \param pSize The size to remove from the array size.
	* \return \c true if operation succeeded, \c false otherwise. */
	inline bool Shrink(const int pSize)
	{
		return Resize(mSize - pSize);
	}

	/** Compact the array so that its capacity is the same as its size.
	* \return \c true if operation succeeded, \c false otherwise. */
	inline bool Compact()
	{
		return Resize(mSize);
	}

	/** Reset the number of element to zero and free the memory allocated.
	* \remark This only free the memory allocated by the array, and doesn't call the destructor of each element. */
	inline void Clear()
	{
		if( mArray != NULL )
		{
			mSize = 0;
			mCapacity = 0;
			FbxFree(mArray);
			mArray = NULL;
		}
	}

	/** Sort the array using the specified compare function pointer
	* \param pCompareFunc The compare function to use to sort elements. */
	inline void Sort(CompareFunc pCompareFunc)
	{
		qsort(mArray, mSize, sizeof(T), pCompareFunc);
	}

	//! Get pointer to internal array of elements.
	inline T* GetArray() const { return mArray ? (T*)mArray : NULL; }

	//! Cast operator.
	inline operator T* (){ return mArray ? (T*)mArray : NULL; }

	/** Append another array at the end of this array.
	* \param pOther The other array to append to this array. */
	inline void AddArray(const FbxArray<T>& pOther)
	{
		if( Grow(pOther.mSize) )
		{
			memcpy(&mArray[mSize - pOther.mSize], pOther.mArray, pOther.mSize * sizeof(T));
		}
	}

	/** Append the elements of another array at the end of this array if they are not present.
	* \param pOther Another array. */
	inline void AddArrayNoDuplicate(const FbxArray<T>& pOther)
	{
		for( int i = 0, c = pOther.mSize; i < c; ++i )
		{
			AddUnique(pOther[i]);
		}
	}

	/** Remove the elements of another array from this array is they are present.
	* \param pOther Another array. */
	inline void RemoveArray(const FbxArray<T>& pOther)
	{
		for( int i = 0, c = pOther.mSize; i < c; ++i )
		{
			RemoveIt(pOther[i]);
		}
	}

	/** Operator to copy elements of an array.
	* \return this array containing a copy of pOther elements. */
	inline FbxArray<T>& operator=(const FbxArray<T>& pOther)
	{
		if( this != &pOther )
		{
			if( Resize(pOther.mSize) )
			{
				memcpy(mArray, pOther.mArray, pOther.mSize * sizeof(T));
			}
		}
		return *this;
	}

	/** Operator to compare elements of an array.
	* \return \c true if the two arrays are equal, otherwise \c false. */
	inline bool operator==(const FbxArray<T>& pOther) const
	{
		if( this == &pOther ) return true;
		if( mSize != pOther.mSize ) return false;
		return memcmp(mArray, pOther.mArray, sizeof(T) * mSize) == 0;
	}

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
	inline int GetCount() const { return mSize; }

private:
	inline T* Allocate(const int pCapacity)
	{
		return (T*)FbxRealloc(mArray, pCapacity * sizeof(T));
	}

	int	mSize;
	int	mCapacity;
	T*	mArray;

#if defined(FBXSDK_COMPILER_MSC)
    //Previously class FbxArray is for pointers. Somehow, it's used to store other types. Here's a compile-time checking for known incompatible classes.
    //If it happens you find new incompatible ones, declare them with macro FBXSDK_INCOMPATIBLE_WITH_ARRAY. Also see file fbxstring.h.
    FBX_ASSERT_STATIC(FBXSDK_IS_SIMPLE_TYPE(T) || __is_enum(T) || (__has_trivial_constructor(T)&&__has_trivial_destructor(T)) || !FBXSDK_IS_INCOMPATIBLE_WITH_ARRAY(T));
#endif

#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};

//! Call FbxFree on each element of the array, and then clear it.
template <class T> inline void FbxArrayFree(FbxArray<T>& pArray)
{
	for( int i = 0, c = pArray.Size(); i < c; ++i )
	{
		FbxFree(pArray[i]);
	}
	pArray.Clear();
}

//! Call FbxDelete on each element of the array, and then clear it.
template <class T> inline void FbxArrayDelete(FbxArray<T>& pArray)
{
	for( int i = 0, c = pArray.Size(); i < c; ++i )
	{
		FbxDelete(pArray[i]);
	}
	pArray.Clear();
}

//! Call Destroy on each element of the array, and then clear it.
template <class T> inline void FbxArrayDestroy(FbxArray<T>& pArray)
{
	for( int i = 0, c = pArray.Size(); i < c; ++i )
	{
		(pArray[i])->Destroy();
	}
	pArray.Clear();
}

//! Make sure to break build if someone try to make FbxArray<FbxArray<T>>, which is not supported.
template <class T> FBXSDK_INCOMPATIBLE_WITH_ARRAY_TEMPLATE(FbxArray<T>);

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_CORE_BASE_ARRAY_H_ */
