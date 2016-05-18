/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxentryview.h
#ifndef _FBXSDK_SCENE_SHADING_ENTRY_VIEW_H_
#define _FBXSDK_SCENE_SHADING_ENTRY_VIEW_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

class FbxBindingTableEntry;

/** Entry view class represents binding entry in entry tables.
  * \see FbxBindingTableEntry and FbxBindingTable.
  * \nosubgrouping
  */
class FBXSDK_DLL FbxEntryView
{
public:
	
    //! Entry type.
	static const char* sEntryType;

    /**
    * \name Constructor and Destructor.
    */
    //@{

	/** Constructor.
	* \param pEntry           The binding table entry to create the entry view for.
	* \param pAsSource        \c true to create the entry view as source, \c false as destination.
	* \param pCreate          \c true to create the entry view, \c false otherwise.
	*/
	FbxEntryView( FbxBindingTableEntry* pEntry, bool pAsSource, bool pCreate = false );

	//! Destructor.
	virtual ~FbxEntryView();
    //@}


	/** Check whether this entry view is valid or not.
	  * If this entry view corresponds with an valid entry which is not NULL, and the
	  * entry type of this entry view is the same as that of the entry it corresponds with,
	  * then this entry view is valid.
	  * \return     \c true if the entry view is valid, \c false otherwise.
	  */
	virtual bool IsValid() const;

	/** Create a new entry view.
	  * \return     \c true if the entry view is created successfully, \c false otherwise.
	  */
	virtual bool Create();

	/** Get the entry type of this entry view.
	  */
	virtual const char* EntryType() const;

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
protected:
	bool mAsSource;
	FbxBindingTableEntry* mEntry;
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_SCENE_SHADING_ENTRY_VIEW_H_ */
