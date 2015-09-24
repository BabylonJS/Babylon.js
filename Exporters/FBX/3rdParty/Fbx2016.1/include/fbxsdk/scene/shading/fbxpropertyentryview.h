/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxpropertyentryview.h
#ifndef _FBXSDK_SCENE_SHADING_PROPERTY_ENTRY_VIEW_H_
#define _FBXSDK_SCENE_SHADING_PROPERTY_ENTRY_VIEW_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/scene/shading/fbxentryview.h>
#include <fbxsdk/scene/shading/fbxbindingtableentry.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

/** FbxPropertyEntryView represents property entry in entry tables.
  * The property can be used as source or destination for the binding entry.
  * Use this class to manipulate binding table's attributes.
  *
  * \code Here is a code snippet to show how it used.
  * FbxProperty lProp;
  * FbxBindingTable lTable;
  * FbxBindingTableEntry& lEntry = lBindingTable.AddNewEntry();
  * FbxPropertyEntryView lView( lEntry, true, true);
  * lView.SetProperty( lProp.GetName());
  * \endcode
  * 
  * \see FbxBindingTableEntry and FbxBindingTable.
  *
  * \nosubgrouping
  */
class FBXSDK_DLL FbxPropertyEntryView : public FbxEntryView
{
public:
	
	/** Name of the entry type used in the binding entry.
	* It should be "FbxPropertyEntry" in this case.
	*/
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
	FbxPropertyEntryView( FbxBindingTableEntry* pEntry, bool pAsSource, bool pCreate = false );

	//! Destructor.
	~FbxPropertyEntryView();
    //@}

	/** Get the property name from the binding entry.
	*   \return The property name.
	*/
	const char* GetProperty() const;

	/** Set the property name to the binding entry.
	*   \param pPropertyName The property name to set.
	*/
	void SetProperty(const char* pPropertyName);

	/** Get the entry type.
	* \return       Entry type as string "FbxPropertyEntry".
	* \remarks Always use EntryType() to get the right entry type.
	*/
	virtual const char* EntryType() const;
};

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_SCENE_SHADING_PROPERTY_ENTRY_VIEW_H_ */
