/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxmap.h
#ifndef _FBXSDK_CORE_BASE_MAP_H_
#define _FBXSDK_CORE_BASE_MAP_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/core/base/fbxstring.h>
#include <fbxsdk/core/base/fbxredblacktree.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

class FbxObject;

/** Default compare functor for FbxMap and FbxSet, which assumes operator < is defined.
Here is examples of different compare class implementations:
With Key = int
\code
class IntCompare
{
    inline int operator()(int pKeyA, int pKeyB) const
    {
        return pKeyA < pKeyB ? -1 : (pKeyA > pKeyB ? 1 : 0);
    }
};
\endcode
With Key = Class
\code
class ClassCompare
{
	inline int operator()(const Class& pKeyA, const Class& pKeyB) const
	{
		return pKeyA < pKeyB ? -1 : (pKeyA > pKeyB ? 1 : 0);
	}
};
\endcode
With Key = char*
\code
class StrCompare
{
	inline int operator()(const char* pKeyA, const char* pKeyB) const
	{
		return strcmp(pKeyA, pKeyB);
	}
};
\endcode
*/
template <typename Type> struct FbxLessCompare
{
    inline int operator()(const Type& pLeft, const Type& pRight) const
    {
        return (pLeft < pRight) ? -1 : ((pRight < pLeft) ? 1 : 0);
    }
};

/** This class implements an efficient map based on key comparison, which stores key-value pairs.
It executes insertion, deletion and query operations in O(log(n)) time. */
template <typename Key, typename Type, typename Compare=FbxLessCompare<Key>, typename Allocator=FbxBaseAllocator> class FbxMap
{
protected:
	//! This class defines the key-value pairs used by the map.
	class KeyValuePair : private FbxPair<const Key, Type>
	{
	/*****************************************************************************************************************************
	** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
	*****************************************************************************************************************************/
	#ifndef DOXYGEN_SHOULD_SKIP_THIS
	public:
		typedef const Key	KeyType;
		typedef const Key	ConstKeyType;
		typedef Type		ValueType;
		typedef const Type	ConstValueType;

		KeyValuePair(const Key& pFirst, const Type& pSecond) : FbxPair<const Key, Type>(pFirst, pSecond){}
		ConstKeyType& GetKey() const { return this->mFirst; }
		KeyType& GetKey(){ return this->mFirst; }
		ConstValueType& GetValue() const { return this->mSecond; }
		ValueType& GetValue(){ return this->mSecond; }
	#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
	};

	//! Declaration of the storage type used by the map.
	typedef FbxRedBlackTree<KeyValuePair, Compare, Allocator> StorageType;

public:
	typedef Type									ValueType;
	typedef Key										KeyType;
	typedef typename StorageType::RecordType		RecordType;
	typedef typename StorageType::IteratorType		Iterator;
	typedef typename StorageType::ConstIteratorType	ConstIterator;

	/** Preallocate memory.
	* \param pRecordCount The number of elements. */
	inline void Reserve(unsigned int pRecordCount)
	{
		mTree.Reserve(pRecordCount);
	}

	//! Retrieve the number of key-value pairs it holds.
	inline int GetSize() const
	{
		return mTree.GetSize();
	}

	/** Insert a key-value pair.
	* \param pKey The key.
	* \param pValue The value.
	* \return If the key is already present in the map, returns the existing pair and false; else returns the pointer to the new key-value and true. */
	inline FbxPair<RecordType*, bool> Insert(const KeyType& pKey, const ValueType& pValue)
	{
		return mTree.Insert(KeyValuePair(pKey, pValue));
	}

	/** Delete a key-value pair.
	* \param pKey The key.
	* \return \c true if success, \c false if key is not found. */
	inline bool Remove(const KeyType& pKey)
	{
		return mTree.Remove(pKey);
	}

	//! Clear the map.
	inline void Clear()
	{
		mTree.Clear();
	}

	//! Query whether the map is empty.
	inline bool Empty() const
	{
		return mTree.Empty();
	}

	//! Retrieve the begin iterator of the map.
	Iterator Begin()
	{
		return Iterator(Minimum());
	}

	//! Retrieve the end iterator of the map.
	Iterator End()
	{
		return Iterator();
	}

	//! Retrieve the begin iterator of the map.
	ConstIterator Begin() const
	{
		return ConstIterator(Minimum());
	}

	//! Retrieve the end iterator of the map.
	ConstIterator End() const
	{
		return ConstIterator();
	}

	/** Query a key.
	* \param pKey The key.
	* \return A key-value pair if success, NULL if the key is not found. */
	inline const RecordType* Find(const KeyType& pKey) const
	{
		return mTree.Find(pKey);
	}

	/** Query a key.
	* \param pKey The key.
	* \return A key-value pair if success, NULL if it's not found. */
	inline RecordType* Find(const KeyType& pKey)
	{
		return mTree.Find(pKey);
	}

	/** Find the key-value pair with the smallest key greater than a specified key.
	* \param pKey The key.
	* \return The found key-value pair. */
	inline const RecordType* UpperBound(const KeyType& pKey) const
	{
		return mTree.UpperBound(pKey);
	}

	/** Find the key-value pair with the smallest key greater than a specified key.
	* \param pKey The key.
	* \return The found key-value pair. */
	inline RecordType* UpperBound(const KeyType& pKey)
	{
		return mTree.UpperBound(pKey);
	}

	/** Retrieve the reference of the value in the key-value pairs in map.
	* \param pKey The key.
	* \return The reference of the value.
	* \remark If the key is not found, a new key-value pair will be inserted. */
	inline ValueType& operator[](const KeyType& pKey)
	{
		RecordType* lRecord = Find(pKey);

		if( !lRecord )
		{
			lRecord = Insert(pKey, ValueType()).mFirst;
		}

		return lRecord->GetValue();
	}

	//! Retrieve the key-value pair which is the minimum key in map.
	inline const RecordType* Minimum() const
	{
		return mTree.Minimum();
	}

	//! Retrieve the key-value pair which is the minimum key in map.
	inline RecordType* Minimum()
	{
		return mTree.Minimum();
	}

	//! Retrieve the key-value pair which is the maximum key in map.
	inline const RecordType* Maximum() const
	{
		return mTree.Maximum();
	}

	//! Retrieve the key-value pair which is the maximum key in map.
	inline RecordType* Maximum()
	{
		return mTree.Maximum();
	}

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
	inline FbxMap(){}
	inline FbxMap(const FbxMap& pMap) : mTree(pMap.mTree){}
	inline ~FbxMap(){ Clear(); }

private:
	StorageType mTree;
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};

/** A simple map class representing a dictionary-like data structure.
* \nosubgrouping */
template <class Key, class Type, class Compare> class FBXSDK_DLL FbxSimpleMap
{
public:
    typedef typename FbxMap<Key, Type, Compare>::RecordType* Iterator;

	/** Add a key-value pair as an element.
	* \param pKey The new key.
	* \param pValue The new value. */
	inline void Add(const Key& pKey, const Type& pValue)
	{
		mMap.Insert(pKey, pValue);
	}

	/** Find an element with a given key.
	* \param pKey The given key.
	* \return The iterator pointing to the found element or NULL if fails. */
	inline Iterator Find(const Key& pKey) const
	{
		return (Iterator)mMap.Find(pKey);
	}

	/** Find an element with a given value.
	* \param pValue The given value.
	* \return The iterator pointing to the found element or NULL if fails. */
	inline Iterator Find(const Type& pValue) const
	{
		Iterator lIterator = GetFirst();
		while( lIterator )
		{
			if( lIterator->GetValue() == pValue )
			{
				return lIterator;
			}
			lIterator = GetNext(lIterator);
		}
		return 0;
	}

	/** Remove an element from the map.
	* \param pIterator The given element. */
	inline void Remove(Iterator pIterator)
	{
		if( pIterator ) mMap.Remove(pIterator->GetKey());
	}

	/** Get the first element.
	* \return The the heading element. */
	inline Iterator GetFirst() const
	{
		return (Iterator)mMap.Minimum();
	}

	/** Get the next element of a given element.
	* \param pIterator The given element.
	* \return The next element. */
	inline Iterator GetNext(Iterator pIterator) const
	{
		return (Iterator)pIterator ? pIterator->Successor() : 0;
	}

	//! Remove all of the elements.
	inline void Clear() 
	{
		mMap.Clear();
	}

	/** Reserve the space for given number elements.
	* \param pSize The given number. */
	inline void Reserve(int pSize)
	{
		mMap.Reserve(pSize);
	}

	/** Query the count of elements in the map.
	* \return The count of elements. */
	inline int GetCount() const
	{
		return mMap.GetSize();
	}

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
	inline FbxSimpleMap(){}

private:
    FbxMap<Key, Type, Compare> mMap;
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};

/** This class template declare a simple FbxObject map.
* \nosubgrouping */
template <class Type, class Compare> class FBXSDK_DLL FbxObjectMap : public FbxSimpleMap<Type, FbxObject*, Compare>
{
public:
    //! Constructor
    inline FbxObjectMap(){}

    /** Get the object contained in an element.
      * \param pIterator The given element.
      * \return The object.
      */
    inline FbxObject* Get(typename FbxSimpleMap<Type, FbxObject*, Compare>::Iterator pIterator)
    {
        return pIterator ? pIterator->GetValue() : 0;
    }
};

/** A class that maps strings to objects with a basic string comparator.
* \nosubgrouping */
class FBXSDK_DLL FbxObjectStringMap : public FbxObjectMap<FbxString, FbxStringCompare>
{
public:
    //! Constructor
    inline FbxObjectStringMap(){}
};

//! Call FbxFree on each element of the map, and then clear it.
template <typename K, typename V, typename C, typename A> inline void FbxMapFree(FbxMap<K, V, C, A>& pMap)
{
	for( typename FbxMap<K, V, C, A>::Iterator i = pMap.Begin(); i != pMap.End(); ++i )
	{
		FbxFree(i->GetValue());
	}
	pMap.Clear();
}

//! Call FbxDelete on each element of the map, and then clear it.
template <typename K, typename V, typename C, typename A> inline void FbxMapDelete(FbxMap<K, V, C, A>& pMap)
{
	for( typename FbxMap<K, V, C, A>::Iterator i = pMap.Begin(); i != pMap.End(); ++i )
	{
		FbxDelete(i->GetValue());
	}
	pMap.Clear();
}

//! Call Destroy on each element of the map, and then clear it.
template <typename K, typename V, typename C, typename A> inline void FbxMapDestroy(FbxMap<K, V, C, A>& pMap)
{
	for( typename FbxMap<K, V, C, A>::Iterator i = pMap.Begin(); i != pMap.End(); ++i )
	{
		i->GetValue()->Destroy();
	}
	pMap.Clear();
}

template class FbxSimpleMap<FbxString, FbxObject*, FbxStringCompare>;
template class FbxObjectMap<FbxString, FbxStringCompare>;

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_CORE_BASE_MAP_H_ */
