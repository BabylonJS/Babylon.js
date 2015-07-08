/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxhashmap.h
#ifndef _FBXSDK_CORE_BASE_HASHMAP_H_
#define _FBXSDK_CORE_BASE_HASHMAP_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/core/base/fbxarray.h>
#include <fbxsdk/core/base/fbxmap.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

template<class T> class FbxNoOpDestruct { public: static inline void DoIt(T&) {} };
template<class T> class FbxPtrDestruct  { public: static inline void DoIt(T& v) { FbxDelete(v); v = NULL; } };

//True if equal, false otherwise
template<class T> class FbxDefaultComparator{ public: static inline bool CompareIt( const T& t1, const T& t2 ) { return t1 == t2; } };

/** \brief This object represents a standard hash map.  You must provide the typename of KEY and VALUE as well
    as the typename of the class that contains the hash function to use to hash values.   The hash class must
    overload operator() and be built like this.
    \code
    class SimpleHash
    {
    public:
        inline unsigned int operator() ( const int pKey ) const
        {
            return pKey;
        }
    };
    \endcode
  * \nosubgrouping
  */
template< typename KEY, typename VALUE, typename HASH, class Destruct = FbxNoOpDestruct<VALUE>, class Comparator = FbxDefaultComparator<KEY> >
class FbxHashMap
{
public:
	typedef KEY KeyType;
	typedef VALUE ValueType;
	typedef HASH HashFunctorType;

private:

	class ListItem
	{
	public:
		ListItem* mNext;
		ValueType mValue;
		KeyType mKey;

		ListItem()
			:
		mNext(NULL)
		{
		}

        ~ListItem()
        {
            Destruct::DoIt(mValue);        
        }
	};

public:
    /**
    Iterate through every element in a hash map.
    */
	class Iterator
	{
	public:

		typedef ListItem ListItemType;
		typedef FbxPair< KeyType, ValueType > KeyValuePair;

        /**
        Copy constructor
        */
		Iterator( const Iterator& pOther )
			:
			mMap( pOther.mMap ),
			mBucketIndex( pOther.mBucketIndex ),
			mCurrentItem( pOther.mCurrentItem )
		{

		}

        /**
        Destructor
        */
		~Iterator(){};

        /**
        Used to dereference an iterator and give it a behavior more similar to a pointer.
        \return The KeyValuePair currently referenced by the iterator
        */
		KeyValuePair operator*() const
		{
			KeyValuePair lItem;

			if( mCurrentItem )
			{
				lItem.mFirst = mCurrentItem->mKey;
				lItem.mSecond = mCurrentItem->mValue;
				return lItem;
			}

			FBX_ASSERT_NOW("Accessing out of bounds iterator");

			return lItem;
		}

        /**
        Advances the iterator to the next keyvaluepair in the hashmap.  It does not wrap around so 
        advancing after reaching the last element will not point back to the first one.
        */
		void Next()
		{
			if( !mCurrentItem )
				return;

			if( mCurrentItem->mNext )
			{
				mCurrentItem = mCurrentItem->mNext;
				return;
			}
			else
			{
				mBucketIndex++;
				for( ; mBucketIndex < mMap->mBuckets.GetCount(); ++mBucketIndex )
				{
					if( mMap->mBuckets[ mBucketIndex ] )
					{
						mCurrentItem = mMap->mBuckets[ mBucketIndex ];
						return;
					}
				}
				
				if( mBucketIndex >= mMap->mBuckets.GetCount() )
				{
					*this = mMap->End();
					return;
				}
			}
		}

        /**
        Check equivalence between two iterators.  There are 3 conditions for equivalence between 2 iterators:
        1) Item being referenced by the iterator must be equivalent
        2) They must point at the same index
        3) They must point on the same map
        \return true if both iterators are equal, false otherwise
        */
		bool operator==( const Iterator& pOther ) const
		{
			return	mCurrentItem == pOther.mCurrentItem && 
					mBucketIndex == pOther.mBucketIndex &&
					mMap == pOther.mMap;
		}

        /**
        Check inequivalence between 2 iterators.  Please see operator== for more information.
        \return true if both iterators are NOT equal, false if they are
        */
		bool operator!=( const Iterator& pOther ) const
		{
			return !(*this == pOther);
		}

		/**
        Assign the current iterator to the one on the right hand side of the operator.  After assignment they will
        reference the same object, at the same index, in the same map.
        \return The new iterator
        */
		Iterator& operator=( const Iterator& pOther )
		{
			this->mBucketIndex = pOther.mBucketIndex;
			this->mMap = pOther.mMap;
			this->mCurrentItem = pOther.mCurrentItem;
			return *this;
		}

    private:
		const FbxHashMap* mMap;		

		int mBucketIndex;
		ListItemType* mCurrentItem;
		
		Iterator(const FbxHashMap* pMap, int pBucketIndex, ListItemType* pCurrentItem)
			:
			mMap( pMap ),
			mBucketIndex(pBucketIndex),
			mCurrentItem(pCurrentItem)
		{

		}

		friend class FbxHashMap;
	};
	
	/**
    Construct a FbxHashMap with an user-defined maximum number of elements.
    \param pBucketSize Initial maximum number of elements.
    */
	FbxHashMap( int pBucketSize )
	{
		mBuckets.Resize( pBucketSize );
	}

	/**
    Construct a FbxHashMap with the default maximum number of elements (30)
    */
    FbxHashMap()
    {
        mBuckets.Resize(30);
    }

	/**
    Clear all elements in the hash map before destroying itself
    */
	~FbxHashMap()
	{
		Clear();
		mBuckets.Clear();
	}

	/**
    Calls operator delete on all elements of the hashmap, de-allocating all memory and destroying them
    */
	void Clear()
	{
		for( int i = 0; i < mBuckets.GetCount(); ++i)
		{
			if( mBuckets[i] )
			{
				ListItem* lNext = mBuckets[i]->mNext;
				while( lNext )
				{
					ListItem* lNextNext = lNext->mNext;
					FbxDelete(lNext);
					lNext = lNextNext;
				}

				FbxDelete(mBuckets[i]);
				mBuckets[i] = NULL;
			}
		}
	}

	/**
    Find an element in the hashmap.  If no element exist with the specified key, returns an iterator pointing on the
    end of the map (not an actual KeyValuePair).
    \param pKey The value of the key corresponding to the element
    \return An Iterator referencing that element
    */
	const Iterator Find( const KeyType& pKey ) const
	{
		unsigned int lIndex = mHashFunctor(pKey);
		lIndex = lIndex % mBuckets.GetCount();
		ListItem* lItem = mBuckets[lIndex];
		while( lItem )
		{
            if( Comparator::CompareIt( lItem->mKey, pKey ) )
			{
				Iterator lIt( this, lIndex, lItem );
				return lIt;
			}
			lItem = lItem->mNext;
		}
		
		return End();
	}
	
	/**
    Remove an element in the hashmap.
    \param pKey The key value of the element to remove
    \return The value of the element that was just deleted.  If the element does not exist, a value created with its default constructor will be returned
    */
	VALUE Remove( const KEY& pKey )
    {
		unsigned int lIndex = mHashFunctor(pKey);
		lIndex = lIndex % mBuckets.GetCount();
		ListItem* lItem = mBuckets.GetAt(lIndex);
        ListItem* lLastItem = NULL;
		
        while( lItem )
		{
			if( lItem->mKey == pKey )
			{
                if( lLastItem )
                    lLastItem->mNext = lItem->mNext;

                if( mBuckets.GetAt(lIndex) == lItem ) 
                    mBuckets.SetAt(lIndex, lItem->mNext );

                VALUE lValue = lItem->mValue;
                FbxDelete(lItem);
                
                return lValue;
			}

            lLastItem = lItem;
			lItem = lItem->mNext;
		}
		
        return VALUE();
    }

    /** Add or retrieve a KeyValuePair from the Hashmap.  If there is already an entry in the map for an element
    with key value specified in parameter, the value will be returned.  Otherwise, a new entry will be created
    with this key value and the default value for ValueType will be returned.  It can be modified using the 
    assignment operator
    \param pKey The key for which to retrieve/add a value.
    \return Value of the element referenced by the key specified in parameter.
    */
	ValueType& operator[]( const KeyType& pKey )
	{
        unsigned int lIndex = 0;
		Iterator lIt = InternalFind( pKey, lIndex);
		if( lIt != End() )
		{
			return lIt.mCurrentItem->mValue;
		}

		lIndex = lIndex % mBuckets.GetCount();
		ListItem* lItem = FbxNew< ListItem >();
		lItem->mNext = NULL;
		lItem->mKey = pKey;

		if( !mBuckets.GetAt(lIndex) )
		{
			mBuckets.SetAt(lIndex, lItem);
		}
		else
		{
			lItem->mNext = mBuckets.GetAt(lIndex);
			mBuckets.SetAt(lIndex, lItem);
		}

		return lItem->mValue;
	}

    /** Returns an iterator pointing on the first non-null element in the map
    \return An iterator pointing on the first non-null element in the map.
    */
	Iterator Start() const
	{
		for( int i = 0; i < mBuckets.GetCount(); ++i )
		{
			if( mBuckets[i] )
			{
				Iterator lIt( this, i, mBuckets[i] );
				return lIt;
			}
		}

		return End();
	}

    /** Returns an iterator pointing on the last element in the map.  This is not an actual KeyValuePair but 
    * but an iterator pointing on a null element. 
    \return Iterator pointing on a null value at the end of the map
    */
	Iterator End() const
	{
		Iterator lIt( this, 0, NULL );
		return lIt;
	}

private:

    // Avoid calculating the hashvalue twice
	const Iterator InternalFind( const KeyType& pKey, unsigned int& pOutCalculatedIndex ) const
	{
		pOutCalculatedIndex = mHashFunctor(pKey);
		unsigned int lIndex = pOutCalculatedIndex % mBuckets.GetCount();
		ListItem* lItem = mBuckets[lIndex];
		while( lItem )
		{
            if( Comparator::CompareIt( lItem->mKey, pKey ) )
			{
				Iterator lIt( this, lIndex, lItem );
				return lIt;
			}
			lItem = lItem->mNext;
		}
		
		return End();
	}


	// not implemented yet!
	FbxHashMap( const FbxHashMap& pOther ) {};

	FbxArray<ListItem*> mBuckets;
	HashFunctorType mHashFunctor;

	friend class Iterator;
};

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_CORE_BASE_HASHMAP_H_ */
