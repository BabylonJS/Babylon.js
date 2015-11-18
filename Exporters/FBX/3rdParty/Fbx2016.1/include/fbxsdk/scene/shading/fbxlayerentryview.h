/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxlayerentryview.h
#ifndef _FBXSDK_SCENE_SHADING_LAYER_ENTRY_VIEW_H_
#define _FBXSDK_SCENE_SHADING_LAYER_ENTRY_VIEW_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/scene/shading/fbxentryview.h>
#include <fbxsdk/scene/shading/fbxbindingtableentry.h>
#include <fbxsdk/scene/geometry/fbxlayer.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

class FbxLayerContainer;

/** FbxLayerEntryView encodes a layer element representation (the index of the layer, the type of the layer
  * element and whether the layer element is a UVSet layer element) to a string stored in FbxBindingTableEntry
  * and decodes the string back to a layer element representation.
  * This class is used in combination with FbxBindingTableEntry to represent a source or a destination
  * FbxLayerElement.
  * \see FbxBindingTableEntry and FbxBindingTable.
  */
class FBXSDK_DLL FbxLayerEntryView : public FbxEntryView
{
public:

    /** Name of the entry type used in the binding entry.
	  * It should be "FbxLayerEntry" in this case.
	  */
	static const char* sEntryType;

	/** Constructor.
	* \param pEntry           The binding table entry to create the entry view for.
	* \param pAsSource        \c true to create the entry view as source, \c false as destination.
	* \param pCreate          \c true to create the entry view, \c false otherwise.
	*/
	FbxLayerEntryView(FbxBindingTableEntry* pEntry, bool pAsSource, bool pCreate = false );

	//! Destructor.
	virtual ~FbxLayerEntryView();

	/** Set the layer element for the binding entry.
	  * \param pLayerIndex      LayerElement index.
	  * \param pType            LayerElement type.
	  * \param pUVSet           Whether this is a UVSet LayerElement.
	  */
	void SetLayerElement( int pLayerIndex, FbxLayerElement::EType pType, bool pUVSet );

	/** Get the layer element for binding entry.
      * \param pLayerIndex      LayerElement index.
      * \param pType            LayerElement type.
      * \param pUVSet           Whether this is a UVSet LayerElement.
	  */
	void GetLayerElement( int &pLayerIndex, FbxLayerElement::EType& pType, bool& pUVSet ) const;

	/** Get the layer element for binding entry.
	  * \param pContainer           FbxLayerContainer to get the layer element from.
	  * \return                     The layer element for binding entry.
	  */
	FbxLayerElement* GetLayerElement( FbxLayerContainer* pContainer ) const;

	/** Get the entry type.
	  * \return       Entry type as string "FbxLayerEntry".
	  * \remarks Always use EntryType() to get the right entry type.
	  */
	virtual const char* EntryType() const;

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
protected:
	static const char* sDelimiter;
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_SCENE_SHADING_LAYER_ENTRY_VIEW_H_ */
