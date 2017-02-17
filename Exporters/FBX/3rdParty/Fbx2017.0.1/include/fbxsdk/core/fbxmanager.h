/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxmanager.h
#ifndef _FBXSDK_CORE_MANAGER_H_
#define _FBXSDK_CORE_MANAGER_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/core/fbxobject.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

class FbxIOSettings;
class FbxIOPluginRegistry;
class FbxAnimEvaluator;
class FbxSceneReference;
class FbxUserNotification;
class FbxMessageEmitter;
class FbxLocalizationManager;
class FbxXRefManager;
class FbxManager_internal;

#ifndef FBXSDK_ENV_WINSTORE
	class FbxPlugin;
#endif

/** SDK object manager.
  *   The SDK manager is in charge of:
  *     \li scene element allocation, for example, FbxScene::Create(pSdkManager, "").
  *     \li scene element deallocation, call FbxManager::Destroy() to deallocates all object created by the SDK manager.
  *     \li scene element search and access, please see \ref GlobalObjectManagement section.
  *
  * It is possible to override memory allocation functions throughout the FBX SDK by
  * providing system memory allocation functions using the handler set functions below.
  * It must be done before the first FbxManager creation.
  *
  *	FbxSetMallocHandler();
  * FbxSetCallocHandler();
  * FbxSetReallocHandler();
  * FbxSetFreeHandler();
  *
  * Upon destruction, all objects allocated by the SDK manager and not explicitly destroyed are destroyed as well. 
  * A derived class can be defined to allocate and deallocate specialized scene elements.
  * \remarks You could create more than one SDK manager. However, it's better to NOT share the same object among different managers.
  * \nosubgrouping
  */
class FBXSDK_DLL FbxManager
{
public:
	/**
	  * \name FBX SDK Manager Creation/Destruction
	  */
	//@{
		/** SDK manager allocation method.
		  * \return A pointer to the SDK manager or \c NULL if this is an
		  * evaluation copy of the FBX SDK and it is expired.
		  */
		static FbxManager* Create();

		/** Destructor.
		  * Deallocates all object previously created by the SDK manager.
		  */
		virtual void Destroy();
	//@}

	/**
	  * \name Versions Queries
	  */
	//@{
		/** Get FBX SDK version string.
		  * \param pFull	If true, the complete version string including revision number and release date will be returned,
		  *					otherwise only the version numbering is returned.
		  */
		static const char* GetVersion(bool pFull=true);

		/** Get the current default FBX file format version number for this version of the FBX SDK.
		  * \param pMajor        Version major number.
		  * \param pMinor        Version minor number.
		  * \param pRevision     Version revision number.
		  */
		static void GetFileFormatVersion(int& pMajor, int& pMinor, int& pRevision);
	//@}


	/**
	  * \name Object Registration, Definition and Management
	  */
	//@{
		/** Class registration.
		  * \param pName				The class name. For example, "FbxMesh" for FbxMesh class.
		  * \param T1					FBX type of the specified class.
		  * \param T2					FBX type of parent class.
		  * \param pFbxFileTypeName     The type name of the class in FBX file.
		  * \param pFbxFileSubTypeName  The sub type name of the class in FBX file.
		  * \return The class Id of the newly register class.
		  * Such as:
		  * \code RegisterFbxClass("FbxCamera", FBX_TYPE(FbxCamera), FBX_TYPE(FbxNodeAttribute)); \endcode
		  */
		template <typename T1, typename T2> inline FbxClassId RegisterFbxClass(const char* pName, const T1* /*T1*/, const T2* /*T2*/, const char* pFbxFileTypeName=0, const char* pFbxFileSubTypeName=0)
		{
			T1::ClassId = Internal_RegisterFbxClass(pName, T2::ClassId, (FbxObjectCreateProc)T1::Allocate, pFbxFileTypeName, pFbxFileSubTypeName);
			return T1::ClassId;
		}
	 
		/** Runtime class registration.
		  * \param pName                    The class name. For example, "FbxUIWidgetBoolean".
		  * \param T						FBX type of parent class.
		  * \param pFbxFileTypeName         The type name of the class in FBX file.
		  * \param pFbxFileSubTypeName      The sub type name of the class in FBX file.
		  * \return The class Id of the newly register class.
		  * Such as:
		  * \code RegisterRuntimeFbxClass( "FbxUIWidgetBoolean", FBX_TYPE(FbxUIWidgetDefinition), NULL, "FbxUIWidgetBoolean"); \endcode
		  */
		template <typename T> inline FbxClassId RegisterRuntimeFbxClass(const char* pName, const T* /*T*/, const char* pFbxFileTypeName=0,const char* pFbxFileSubTypeName=0)
		{
			return Internal_RegisterFbxClass(pName, T::ClassId, (FbxObjectCreateProc)T::Allocate, pFbxFileTypeName, pFbxFileSubTypeName);
		}
	    
		/** Runtime class unregistration.
		  * \param pName The class name.
		  */
		inline void UnregisterRuntimeFbxClass(const char* pName)
		{
			FbxClassId lClassId = FindClass(pName);
			if( !(lClassId == FbxClassId()) )
			{
				Internal_UnregisterFbxClass(lClassId);
			}
		}
	    
		/** Override class.
		  * \param pFBX_TYPE_Class      FBX type of class.
		  * \param pFBX_TYPE_OverridenClass FBX type of overridden class.
		  * \return The class Id
		  */
		template <typename T1,typename T2> inline FbxClassId OverrideFbxClass(const T1* pFBX_TYPE_Class, const T2* pFBX_TYPE_OverridenClass)
		{
			T1::ClassId  = Internal_OverrideFbxClass(T2::ClassId,(FbxObjectCreateProc)T1::Allocate );
			return T1::ClassId;
		}

		/** Create a new object of the specified ClassId.
		  * \param pClassId		The ClassId of the object to be created.
		  * \param pName		The name given to the newly created object.
		  * \param pContainer	An optional parameter to specify which object will "contain" the new object. By contain, we mean
		  *						the new object will become a source to the container, connection-wise.
		  * \param pCloneFrom	A valid object pointer to use as the reference for cloning the object upon construction.
		  * \return				If not null, a new instance of the specified class.
		  * \remark				This function will return NULL if the ClassId used is invalid. New ClassId can be registered using
		  *						the function RegisterFbxClass().
		  */
		FbxObject* CreateNewObjectFromClassId(FbxClassId pClassId, const char* pName, FbxObject* pContainer=NULL, const FbxObject* pCloneFrom=NULL);

		/** Find class by the specified name.
		  * \param pClassName Class Name to find.
		  */
		FbxClassId FindClass(const char* pClassName) const;

		/** Find file class.
		  * \param pFbxFileTypeName     Specify the type name in FBX file to find.
		  * \param pFbxFileSubTypeName  Specify by The sub type name in FBX file to find.
		  */
		FbxClassId FindFbxFileClass(const char* pFbxFileTypeName, const char* pFbxFileSubTypeName) const;

		/** Class unregistration.
		  * \param pFBX_TYPE_Class  FBX type of unregistered class.
		  */
		template <typename T> inline void UnregisterFbxClass(const T* pFBX_TYPE_Class)
		{
			Internal_UnregisterFbxClass(T::ClassId);
			T::ClassId = FbxClassId();
		}
	//@}

	/**
	  * \name Data Type Management
	  */
	//@{
		/** Register a new data type to the manager
		 *  \param pName The type name.
		 *  \param pType The data type.
		 *  \return The newly created FbxDataType
		 */
		FbxDataType CreateDataType(const char* pName, const EFbxType pType);

		/** List the data types
		 *  \return the number of registered datatypes
		 */
		int GetDataTypeCount() const;

		/** Find a data types at pIndex.
		 *  \param pIndex The data type index.
		 *  \return the found datatype. return null if not found
		 */
		FbxDataType& GetDataType(const int pIndex) const;

		/** Find a data type from the type name.
		 *  \param pDataType The type name.
		 *  \return the found datatype. return null if not found
		 */
		FbxDataType& GetDataTypeFromName(const char* pDataType) const;
	//@}

	/**
	  * \name User Notification Object
	  */
	//@{
		/** Access to the unique UserNotification object.
		  * \return The pointer to the user notification or \c NULL \c if the object
		  * has not been allocated.
		*/
		FbxUserNotification* GetUserNotification() const;

		/** Set the user notification
		  * \param pUN  
		  */
		void SetUserNotification(FbxUserNotification* pUN);
	//@}

	/**
	  * \name IOSettings Object
	  */
	//@{
		/** Access to a IOSettings object.
		  * \return The pointer to IOSettings or \c NULL \c if the object
		  * has not been allocated.
		*/
		virtual FbxIOSettings* GetIOSettings() const;

		/** Set the IOSettings pointer
		  * \param pIOSettings  
		  */
		virtual void SetIOSettings(FbxIOSettings* pIOSettings);
	//@}


	/**
	  * \name Message Emitter (for Message Logging)
	  */
	//@{
		/** Access to the unique FbxMessageEmitter object.
		  * \return The pointer to the message emitter.
		*/
		FbxMessageEmitter& GetMessageEmitter();
		/** Sets to the unique FbxMessageEmitter object.
		  * \param pMessageEmitter the emitter to use, passing NULL will reset to the default emitter.
		  * The object will be deleted when the SDK manager is destroyed, thus ownership is transfered.
		*/
		bool SetMessageEmitter(FbxMessageEmitter* pMessageEmitter);
	//@}

        
	/**
	  * \name Localization Hierarchy
	  */
	//@{
		/** Add a localization object to the known localization providers.
		  * \param pLocManager the localization object to register.
		*/
		void AddLocalization(FbxLocalizationManager* pLocManager);

		/** Remove a localization object from the known localization providers.
		  * \param pLocManager the localization object to remove.
		*/
		void RemoveLocalization(FbxLocalizationManager* pLocManager);

		/** Select the current locale for localization.
		  * \param pLocale the locale name, for example "fr" or "en-US".
		*/
		bool SetLocale(const char* pLocale);

		/** Localization helper function. Calls each registered localization manager
		  * until one can localizes the text.
		  * \param pID the identifier for the text to localize.
		  * \param pDefault the default text. Uses pID if NULL.
		  * \return the potentially localized text. May return the parameter passed in.
		*/
		const char* Localize(const char* pID, const char* pDefault=NULL) const;
	//@}

	/**
	  * \name XRef Manager
	  */
	//@{
		/** Retrieve the manager responsible for managing object XRef resolution.
		  * \return The XRef manager for this SDK manager.
		  */
		FbxXRefManager& GetXRefManager();
	//@}

	/**
	  * \name Library Management
	  */
	//@{
		/** Retrieve the main object Libraries
		  * \return The Root library
		  */
		FbxLibrary* GetRootLibrary() const;
		FbxLibrary* GetSystemLibraries() const;
		FbxLibrary* GetUserLibraries() const;
	//@}

	/**
	  * \name Plug-in Registry Object
	  */
	//@{
		/** Access to the unique FbxIOPluginRegistry object.
		  * \return The pointer to the user FbxIOPluginRegistry
		*/
		FbxIOPluginRegistry* GetIOPluginRegistry() const;
	//@}

	/**
	  * \name Fbx Generic Plugins Management
	  */
	//@{
	#ifndef FBXSDK_ENV_WINSTORE
		/** Load plug-ins directory
		  * \param pFilename The directory path.
		  * \param pExtensions The plug in extension.
		  * \return \c True
		  */
		bool LoadPluginsDirectory(const char* pFilename, const char* pExtensions=NULL);

		/** Load plug-in
		  * \param pFilename The file name
		  * \return \c True
		  */
		bool LoadPlugin(const char* pFilename);

		/** Unload all plug-ins
		*/
		bool UnloadPlugins();

		/** Emit plugins event.
		  * \param pEvent The event to be emitted.
		  */
		bool EmitPluginsEvent(const FbxEventBase& pEvent);
	   
		//!Get plugins.
		FbxArray<const FbxPlugin*> GetPlugins() const;

		/** get plugins count
		  * \return The number of plugins.
		  */
		int GetPluginCount() const;

		/** Find plug in.
		  * \param pName The plug in name.
		  * \param pVersion The plug in version.
		  * \return The plugin, \c null if not found.
		  */
		FbxPlugin* FindPlugin(const char* pName, const char* pVersion) const;
	#endif /* !FBXSDK_ENV_WINSTORE */
	//@}


	/**
	  * \name IO Settings
	  */
	//@{
	// Add IOSettings in hierarchy from different modules

		/** Fill IO Settings for registered readers. 
		  * \param pIOS The properties hierarchies to fill.
		  */
		void FillIOSettingsForReadersRegistered(FbxIOSettings& pIOS);

		/** Fill IO Settings for registered writers. 
		  * \param pIOS The properties hierarchies to fill.
		  */
		void FillIOSettingsForWritersRegistered(FbxIOSettings& pIOS);

		/** Fill common IO Settings 
		  * \param pIOS The properties hierarchies to fill.
		  * \param pImport If \c true, import properties are set, otherwise export properties are set.
		  */
		void FillCommonIOSettings(FbxIOSettings& pIOS, bool pImport);
	//@}

	/**
	  * \name Global Object Management 
	  */
	//@{
		/** Register object with the manager.
		  * \internal
		  * \param pObject The object to be registered.
		  * \anchor GlobalObjectManagement
		  */
		void RegisterObject(FbxObject* pObject);

		/** Unregister object with the manager.
		  * \internal
		  * \param pObject The object to be unregistered.
		  */
		void UnregisterObject(FbxObject* pObject);

		/** Register a list of objects with the manager.
		  * \internal
		  * \param pArray The list of object to be registered.
		  */
		void RegisterObjects(const FbxArray<FbxObject*>& pArray);

		/** Unregister a list of objects with the manager.
		  * \internal
		  * \param pArray The list of object to be unregistered.
		  */
		void UnregisterObjects(const FbxArray<FbxObject*>& pArray);

		/** Increment the scene destroying counter. 
		  * \remarks Call this function before the destroying list is changed.
		 */
		void IncreaseDestroyingSceneFlag();
		/** Shrink the object list and decrements the scene destroying counter.
		  * \remarks Call this function after the destroying is changed.
		  * Use IncreasDestroyingSceneFlag() and DecreaseDestroyingSceneFlag() in pairs.
		 */
		void DecreaseDestroyingSceneFlag();
	/**
	* \name Reference Management
	*/
	//@{
		/** Get number of references.
		* \return Number of references.
		*/
		int GetReferenceCount() const;

		/** Get reference at given index.
		* \param pIndex Position in the list of references.
		* \return Pointer to the reference or \c NULL if index is out of bounds.
		*/
		FbxSceneReference* GetReference(int pIndex) const;

		/** Add a reference.
		* \param pReference The reference to be added.
		* \return If the reference is correctly added to the scene, return \c true otherwise, if the reference is
		*  already there, returns \c false.
		*/
		int AddReference(FbxSceneReference* pReference);

		/** Remove the specified reference from reference list.
		* \param pReference The reference to be removed.
		* \return If the reference was successfully removed, return \c true otherwise, if the
		*  reference could not be found returns \c false.
		*/
		bool RemoveReference(FbxSceneReference* pReference);

		/** Clear the specified reference from the SDK manager.
		* \param pReference The reference to be removed.
		* \return If the reference was successfully cleared from the SDK manager, return \c true otherwise, if the
		*  reference could not be found returns \c false.
		*/
		bool ClearReference(FbxSceneReference* pReference);
	//@}

    /** Add a prefix to a name.
      * \param pPrefix The prefix to be added to the \c pName. This
      * string must contain the "::" characters in order to be considered
      * as a prefix.
      * \param pName The name to be prefix.
      * \return The prefixed string
      * \remarks If a prefix already exists, it is removed before
      * adding \c pPrefix.
      */
    static FbxString PrefixName(const char* pPrefix, const char* pName);

	/** Get the count of document available in this manager
	  * \return The count of document owned by this manager.
	  */
	int GetDocumentCount();

	/** Get the document at pIndex in the manager's list.
	  * \param pIndex The index of the document to retrieve.
	  * \return The document at the specified index. Will return NULL if index is invalid.
	  */
	FbxDocument* GetDocument(int pIndex);

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
	static FbxManager*	GetDefaultManager();
	void				CreateMissingBindPoses(FbxScene* pScene);
	int					GetBindPoseCount(FbxScene *pScene) const;
	int					GetFbxClassCount() const;
	FbxClassId			GetNextFbxClass(FbxClassId pClassId /* invalid id: first one */) const;

protected:
	FbxManager();
	virtual ~FbxManager();

	void Clear();
	void ClassInit();
	void ClassRelease();
	void DataTypeInit();
	void DataTypeRelease();

private:
	bool		CanAutoDestroySrcObject(FbxObject* pObject, FbxObject* pSrcObject, bool pRecursive) const;

	void		Create_Common_Import_IOSettings_Groups(FbxIOSettings& pIOS);
	void		Create_Common_Export_IOSettings_Groups(FbxIOSettings& pIOS);
	void		Add_Common_Import_IOSettings(FbxIOSettings& pIOS);
	void		Add_Common_Export_IOSettings(FbxIOSettings& pIOS);
	void		Add_Common_RW_Import_IOSettings(FbxIOSettings& pIOS);
	void		Add_Common_RW_Export_IOSettings(FbxIOSettings& pIOS);

	FbxClassId	Internal_RegisterFbxClass(const char* pClassName, FbxClassId pParentClassId, FbxObjectCreateProc=0, const char* pFbxFileTypeName=0, const char* pFbxFileSubTypeName=0);
	bool		Internal_RegisterFbxClass(FbxClassId pClassId);
	FbxClassId	Internal_OverrideFbxClass(FbxClassId pClassId, FbxObjectCreateProc=0);
	void		Internal_UnregisterFbxClass(FbxClassId pClassId);

	void		RemoveObjectsOfType(const FbxClassId& pClassId);

	FbxAnimEvaluator* GetDefaultAnimationEvaluator();

    FbxArray<FbxObject*>				mObjects;
	FbxArray<FbxDocument*>				mDocuments;

	FbxIOSettings*						mIOSettings;
	FbxIOPluginRegistry*				mRegistry;
	FbxUserNotification*				mUserNotification;
	FbxMessageEmitter*					mMessageEmitter;
	FbxArray<FbxLocalizationManager*>	mLocalizationManagerArray;
	FbxArray<FbxSceneReference*>		mSceneReferenceArray;
	FbxAnimEvaluator*					mDefaultAnimationEvaluator;

	FbxArray<FbxObject*>				mDestroyingObjects;
	FbxArray<FbxDocument*>				mDestroyingDocuments;
    int									mIsDestroyingScene;

	FbxManager_internal*				mInternal;
	static FbxManager*					smDefaultManager;

	FBXSDK_FRIEND_NEW();
	friend class FbxObject;
	friend class FbxProperty;		//For GetDefaultAnimationEvaluator()
	friend class FbxNode;			//For GetDefaultAnimationEvaluator()
	friend class FbxScene;			//For GetDefaultAnimationEvaluator()
	friend class FbxAnimEvaluator;	//For GetDefaultAnimationEvaluator()
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_CORE_MANAGER_H_ */
