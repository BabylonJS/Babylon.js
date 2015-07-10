/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxsemanticentryview.h
#ifndef _FBXSDK_SCENE_SHADING_SEMANTIC_ENTRY_VIEW_H_
#define _FBXSDK_SCENE_SHADING_SEMANTIC_ENTRY_VIEW_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/scene/shading/fbxentryview.h>
#include <fbxsdk/scene/shading/fbxbindingtableentry.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

/** FbxSemanticEntryView stores a binding corresponding to
 * a semantic within a shader file.
 * A shader semantic is a parameter, a constant or an operator.
 * So a shader semantic could bind with FbxProperty ( parameter, constant) and FbxBindingOperator (operator).
 *
 * Here is a code snippet to show how it used.
 * \code 
 * FbxProperty lProp;
 * FbxBindingTable lTable;
 * FbxBindingTableEntry& lEntry = lBindingTable.AddNewEntry();
 * FbxPropertyEntryView lSrcView( lEntry, true, true);
 * lSrcView.SetProperty( lProp.GetHierarchicalName());
 * FbxSemanticEntryView lDstView( &pEntry, false, true );
 * lDstView.SetSemantic( lProp.Getname());
 * \endcode
 *
 * \see FbxBindingTableEntry and FbxBindingTable.
 * \nosubgrouping
 */
class FBXSDK_DLL FbxSemanticEntryView : public FbxEntryView
{
public:

	/** Name of the entry type used in the binding entry.
	* It should be "FbxSemanticEntry" in this case.
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
	FbxSemanticEntryView (FbxBindingTableEntry* pEntry, bool pAsSource, bool pCreate = false);

    //! Destructor.
	virtual ~FbxSemanticEntryView();
    //@}

    /** Set the semantic to the binding entry.
    *   \param pSemantic The semantic string to set.
    */
	void SetSemantic( const char* pSemantic );

    /** Get the semantic from the binding entry.
    *   \param  pAppendIndex \c true if the returned semantic append a index, \c false otherwise.
    *   \return The semantic.
    */
	FbxString GetSemantic(bool pAppendIndex = true) const;

    /** Get the semantic index suffix.
    *   \return Semantic index suffix.
    */
	int GetIndex() const;

	/** Get the entry type.
	* \return       Entry type as string "FbxSemanticEntry".
	* \remarks Always use EntryType() to get the right entry type.
	*/
	virtual const char* EntryType() const;
};

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_SCENE_SHADING_SEMANTIC_ENTRY_VIEW_H_ */
