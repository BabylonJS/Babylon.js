/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxtakeinfo.h
#ifndef _FBXSDK_SCENE_TAKEINFO_H_
#define _FBXSDK_SCENE_TAKEINFO_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/core/base/fbxarray.h>
#include <fbxsdk/core/base/fbxstring.h>
#include <fbxsdk/core/base/fbxtime.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

class FbxThumbnail;

/** This FbxTakeLayerInfo structure is used to identify a layer by name and id number.
  */ 
struct FbxTakeLayerInfo
{
	FbxString	mName;
	int			mId;
};

/** This class contains take information from an imported file
  * or exported to an output file.
  *
  * A "take" is in fact a group of animation data grouped by name, so
  * the FBX file format can support many "animation takes" in an FBX file to mimic
  * how a movie is produced by making many takes of the same scene.
  *
  * The most used data is the "take name", other data are rarely used.
  * Example of use: to get the list of all 
  * animation take names of FBX file without loading all the scene content.
  * When a FbxImporter is initialized, the take information can be read and can be available
  * before the long Import() step, this way, we can get the take info data very fast 
  * since we don't need to load all the animation scene data.
  * \code
  * // Ex: to get all take names in a FBX file
  * for(int lAnimStackCount=0; lAnimStackCount < lImporter->GetAnimStackCount(); lAnimStackCount++) 
  * {
  *   FbxTakeInfo* lTakeInfo = lImporter->GetTakeInfo(lAnimStackCount);
  *   FbxString lTakeName = lTakeInfo->mName;
  * }
  * \endcode 
  */
class FBXSDK_DLL FbxTakeInfo
{
public:

	/** Default constructor.
	  */
	FbxTakeInfo();

    /** Destructor.
	  */
	virtual ~FbxTakeInfo();

    /** Copy Constructor.
      * \param pTakeInfo        The take information to be copied. 
      */
	FbxTakeInfo(const FbxTakeInfo& pTakeInfo);

    /** Assignment operator.
      * \param pTakeInfo        The take information to be assigned. . 
      */
	FbxTakeInfo& operator=(const FbxTakeInfo& pTakeInfo);

	//! Take name.
	FbxString mName;

	/** The take name once it is imported in a scene.
	  * You can modify it if it must be different from the take name in the imported file.
	  * \remarks                This field is only used when importing a scene.
	  */
	FbxString mImportName;

	//! Take description.
	FbxString mDescription;

	/** Import/export flag.
	  * Set to \c true by default, set to \c false if the take must not be imported or exported.
	  */
	bool mSelect;

	//! Local time span, set to animation interval if it is left at the default value.
	FbxTimeSpan mLocalTimeSpan;

	//! Reference time span, set to animation interval if it is left at the default value.
	FbxTimeSpan mReferenceTimeSpan;

	/** Time value for offsetting the animation keys once they are imported in a scene.
	  * You can modify it if you need the animation of a take to be offset.
	  * The effect depends on the state of \c mImportOffsetType.
	  * \remarks                This field is only used when importing a scene.
	  */
	FbxTime mImportOffset;

	/** \enum  EImportOffsetType       Import offset types.
	  * - \e eAbsolute
	  * - \e eRelative
	  */
	enum EImportOffsetType
	{
		eAbsolute,
		eRelative
	};

	/** Import offset type.
	  * If set to \c eAbsolute, \c mImportOffset gives the absolute time of 
	  * the first animation key and the appropriate time shift is applied 
	  * to all of the other animation keys.
	  * If set to \c eRelative, \c mImportOffset gives the relative time 
	  * shift applied to all animation keys.
	  */
	EImportOffsetType mImportOffsetType;

    /** Copies the layer information from the take information.
      * \param pTakeInfo          The take information to be copied.
      */
	void CopyLayers(const FbxTakeInfo& pTakeInfo);

    //! List of each layer's information.
	FbxArray<FbxTakeLayerInfo*>	mLayerInfoList;

    //! Current Layer.
	int							mCurrentLayer;
};

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_SCENE_TAKEINFO_H_ */
