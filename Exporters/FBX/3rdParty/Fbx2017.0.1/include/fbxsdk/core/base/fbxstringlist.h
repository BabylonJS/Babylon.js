/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxstringlist.h
#ifndef _FBXSDK_CORE_BASE_STRING_LIST_H_
#define _FBXSDK_CORE_BASE_STRING_LIST_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/core/base/fbxarray.h>
#include <fbxsdk/core/base/fbxstring.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

//! Wraps a string (FbxString) and a pointer (FbxHandle).
class FbxStringListItem
{
public:
    FbxStringListItem(){ mReference = 0; }
    FbxStringListItem(const char* pString, FbxHandle pRef=0){ mString = pString; mReference = pRef; }

    FbxString	mString; 
    FbxHandle		mReference;
};

inline int FbxCompareStringListSort(const void* E1, const void* E2)
{
	return FBXSDK_stricmp((*(FbxStringListItem**)E1)->mString.Buffer(), (*(FbxStringListItem**)E2)->mString.Buffer());
}

inline int FbxCompareStringListFindEqual(const void* E1, const void* E2)
{
	return FBXSDK_stricmp((*(FbxStringListItem*)E1).mString.Buffer(), (*(FbxStringListItem**)E2)->mString.Buffer());
}

inline int FbxCompareCaseSensitiveStringList(const void *E1,const void *E2)
{
	return strcmp((*(FbxStringListItem*)E1).mString.Buffer(), (*(FbxStringListItem**)E2)->mString.Buffer());
}
 
//! Base class of FbxStringList.
template <class Type> class FbxStringListT
{
protected:
    FbxArray<Type*> mList;

public:
	/**
     * \name Operation With The Array 
     */
   //@{

	 /** Append a item at the end of the array.
    * \return Index of appended pointer.
    */
    int		AddItem( Type* pItem )		{ return mList.Add( pItem ); }

    /** Insert a item in the array.
    * \param pIndex Position where to insert the item.
    * \param pItem  Item to insert.
    * \return Position of the inserted item in the array.
    * \remarks If the given index is out of range, the pointer is appended at the end of the array.
    */
	int		InsertItemAt( int pIndex, Type* pItem )	{ return mList.InsertAt( pIndex, pItem ); }

	//! Access item at given index.
    Type*   GetItemAt( int pIndex )	const	{ return mList[pIndex]; }

	/** Find first matching item.
    * \return Index of first matching item found or -1 if there is no matching element.
    */
    int		FindItem( Type* pItem )	const	{ return mList.Find( pItem ); }
	//}@

public : 
    /**
     * \name Constructor and Destructor
     */
   //@{

	//! Default constructor.
    FbxStringListT()
    {
    }

	//! Destructor.
    virtual ~FbxStringListT() { Clear(); }
	//}@

	//!Remove the item at the end of the array and delete the associated object.
    void RemoveLast() { RemoveAt( mList.GetCount()-1 ); }

	/** Get number of items in the array.
     * \return The number of items in the array.
     */
    inline int		GetCount() const { return mList.GetCount(); }

	//! Access the string in the item at given index.
    FbxString&   operator[](int pIndex) { return mList[pIndex]->mString; }

    //! Access the value of reference in the item at given index.
    FbxHandle		GetReferenceAt(int pIndex) const { return mList[pIndex]->mReference; }

    //! Set the value of reference at given index.        
    void			SetReferenceAt(int pIndex, FbxHandle pRef) { mList[pIndex]->mReference = pRef; }

	//! Access the pointer of string at given index.
    char*		GetStringAt(int pIndex) const { if (pIndex<mList.GetCount()) return mList[pIndex]->mString.Buffer(); else return NULL; }
    
	//! Set string at given index.
	virtual bool	SetStringAt(int pIndex, const char* pString) 
    { 
	    if (pIndex<mList.GetCount()) 
	    {
		    mList[pIndex]->mString = pString; 
		    return true;
	    } else return false; 
    }
   
    /** Find first matching item.
    * \return Index of first matching item found or -1 if  there is no
    * matching element.
    */
    int Find( Type& pItem ) const
    { 
	    for (int Count=0; Count<mList.GetCount(); Count++) {
		    if (mList[Count]==&pItem) {
			    return Count;
		    }
	    }
	    return -1;
    }

	/** Find first matching item which has the same reference as given parameter.
    * \return Index of first matching item found or -1 if  there is no
    * matching element.
    */
    int FindIndex( FbxHandle pReference ) const
    { 
	    for (int Count=0; Count<mList.GetCount(); Count++) {
		    if (mList[Count]->mReference==pReference) {
			    return Count;
		    }
	    }
	    return -1;
    }

	/** Find first matching item in array whose string address is the same as given pointer.
    * \return Index of first matching item found or -1 if  there is no
    * matching element.
    */
    int FindIndex( const char* pString ) const
    { 
	    for (int lCount=0; lCount<mList.GetCount(); lCount++) {
		    if (mList[lCount]->mString==pString) {
			    return lCount;
		    }
	    }
	    return -1;
    }

	/** Access the value of reference of the first matching item in array 
	* whose string address is the same as given pointer.
    * \return The value of reference of the first matching item found or NULL if  there is no
    * matching element.
    */
    FbxHandle FindReference(const char* pString ) const
    {
    int lIndex = FindIndex( pString );
	    if (lIndex!=-1) {
		    return mList[lIndex]->mReference;
	    }
	    return 0; // NULL
    }

	//! Remove first matching item.
    bool Remove ( Type& pItem )
    {
    int lIndex = Find( pItem );
        if (lIndex>=0) {
		    RemoveAt( lIndex );
		    return true;
	    }
	    return false;
    }

	//! Remove first matching item in array whose string address is the same as given pointer.
    bool Remove (const char* pString )
    {
    int lIndex = FindIndex( pString );
        if (lIndex>=0) {
		    RemoveAt( lIndex );
		    return true;
	    }
	    return false;
    }

	//! Remove first matching item.
    bool RemoveIt ( Type& pItem )
    {
    int lIndex = Find( pItem );
        if (lIndex>=0) {
		    RemoveAt( lIndex );
		    return true;
	    }
	    return false;
    }

	//! Sort the array by the string of every item,not case sensitive.
    void Sort( )
    {
	    qsort( &(mList.GetArray()[0]),mList.GetCount(),sizeof(FbxStringListItem*),FbxCompareStringListSort );
    }

    /** Find first matching item which has the same string as given parameter,not case sensitive.
    * \return the pointer of matching item found or NULL if  there is no
    * matching element.
	* \remark To cast the returned pointer to the FbxStringListItem you need a double indirection: (FbxStringListItem**)
    */
	void* FindEqual(const char* pString) const
    {
    FbxStringListItem Key(pString);  
    
	    if (mList.GetCount() != 0)
	    {
		    return bsearch ( &Key, &(mList.GetArray()[0]),mList.GetCount(),sizeof(FbxStringListItem*),FbxCompareStringListFindEqual );
	    }
	    else
	    {
		    return NULL ;
	    }
    }

	/** Find first matching item which has the same string as given parameter, case sensitive.
    * \return the pointer of matching item found or NULL if  there is no
    * matching element.
	* \remark To cast the returned pointer to the FbxStringListItem you need a double indirection: (FbxStringListItem**)
    */
	void* FindCaseSensitive(const char* pString) const
	{
    FbxStringListItem Key(pString);  
    
	    if (mList.GetCount() != 0)
	    {
		    return bsearch ( &Key, &(mList.GetArray()[0]),mList.GetCount(),sizeof(FbxStringListItem*), FbxCompareCaseSensitiveStringList);
	    }
	    else
	    {
		    return NULL ;
	    }
	
	}


	//! Add a new item at the end of array.
    int Add( const char* pString, FbxHandle pItem=0 ) 
    { 
	    return InsertAt( mList.GetCount(),pString,pItem ); 
    }

    virtual int InsertAt( int pIndex, const char* pString, FbxHandle pItem=0 ) 
    { 
	    return mList.InsertAt( pIndex,FbxNew< Type >( pString,(FbxHandle)pItem )); 
    }

    /** Remove the item at the given position in the array and delete the associated object.
    * \param pIndex Position of the item to remove.
    * \remarks If the index is not valid, nothing is performed. Otherwise,
    * the item is removed from the array and the items are shifted to fill the
    * empty slot.
    */
	virtual void RemoveAt(int pIndex)
    { 
	    FbxDelete(mList.RemoveAt(pIndex));
    }

	//! Delete the array.
    virtual void Clear()
    {
		FbxArrayDelete(mList);
    }

	/** Get the string of all the item.
    * \return The text of string, each item's string separated by '~'.
    */
   virtual void GetText(FbxString& pText) const
    {
	    int	lCount;
	    for (lCount=0; lCount<mList.GetCount(); lCount++) 
        {
            pText += mList[lCount]->mString;
            if (lCount<mList.GetCount()-1) 
            {               
                pText += "~";               
            }
	    }
    }

    /** Clear the array and set the array's new items with the substring separated by '~' from the given string.
    * \param pList The string which used to generate the new items.
	* \return The last index of the item in the new array.
    * \remarks The number of items in the new array is the same as the number of substrings, 
	* and the string of each item is decided by the content of each substring.
    */ 
    virtual int SetText(const char* pList)
    {
    int		lPos=0, lOldPos = 0;
    int		lLastIndex=0;
    FbxString	lName=pList;

	    Clear();
	    for (lPos=0; lName.Buffer()[lPos]!=0; lPos++) {
    	    if (lName.Buffer()[lPos]=='~') {
        	    lName.Buffer()[lPos]=0;
        	    lLastIndex = Add(lName.Buffer()+lOldPos);
        	    lOldPos=lPos+1;
    	    }
	    }

	    if(lOldPos != lPos)
	    {
	        lLastIndex = Add(lName.Buffer()+lOldPos);
	    }
	    return lLastIndex;
    } 


};

/** Array that stores pairs of FbxString and a pointer.
  */
class FBXSDK_DLL FbxStringList : public FbxStringListT<FbxStringListItem>
{
public:
	/**
	  * \name Constructors
	  */
	//@{
		//! Default constructor.
		FbxStringList(); 

		//! Copy constructor.
		FbxStringList( const FbxStringList& pOriginal );
	//@}

	/**
	 * \name Assignment Operators
	 */
	//@{
		//! FbxStringList assignment function.
		void CopyFrom( const FbxStringList* pOriginal  );

		//! FbxStringList assignment operator.
		FbxStringList& operator=(const FbxStringList& pOriginal);
	//@}
};
	  
#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_CORE_BASE_STRING_LIST_H_ */
