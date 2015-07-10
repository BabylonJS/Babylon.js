/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxlibrary.h
#ifndef _FBXSDK_SCENE_LIBRARY_H_
#define _FBXSDK_SCENE_LIBRARY_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/scene/fbxdocument.h>
#include <fbxsdk/scene/fbxobjectfilter.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

class FbxLocalizationManager;
class FbxCriteria;

/** This library class represents libraries that store sub-libraries and shading objects.
  * Shading objects are objects of class FbxTexture, FbxSurfaceMaterial, and FbxLight.
  * \nosubgrouping
  */
class FBXSDK_DLL FbxLibrary : public FbxDocument
{
    FBXSDK_OBJECT_DECLARE(FbxLibrary, FbxDocument);

public:
    //! Returns a pointer to the parent library if one exists.
    FbxLibrary* GetParentLibrary(void) const;

    /** Sets whether not this library is a system library.
      * \param pSystemLibrary       A flag which indicates whether or not this library is a system library.
      */
    void SystemLibrary(bool pSystemLibrary);

    //! Returns whether or not this library is a system library.
    bool IsSystemLibrary() const;

    /** The prefix must not include the dash and language code, nor
      * can it contain the extension.  But if you want, it can contain 
      * a folder or sub-folder, such as: locales/mydocloc.
      * This is resolved using the XRef Manager, with priority
      * given to the library's ".fbm" folder, if one exists.
	  * \param pPrefix              New prefix to be set.
      */
    void LocalizationBaseNamePrefix(const char* pPrefix);

	//! Retrieves the localization prefix.
    FbxString LocalizationBaseNamePrefix() const;

    // =======================================================================
    //
    // sub-library
    //
    // =======================================================================

    /** Adds a sub-library
	  * \param pSubLibrary          The sub-library to be added.
      * \return                     \c True if adding the sub-library is successful, returns \c false if not.
	  */
    bool AddSubLibrary(FbxLibrary* pSubLibrary);

    /** Removes a sub-library
	  * \param pSubLibrary          The sub-library to be removed.
	  * \return                     \c True if the sub-library is removed, \c false if not.
	  */
    bool RemoveSubLibrary(FbxLibrary* pSubLibrary);

    //! Returns the total number of sub-libraries
    int GetSubLibraryCount(void) const;

    /** Returns the sub-library at the specified index. 
	  * \param pIndex               The sub-library index.
	  */
    FbxLibrary* GetSubLibrary(int pIndex) const;

    /** Clones the specified asset. 
      * \param pToClone             The asset to be cloned.
      * \param pOptionalDestinationContainer    The container for the asset copy.
      * \remarks                    The asset and all its dependents are cloned.               
      */
    FbxObject* CloneAsset( FbxObject* pToClone, FbxObject* pOptionalDestinationContainer = NULL) const;

    
    /** Returns a criteria filter which you can use to filter objects
      * when iterating items in the library. Only real 'assets' are returned,
      * rather than FBX support objects.  This currently includes
      * lights, environments, materials and textures (maps).
      * This is typically used to IMPORT from a library.
      */
    static FbxCriteria GetAssetCriteriaFilter();

    /** Returns a filter which you should use when you clone / export objects. 
      * This filters out objects that should remain in the asset library.
      *
      * Use this to EXPORT from a library (or CLONE from a library).
      */
    static FbxCriteria GetAssetDependentsFilter();

    /** Transfers ownership from the source library to this library for any assets passing through the filter.
      * It is assumed that name conflicts and other details have been resolved beforehand.
      *
      * External asset files required by the assets are copied (not moved). It's
      * up to the owner of the source library to clean up the files if the files are
      * not on a read-only transport. If this document hasn't been committed yet,
      * the assets will not be copied.
      *
      * Returns true if no filtered assets were skipped.  If no assets pass through 
      * the filter, it returns true, because nothing has been skipped.
      *
      * This may leave the source library in an invalid state. For example, the source library 
      * would be in an invalid state if you had decided to transfer texture objects to the library,
      * but materials were kept in the source library.
      *
      * To safeguard against this, the transfer disconnects objects, and thus materials
      * are left without textures.
      *
      * When you transfer an object, all its dependents come with it.  If you move
      * a material, it takes the associated textures as well. Although if you moved a texture, 
      * the material would not be transferred with it.
	  * \param pSrcLibrary          The source library to be imported.
      * \return                     \c True if no filtered assets are skipped.
      **/
    bool ImportAssets(FbxLibrary* pSrcLibrary);

    /** Transfers ownership from the source library to this library for any assets passing through the filter.
      * It is assumed that name conflicts and other details have been resolved beforehand.
      *
      * External asset files required by the assets are copied (not moved). It's
      * up to the owner of the source library to clean up the files if the files are
      * not on a read-only transport. If this document hasn't been committed yet,
      * the assets will not be copied.
      *
      * Returns true if no filtered assets were skipped.  If no assets pass through 
      * the filter, it returns true, because nothing has been skipped.
      *
      * This may leave the source library in an invalid state. For example, the source library 
      * would be in an invalid state if you had decided to transfer texture objects to the library,
      * but materials were kept in the source library.
      *
      * To safeguard against this, the transfer disconnects objects, and thus materials
      * are left without textures.
      *
      * When you transfer an object, all its dependents come with it.  If you move
      * a material, it takes the associated textures as well. Although if you moved a texture, 
      * the material would not be transferred with it.
	  * \param pSrcLibrary          The source library to be imported.
	  * \param pAssetFilter         The asset filter.
      * \return                     \c True if no filtered assets are skipped.
      **/
    bool ImportAssets(FbxLibrary* pSrcLibrary, const FbxCriteria& pAssetFilter);


    /** Returns a new instance of a library member.
      * This instantiates the first object found that matches the filter.
      * \param pFBX_TYPE            The type of member
      * \param pFilter              A user specified filter
      * \param pRecurse             A flag that indicates whether to check sub-libraries
      * \param pOptContainer        Optional container for the cloned asset
      * \return                     A new instance of the member. Note that the new member is not included with this library.
      */
    template < class T > T* InstantiateMember( const T* pFBX_TYPE, const FbxObjectFilter& pFilter, bool pRecurse = true, FbxObject* pOptContainer = NULL);


	// =======================================================================
	//
	// Localization
	//
	// =======================================================================
    /** Returns the localization manager for the library.
      */

    FbxLocalizationManager& GetLocalizationManager() const;

    /** Localization helper function. Calls the FBX SDK manager implementation.
      * Sub-classes that manage their own localization can over-ride this function.
      * \param pID                  The identifier for the text to localize.
      * \param pDefault             The default text. Uses pID if NULL.
      * \return                     The potentially localized text. May return the parameter passed in.
    */
    virtual const char* Localize( const char* pID, const char* pDefault = NULL ) const;

    // =======================================================================
    //
    // Shading Object
    //
    // =======================================================================

    /** Adds a shading object.
	  * \param pShadingObject       The shading object to be added.
	  */
    bool AddShadingObject(FbxObject* pShadingObject);

    /** Removes a shading object.
	  * \param pShadingObject       The shading object to be removed.
	  */
    bool RemoveShadingObject(FbxObject* pShadingObject);

    //! Returns the total number of shading objects
    int GetShadingObjectCount(void) const;

    /** Returns the shading object at the specified index.
	  * \param pIndex               Shading object index. 
	  * \return                     The shading object located at the specified index.
	  */
    FbxObject* GetShadingObject(int pIndex) const;

    /** Returns the number of shading objects according to their implementations.
      * \param pCriteria            Filtering criteria that identifies what kind of
      *                             implementations to consider.
      * \returns                    The number of shading objects corresponding to the filtering parameters
      */
    int GetShadingObjectCount(const FbxImplementationFilter& pCriteria) const;

    /** Returns a handle on the shading object at the specified index that corresponds to the given filtering parameters.
      * \param pIndex               Shading object index.
      * \param pCriteria            Filtering criteria that identifies what kind of
      *                             implementations to consider.
      * \returns                    A handle on the shading object at the specified index that corresponds to the given filtering parameters.
      */
    FbxObject* GetShadingObject(int pIndex, const FbxImplementationFilter& pCriteria) const;

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
protected:
	virtual void Construct(const FbxObject* pFrom);
	virtual void Destruct(bool pRecursive);

	mutable FbxLocalizationManager* mLocalizationManager;
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS

template <class T> T* FbxLibrary::InstantiateMember(const T* pFBX_TYPE, const FbxObjectFilter& pFilter, bool pRecurse, FbxObject* pOptContainer)
{
	//First check all materials in the library.
	for( int i = 0; i < GetMemberCount<T>(); ++i )
	{
		T* lObject = GetMember<T>(i);
		if( pFilter.Match(lObject) )
			return FbxCast<T>(CloneAsset(lObject,pOptContainer));
	}

	if( pRecurse )
	{
		// then check all materials in each sub-library.
		for( int i = 0; i < GetMemberCount<FbxLibrary>(); ++i )
		{
			FbxLibrary* lLibrary = GetMember<FbxLibrary>(i);
			T* lClonedObject = lLibrary->InstantiateMember(pFBX_TYPE, pFilter, pRecurse, pOptContainer);
			if( lClonedObject )
				return lClonedObject;
		}
	}

	return NULL;
}

class FBXSDK_DLL FbxEventPopulateSystemLibrary : public FbxEvent<FbxEventPopulateSystemLibrary>
{
	FBXSDK_EVENT_DECLARE(FbxEventPopulateSystemLibrary)

public:			
	FbxEventPopulateSystemLibrary(FbxLibrary* pLibrary) { mLibrary = pLibrary; }
	inline FbxLibrary* GetLibrary() const { return mLibrary; }

private:
	FbxLibrary* mLibrary;
};

class FBXSDK_DLL FbxEventUpdateSystemLibrary : public FbxEvent<FbxEventUpdateSystemLibrary>
{
	FBXSDK_EVENT_DECLARE(FbxEventUpdateSystemLibrary)

public:
	FbxEventUpdateSystemLibrary(FbxLibrary *pLibrary) { mLibrary = pLibrary; }
	inline FbxLibrary* GetLibrary() const { return mLibrary; }

private:
	FbxLibrary* mLibrary;
};

class FBXSDK_DLL FbxEventWriteLocalization : public FbxEvent<FbxEventWriteLocalization>
{
	FBXSDK_EVENT_DECLARE(FbxEventWriteLocalization)

public:
	FbxEventWriteLocalization(FbxLibrary* pAssetLibrary) { mAssetLibrary = pAssetLibrary; }
	inline FbxLibrary* GetLibrary() const { return mAssetLibrary; }

private:
	FbxLibrary* mAssetLibrary;
};

class FBXSDK_DLL FbxEventMapAssetFileToAssetObject : public FbxEvent<FbxEventMapAssetFileToAssetObject>
{
	FBXSDK_EVENT_DECLARE(FbxEventMapAssetFileToAssetObject)

public:
	FbxEventMapAssetFileToAssetObject(const char* pFile) :
		mAsset(NULL),
		mFilePath( pFile )
	{
	}

	inline const char* GetFilePath() const { return mFilePath; }
	mutable FbxObject* mAsset;

private:
	FbxString mFilePath;
};

#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_SCENE_LIBRARY_H_ */
