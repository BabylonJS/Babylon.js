/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxoperatorentryview.h
#ifndef _FBXSDK_SCENE_SHADING_OPERATOR_ENTRY_VIEW_H_
#define _FBXSDK_SCENE_SHADING_OPERATOR_ENTRY_VIEW_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/scene/shading/fbxentryview.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

class FbxBindingTableEntry;

/** FbxOperatorEntryView represents binding operator entry in entry tables.
  * The binding operator can be used as source or destination for the binding entry.
  * \see FbxBindingTableEntry and FbxBindingTable.
  * \nosubgrouping
  */
class FBXSDK_DLL FbxOperatorEntryView : public FbxEntryView
{
public:
	/** Name of the entry type used in the binding entry.
	* It should be "FbxOperatorEntry" in this case.
	*/
	static const char* sEntryType;

	/** Constructor.
	* \param pEntry           The binding table entry to create the entry view for.
	* \param pAsSource        \c true to create the entry view as source, \c false as destination.
	* \param pCreate          \c true to create the entry view, \c false otherwise.
	*/
	FbxOperatorEntryView( FbxBindingTableEntry* pEntry, bool pAsSource, bool pCreate = false );
	
	//! Destructor.
	~FbxOperatorEntryView();

	/** Get the operator name from the binding entry.
	*   \return The operator name.
	*/
	const char* GetOperatorName() const;

	/** Set the operator name to the binding entry.
	*   \param pName The operator name to set.
	*/
	void SetOperatorName(const char* pName);

	/** Get the entry type.
	* \return       Entry type as string "FbxOperatorEntry".
	* \remarks Always use EntryType() to get the right entry type.
	*/
	virtual const char* EntryType() const;
};

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_SCENE_SHADING_OPERATOR_ENTRY_VIEW_H_ */
