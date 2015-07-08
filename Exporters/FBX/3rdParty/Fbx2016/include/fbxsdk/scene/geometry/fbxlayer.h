/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxlayer.h
#ifndef _FBXSDK_SCENE_GEOMETRY_LAYER_H_
#define _FBXSDK_SCENE_GEOMETRY_LAYER_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/core/fbxdatatypes.h>
#include <fbxsdk/core/fbxstream.h>
#include <fbxsdk/scene/shading/fbxsurfacematerial.h>
#include <fbxsdk/scene/shading/fbxtexture.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

class FbxLayerElementArray;
class FbxLayerContainer;

/**  Base class for elements of layers (FbxLayer). 
  *  A layer element type is identified by EType. 
  *  A FbxLayerElement describes how the layer element is mapped to a geometry surface 
  *  and how the mapping information is arranged in memory.
  *  A FbxLayerElement contains Normals, UVs or other kind of information.
  *
  * \see FbxLayer
  * \see FbxLayerElement::EMappingMode
  * \see FbxLayerElement::EReferenceMode
  */
class FBXSDK_DLL FbxLayerElement
{
public:
	/** \enum EType     Layer Element type identifier.
	  * - \e eUnknown                        Undefined Layer Element class.
	  * - \e eNormal                           Layer Element of type FbxLayerElementNormal.
      * - \e eBiNormal                         Layer Element of type FbxLayerElementBinormal.
      * - \e eTangent                          Layer Element of type FbxLayerElementTangent.
	  * - \e eMaterial                         Layer Element of type FbxLayerElementMaterial.
	  * - \e eTextureDiffuse                 Layer Element of type FbxLayerElementTexture.
	  * - \e ePolygonGroup                    Layer Element of type FbxLayerElementPolygonGroup.
	  * - \e eUV                               Layer Element of type FbxLayerElementUV.
	  * - \e eVertexColor                     Layer Element of type FbxLayerElementVertexColor.
	  * - \e eSmoothing                        Layer Element of type FbxLayerElementSmoothing.
      * - \e eVertexCrease                    Layer Element of type FbxLayerElementCrease.
      * - \e eEdgeCrease                      Layer Element of type FbxLayerElementCrease.
      * - \e eHole                             Layer Element of type FbxLayerElementHole.
	  * - \e eUserData                        Layer Element of type FbxLayerElementUserData.
	  * - \e eVisibility                       Layer Element of type FbxLayerElementVisibility.
	  * - \e eTextureEmissive                Layer Element of type FbxLayerElementTexture.
	  * - \e eTextureEmissiveFactor         Layer Element of type FbxLayerElementTexture.
	  * - \e eTextureAmbient                 Layer Element of type FbxLayerElementTexture.
	  * - \e eTextureAmbientFactor          Layer Element of type FbxLayerElementTexture.
	  * - \e eTextureDiffuseFactor          Layer Element of type FbxLayerElementTexture.
	  * - \e eTextureSpecular                Layer Element of type FbxLayerElementTexture.
	  * - \e eTextureNormalMap               Layer Element of type FbxLayerElementTexture.
	  * - \e eTextureSpecularFactor         Layer Element of type FbxLayerElementTexture.
	  * - \e eTextureShininess               Layer Element of type FbxLayerElementTexture.
	  * - \e eTextureBump                    Layer Element of type FbxLayerElementTexture.
	  * - \e eTextureTransparency             Layer Element of type FbxLayerElementTexture.
	  * - \e eTextureTransparencyFactor     Layer Element of type FbxLayerElementTexture.
	  * - \e eTextureReflection              Layer Element of type FbxLayerElementTexture.
	  * - \e eTextureReflectionFactor       Layer Element of type FbxLayerElementTexture.
      * - \e eTextureDisplacement            Layer Element of type FbxLayerElementTexture.
      * - \e eTextureDisplacementVector     Layer Element of type FbxLayerElementTexture.
	  * - \e eTypeCount
	  */
	enum EType
	{
		eUnknown,

        //Non-Texture layer element types
		//Note: Make sure to update static index below if you change this enum!
		eNormal,
        eBiNormal,
        eTangent,
		eMaterial,
		ePolygonGroup,
		eUV,
		eVertexColor,
		eSmoothing,
        eVertexCrease,
        eEdgeCrease,
        eHole,
		eUserData,
		eVisibility,

        //Texture layer element types
		//Note: Make sure to update static index below if you change this enum!
        eTextureDiffuse,
        eTextureDiffuseFactor,
		eTextureEmissive,
		eTextureEmissiveFactor,
		eTextureAmbient,
		eTextureAmbientFactor,
		eTextureSpecular,
        eTextureSpecularFactor,
        eTextureShininess,
		eTextureNormalMap,
		eTextureBump,
		eTextureTransparency,
		eTextureTransparencyFactor,
		eTextureReflection,
		eTextureReflectionFactor,
        eTextureDisplacement,
        eTextureDisplacementVector,

		eTypeCount
	};

    const static int sTypeTextureStartIndex = int(eTextureDiffuse);	//!< The start index of texture type layer elements. 
    const static int sTypeTextureEndIndex = int(eTypeCount) - 1;	//!< The end index of texture type layer elements.
    const static int sTypeTextureCount = sTypeTextureEndIndex - sTypeTextureStartIndex + 1;	//!< The count of texture type layer elements.
    const static int sTypeNonTextureStartIndex = int(eNormal);		//!< The start index of non-texture type layer elements.
    const static int sTypeNonTextureEndIndex = int(eVisibility);	//!< The end index of non-texture type layer elements.
    const static int sTypeNonTextureCount = sTypeNonTextureEndIndex - sTypeNonTextureStartIndex + 1;	//!< The count of non-texture type layer elements.
    static const char* const sTextureNames[];						//!< Array of names of texture type layer elements.
    static const char* const sTextureUVNames[];						//!< Array of names of UV layer elements.
    static const char* const sNonTextureNames[];					//!< Array of names of non-texture type layer elements.
    static const FbxDataType sTextureDataTypes[];					//!< Array of texture types.
    static const char* const sTextureChannelNames[];				//!< Array of texture channels.

	/**	\enum EMappingMode     Determines how the element is mapped to a surface.
	  * - \e eNone                  The mapping is undetermined.
	  * - \e eByControlPoint      There will be one mapping coordinate for each surface control point/vertex.
	  * - \e eByPolygonVertex     There will be one mapping coordinate for each vertex, for every polygon of which it is a part.
	                                This means that a vertex will have as many mapping coordinates as polygons of which it is a part.
	  * - \e eByPolygon            There can be only one mapping coordinate for the whole polygon.
	  * - \e eByEdge               There will be one mapping coordinate for each unique edge in the mesh.
	                                This is meant to be used with smoothing layer elements.
	  * - \e eAllSame              There can be only one mapping coordinate for the whole surface.
	  */
	enum EMappingMode
	{
		eNone,
		eByControlPoint,
		eByPolygonVertex,
		eByPolygon,
		eByEdge,
		eAllSame
	};

	/** \enum EReferenceMode     Determines how the mapping information is stored in the array of coordinates.
	  * - \e eDirect              This indicates that the mapping information for the n'th element is found in the n'th place of 
	                              FbxLayerElementTemplate::mDirectArray.
	  * - \e eIndex,              This symbol is kept for backward compatibility with FBX v5.0 files. In FBX v6.0 and higher, 
	                              this symbol is replaced with eIndexToDirect.
	  * - \e eIndexToDirect     This indicates that the FbxLayerElementTemplate::mIndexArray
	                              contains, for the n'th element, an index in the FbxLayerElementTemplate::mDirectArray
	                              array of mapping elements. eIndexToDirect is usually useful for storing eByPolygonVertex mapping 
                                  mode elements coordinates. Since the same coordinates are usually
	                              repeated many times, this saves spaces by storing the coordinate only one time
	                              and then referring to them with an index. Materials and Textures are also referenced with this
	                              mode and the actual Material/Texture can be accessed via the FbxLayerElementTemplate::mDirectArray
	  */
	enum EReferenceMode
	{
		eDirect,
		eIndex,
		eIndexToDirect
	};

	
	/** Sets the Mapping Mode.
	  * \param pMappingMode     Specifies the way that layer element is mapped to a surface.
	  */
	void SetMappingMode(EMappingMode pMappingMode) { mMappingMode = pMappingMode; }

	/** Sets the Reference Mode.
	  * \param pReferenceMode     Specifies the reference mode.
	  */
	void SetReferenceMode(EReferenceMode pReferenceMode) { mReferenceMode = pReferenceMode; }

	/** Returns the Mapping Mode.
	  * \return     The current Mapping Mode.
	  */
	EMappingMode GetMappingMode() const { return mMappingMode; }

	/** Returns the Reference Mode.
	  * \return     The current Reference Mode.
	  */
	EReferenceMode GetReferenceMode() const { return mReferenceMode; }

	/** Sets the name of this object.
	  * \param pName     Specifies the name of this LayerElement object.
	  */
	void SetName(const char* pName) { mName = FbxString(pName); }

	/** Returns the name of this object.
	  * \return     The current name of this LayerElement object.
	  */
	const char* GetName() const { return ((FbxLayerElement*)this)->mName.Buffer(); }

    /** Equivalence operator
      * \param pOther     Layer element to be compared.
      * \return           \c True if equal, \c false otherwise.
      */
	bool operator==(const FbxLayerElement& pOther) const
	{
		return (mName == pOther.mName) && 
			   (mMappingMode == pOther.mMappingMode) &&
			   (mReferenceMode == pOther.mReferenceMode);
	}

    /** Assignment operator
      * \param pOther      Layer element assigned to this one.
      * \return            This layer element after assignment.
      */
	FbxLayerElement& operator=( FbxLayerElement const& pOther )
	{
		mMappingMode = pOther.mMappingMode;
		mReferenceMode = pOther.mReferenceMode;
		// name, type and owner should not be copied because they are
		// initialized when this object is created
		return *this;
	}

    //! Removes this layer element from its owner and delete it.
	void Destroy();

    //! Clears all the data from this layer element.
    virtual bool Clear() 
    { 
        return true;
    }

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
    void SetType(const FbxDataType* pType) { mType = pType; }
	const FbxLayerContainer* GetOwner() const { return mOwner; }

protected:
	FbxLayerElement() 
		: mMappingMode(eNone)
		, mReferenceMode(eDirect)
		, mName("")
		, mOwner(NULL)
	{
	}
	
	virtual ~FbxLayerElement()
	{
	}

	EMappingMode mMappingMode;
	EReferenceMode mReferenceMode;

	FbxString mName;
	const FbxDataType* mType;
	FbxLayerContainer* mOwner;

	void Destruct() { FbxDelete(this); }
	virtual void SetOwner(FbxLayerContainer* pOwner, int pInstance = 0);

    FBXSDK_FRIEND_NEW();

public:
	virtual int MemorySize() const { return 0; }
	virtual bool ContentWriteTo(FbxStream& pStream) const;
	virtual bool ContentReadFrom(const FbxStream& pStream);

	friend class FbxLayerContainer;
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};

/** \internal
  * Identifies what error occurs when the data arrays are manipulated.
  * \nosubgrouping
  */

class FBXSDK_DLL LockAccessStatus
{
public:
	/** \internal
      * \enum ELockAccessStatus	        Identifies what error occurs when the data arrays are manipulated.
	  * - \e eSuccess					Operation Successful.
	  * - \e eUnsupportedDTConversion   Attempts to convert to an unsupported DataType.
	  * - \e eCorruptedCopyback         The Release of a converted buffer fails and corrupts the main data.
	  * - \e eBadValue                  Invalid value.
	  * - \e eLockMismatch              Attempts to change to an incompatible lock.
	  * - \e eNoWriteLock               A write operation is attempted but no WriteLock is available.
	  * - \e eNoReadLock                A read operation is attempted but the WriteLock is active.
	  * - \e eNotOwner                  Attempts to release a lock on an invalid data buffer pointer.
	  * - \e eDirectLockExist           A direct access lock is still active.
	  */
	enum ELockAccessStatus
	{
		eSuccess,
		eUnsupportedDTConversion,
		eCorruptedCopyback,
		eBadValue,
		eLockMismatch,
		eNoWriteLock,
		eNoReadLock,
		eNotOwner,
		eDirectLockExist
	};
};

//Special conversion types, we do not want them to resolve to undefined.
typedef FbxHandle* FbxRefPtr;
typedef FbxLayerElementArray* FbxLayerElementArrayPtr;
typedef FbxSurfaceMaterial* FbxSurfaceMaterialPtr;
typedef FbxTexture* FbxTexturePtr;

inline EFbxType FbxTypeOf(const FbxRefPtr&){ return eFbxReference; }
inline EFbxType FbxTypeOf(const FbxLayerElementArrayPtr&){ return eFbxReference; }
inline EFbxType FbxTypeOf(const FbxSurfaceMaterialPtr&){ return eFbxReference; }
inline EFbxType FbxTypeOf(const FbxTexturePtr&){ return eFbxReference; }

/** FbxLayerElementArray is the base class for FbxLayerElementArrayTemplate, 
  * it provides lock handling and data array manipulation of the data buffer for FbxLayerElement.
  * \nosubgrouping
  */

class FBXSDK_DLL FbxLayerElementArray
{
public:
	/**
	  * \name Constructor and Destructor
	  */
	//@{

	/** Constructor.
	  * \param pDataType The data type of the items in the data array.
	  */
	FbxLayerElementArray(EFbxType pDataType);

	//!Destructor.
	virtual ~FbxLayerElementArray();

	//@}

	/**
	  * \name Status handling
	  */
	//@{

	//!Clears the access state and sets it to eSuccess.
	inline                                void ClearStatus()     { mStatus = LockAccessStatus::eSuccess; }

	//!Retrieves the access state.
	inline LockAccessStatus::ELockAccessStatus GetStatus() const { return mStatus; }
	//@}

	/** 
	  * \name Locks handling
	  */
	//@{

	/** Returns whether write is locked.
	  * \return        \c True if write is locked, \c false otherwise.
	  */
	inline bool IsWriteLocked() const { return mWriteLock; };

	/** Retrieves the read lock count.
	  * \return           The read lock count.
	  */
	inline int  GetReadLockCount() const { return mReadLockCount; }
	//@}

	/** Returns whether this Array is accessed in any way.
      * \return           \c True if it is in use, \c false otherwise.
	  */
	bool	IsInUse() const;

	/** Increments the number of read locks on this array.
	  * \return           The current number of read locks (including the one just grabbed) or 0 if a write lock is active.
	  */
	int     ReadLock() const;

	/** Releases a read lock on this array.
	  * \return           The remaining read locks or -1 if a write lock is active.
	  */
	int     ReadUnlock() const;

	/** Locks this array for writing. The data in the array is wiped out.
	  * \return           \c True if a write lock has been successfully granted, \c false if one or more read locks
	  *                   are active.
	  */
	bool    WriteLock() const;

	/** Releases the write lock on this array.
	  */
	void    WriteUnlock() const;

	/** Locks this array for writing. The data that already exists in the array is kept and is valid.
	  * \return           \c True if a write lock has been successfully granted, \c false if one or more read locks
	  *                   are active.
	  */
	bool    ReadWriteLock() const;

	/** Releases the write lock on this array.
	  */
	void    ReadWriteUnlock() const;


    /** \enum ELockMode	           Identifies the access mode to the data buffer.
    * - \e eReadLock			   Read mode.
    * - \e eWriteLock             Write mode.
    * - \e eReadWriteLock         Read-write mode.
    */
	enum ELockMode
	{
		eReadLock = 1,
		eWriteLock = 2,
		eReadWriteLock = 3
	};

	/** Grants a locked access to the data buffer. 
	  * \param pLockMode                 Access mode to the data buffer.
	  * \param pDataType                 If defined, tries to return the data as this type.
	  * \return                          A pointer to the data buffer or NULL if a failure occurs.
	  * \remarks                         In the case of a failure, the Status is updated with the
	  *                                  reason for the failure. Also, when a type conversion occurs, a second buffer 
	  *                                  of the new type is allocated. In this case, the LockMode does not apply to the
	  *	                                 returned buffer since it is a copy but it does apply to the internal data of this
	  *	                                 object. The returned buffer still remains a property of this object and is
	  *	                                 deleted when the pointer is released or the object is destroyed. At the moment of 
      *                                  release or destruction, the values in this buffer are copied back into this object.
	  */
    virtual void*   GetLocked(ELockMode pLockMode, EFbxType pDataType);

	/** Grants a locked access to the data buffer. 
	  * \param pLockMode                 Access mode to the data buffer.
	  * \return                          A pointer to the data buffer or NULL if a failure occurs.
      * \remarks                         In the case of a failure, the Status is updated with the
      *                                  reason for the failure. Also, when a type conversion occurs, a second buffer 
      *                                  of the new type is allocated. In this case, the LockMode does not apply to the
      *	                                 returned buffer since it is a copy but it does apply to the internal data of this
      *	                                 object. The returned buffer still remains a property of this object and is
      *	                                 deleted when the pointer is released or the object is destroyed. At the moment of 
      *                                  release or destruction, the values in this buffer are copied back into this object.
	  */
	void*   GetLocked(ELockMode pLockMode=eReadWriteLock) { return GetLocked(pLockMode, mDataType); }

	/** Grants a locked access to the data buffer. 
	  * \param pLockMode                 Access mode to the data buffer.
	  * \return                          A pointer to the data buffer or NULL if a failure occurs.
      * \remarks                         In the case of a failure, the Status is updated with the
      *                                  reason for the failure. Also, when a type conversion occurs, a second buffer 
      *                                  of the new type is allocated. In this case, the LockMode does not apply to the
      *	                                 returned buffer since it is a copy but it does apply to the internal data of this
      *	                                 object. The returned buffer still remains a property of this object and is
      *	                                 deleted when the pointer is released or the object is destroyed. At the moment of 
      *                                  release or destruction, the values in this buffer are copied back into this object.
	  */
	template <class T> inline T* GetLocked(T*, ELockMode pLockMode=eReadWriteLock) {T v; return (T*)GetLocked(pLockMode, FbxTypeOf(v)); }

	/** Unlock the data buffer.
	  * \param pDataPtr                  The buffer to be released.
	  * \param pDataType                 The data type of the data buffer.
	  * \remarks                         The passed pointer must be the one obtained by the call to GetLocked().
	  *                                  Any other pointer causes this method to fail and the Status is updated with
	  *                                  the reason for the failure. If the passed pointer refers a converted data
	  *	                                 buffer (see comment of GetLocked), this method copies the GetCount() items 
	  *	                                 of the received buffer back into this object. Any other items that may have been added
	  *	                                 using a realloc call are ignored.
	  */    
	virtual void   Release(void** pDataPtr, EFbxType pDataType);

	/** Unlock the data buffer.
	  * \param pDataPtr                  The buffer to be released.
      * \remarks                         The passed pointer must be the one obtained by the call to GetLocked().
      *                                  Any other pointer causes this method to fail and the Status is updated with
      *                                  the reason for the failure. If the passed pointer refers a converted data
      *	                                 buffer (see comment of GetLocked), this method copies the GetCount() items 
      *	                                 of the received buffer back into this object. Any other items that may have been added
      *	                                 using a realloc call are ignored.
	  */    
	void   Release(void** pDataPtr) { Release(pDataPtr, mDataType); }

	/** Unlock the data buffer.
	  * \param pDataPtr                  The buffer to be released.
      * \param dummy                     The data type of dummy is used to specialize this function.
      * \remarks                         The passed pointer must be the one obtained by the call to GetLocked().
      *                                  Any other pointer causes this method to fail and the Status is updated with
      *                                  the reason for the failure. If the passed pointer refers a converted data
      *	                                 buffer (see comment of GetLocked), this method copies the GetCount() items 
      *	                                 of the received buffer back into this object. Any other items that may have been added
      *	                                 using a realloc call are ignored.
	  */    
	template <class T> inline void Release(T** pDataPtr, T* dummy) 
	{ 
		T*** voidPtr = &pDataPtr;
        Release((void**)*voidPtr, FbxTypeOf(*dummy));
	}

	/** Returns the Stride size which equals the size of the data type of the data buffer.
	  */
	virtual size_t GetStride() const;

    /**
	  * \name Data array manipulation
	  */
	//@{

    //! Returns the count of items in the data buffer.
	int		GetCount() const;

    /** Sets the count of items in the data buffer.
      * \param pCount               The count of items to be set.
      */
	void	SetCount(int pCount);

    //! Clears the data buffer.
	void	Clear();

    /** Resizes the data buffer.
      * \param pItemCount           The new size of the data buffer. 
      */
	void	Resize(int pItemCount);

    /** Appends space to the data buffer.
      * \param pItemCount           The appended space size
      */
	void	AddMultiple(int pItemCount);

    /** Appends a new item to the end of the data buffer.
      * \param pItem                Pointer of the new item to be added
      * \param pValueType           Data type of the new item 
      * \return                     The index of the new item
      */
	int     Add(const void* pItem, EFbxType pValueType);

    /** Inserts a new item at the specified position of the data buffer.
      * \param pIndex               The specified position
      * \param pItem                Pointer of the new item to be inserted
      * \param pValueType           Data type of the new item 
      * \return                     The index of the inserted item
      * \remarks The input index must be within valid range and no error will be thrown if it is invalid.
      */
	int		InsertAt(int pIndex, const void* pItem, EFbxType pValueType);

    /** Sets the value for the specified item.
      * \param pIndex               The index of the item to be updated.
      * \param pItem                Pointer of the item whose value is copied to pIndex'th item
      * \param pValueType           Data type of the item 
      * \remarks The input index must be within valid range and no error will be thrown if it is invalid.
      */
	void	SetAt(int pIndex, const void* pItem, EFbxType pValueType);

    /** Sets the value of the last item.
      * \param pItem                Pointer of the item whose value is copied to the last item
      * \param pValueType           Data type of the item 
      * \remarks The array should contain at least one item and no error will be thrown if it is empty.
      */
	void    SetLast(const void* pItem, EFbxType pValueType);

    /** Removes the specified item from the data buffer.
      * \param pIndex               The index of the item to be removed               
      * \param pItem                Place to hold the value of the removed item.
      * \param pValueType           Data type of the item
      * \remarks The input index must be within valid range and no error will be thrown if it is invalid.
      */
	void    RemoveAt(int pIndex, void** pItem, EFbxType pValueType);

    /** Removes the last item from the data buffer.    
      * \param pItem                Place to hold the value of the removed item.
      * \param pValueType           Data type of the item
      * \remarks The array should contain at least one item and no error will be thrown if it is empty.
      */
	void    RemoveLast(void** pItem, EFbxType pValueType);

    /** Removes one item from the data buffer.    
      * \param pItem                The first item who equals pItem is to be removed
      * \param pValueType           Data type of the item 
      * \return                     \c True if the item is removed successfully, \c false otherwise                     
      */
	bool    RemoveIt(void** pItem, EFbxType pValueType);

    /** Returns the specified item's value.  
      * \param pIndex               Index of the item
      * \param pItem                Place to hold the item's value
      * \param pValueType           Data type of the item 
      * \return                     \c True if the item's value is returned successfully, \c false otherwise 
      * \remarks                    If the index is invalid, pItem is set to zero.
      */
	bool    GetAt(int pIndex, void** pItem, EFbxType pValueType) const;

    /** Returns the first item's value.  
      * \param pItem                Place to hold the item's value
      * \param pValueType           Data type of the item 
      * \return                     \c True if the item's value is returned successfully, \c false otherwise 
      */
	bool    GetFirst(void** pItem, EFbxType pValueType) const;

    /** Returns the last item's value.  
      * \param pItem                Place to hold the item's value
      * \param pValueType           Data type of the item 
      * \return                     \c True if the item's value is returned successfully, \c false otherwise 
      */
	bool    GetLast(void** pItem, EFbxType pValueType) const;

    /** Searches for an item in the data buffer.  
      * \param pItem                The value of the item for which to search.
      * \param pValueType           Data type of the item 
      * \return                     The index of the item found, -1 if not found.
      * \remarks                    The index of the first item whose value equals pItem is returned.
      */
	int     Find(const void* pItem, EFbxType pValueType) const;

    /** Searches for an item after the specified index in the data buffer.  
      * \param pAfterIndex          The specified index after which the searching begins
      * \param pItem                The value of the item for which to search, the searching begins after pAfterIndex.
      * \param pValueType           Data type of the item 
      * \return                     The index of the item found, -1 if not found.
      * \remarks                    The index of the first item whose value equals pItem is returned.
      */
	int     FindAfter(int pAfterIndex, const void* pItem, EFbxType pValueType) const;

    /** Searches for an item before the specified index in the data buffer.  
      * \param pBeforeIndex         The specified index before which the searching begins
      * \param pItem                The value of the item for which to search, the searching begins before pBeforeIndex.
      * \param pValueType           The item's data type. 
      * \return                     The index of the item found, -1 if not found.
      * \remarks                    The index of the first item whose value equals pItem is returned.
      */
	int     FindBefore(int pBeforeIndex, const void* pItem, EFbxType pValueType) const;

    /** Equivalence operator
      * \param pArray               Array compared to this one
      * \return                     \c True if equal. \c false otherwise.
      */
	bool    IsEqual(const FbxLayerElementArray& pArray) const;

    /** Appends a new item to the end of the data buffer.
      * \param pItem                The new item to be added
      * \return                     The index of the new item
      */   
	template <class T> inline int  Add(T const& pItem)								 { return Add((const void*)&pItem, FbxTypeOf(pItem)); }

    /** Inserts a new item at the specified position of the data buffer.
      * \param pIndex               The specified position
      * \param pItem                The new item to be inserted
      * \return                     The index of the inserted item
      * \remarks The input index must be within valid range and no error will be thrown if it is invalid.
      */
	template <class T> inline int  InsertAt(int pIndex, T const& pItem)				 { return InsertAt(pIndex, (const void*)&pItem, FbxTypeOf(pItem)); }

    /** Sets the value of the specified item.
      * \param pIndex               The index of the item to be updated.
      * \param pItem                The item whose value is copied to pIndex'th item
      * \remarks The input index must be within valid range and no error will be thrown if it is invalid.
      */
	template <class T> inline void SetAt(int pIndex, T const& pItem)				 { SetAt(pIndex, (const void*)&pItem, FbxTypeOf(pItem)); }

    /** Sets the value of the last item.
      * \param pItem                The item whose value is copied to the last item
      * \remarks The array should contain at least one item and no error will be thrown if it is empty.
      */
	template <class T> inline void SetLast(T const& pItem)							 { SetLast((const void*)&pItem, FbxTypeOf(pItem)); }

    /** Removes the specified item from the data buffer.
      * \param pIndex               The index of the item to be removed               
      * \param pItem                Place to hold the value of the removed item.
      * \remarks The input index must be within valid range and no error will be thrown if it is invalid.
      */
	template <class T> inline void RemoveAt(int pIndex, T* pItem)					 
	{ 
		T** voidPtr = &pItem;
        RemoveAt(pIndex, (void**)voidPtr, FbxTypeOf(*pItem));
	}

    /** Removes the last item from the data buffer.    
      * \param pItem                Place to hold the value of the removed item.
      * \remarks The array should contain at least one item and no error will be thrown if it is empty.
      */
	template <class T> inline void RemoveLast(T* pItem)								 
	{ 
		T** voidPtr = &pItem;
        RemoveLast((void**)voidPtr, FbxTypeOf(*pItem));
	}

    /** Removes one item from the data buffer.    
      * \param pItem                The first item who equals pItem is to be removed
      * \return                     \c True if the item is removed successfully, \c false otherwise                     
      */
	template <class T> inline bool RemoveIt(T* pItem)								 
	{ 
		T** voidPtr = &pItem;
        return RemoveIt((void**)voidPtr, FbxTypeOf(*pItem));
	}

    /** Returns the specified item's value.  
      * \param pIndex               Index of the item
      * \param pItem                Place to hold the item's value
      * \return                     \c True if the item's value is returned successfully, \c false otherwise 
      * \remarks                    If the index is invalid, pItem is set to zero.
      */
	template <class T> inline bool GetAt(int pIndex, T* pItem) const				 
	{ 
		T** voidPtr = &pItem;
        return GetAt(pIndex, (void**)voidPtr, FbxTypeOf(*pItem));
	}

    /** Returns the first item's value.  
      * \param pItem                Place to hold the item's value
      * \return                     \c True if the item's value is returned successfully, \c false otherwise 
      */
	template <class T> inline bool GetFirst(T* pItem) const							 
	{ 
		T** voidPtr = &pItem;
        return GetFirst((void**)voidPtr, FbxTypeOf(*pItem));
	}

    /** Returns the last item's value.  
      * \param pItem                Place to hold the item's value
      * \return                     \c True if the item's value is returned successfully, \c false otherwise 
      */
	template <class T> inline bool GetLast(T* pItem) const							 
	{ 
		T** voidPtr = &pItem;
        return GetLast((void**)voidPtr, FbxTypeOf(*pItem));
	}

    /** Searches for an item in the data buffer.  
      * \param pItem                The value of the item for which to search.
      * \return                     The index of the item found, -1 if not found.
      * \remarks                    The index of the first item whose value equals pItem is returned.
      */
	template <class T> inline int Find(T const& pItem) const						 { return Find((const void*)&pItem, FbxTypeOf(pItem)); }

    /** Searches for an item after the specified index in the data buffer.  
      * \param pAfterIndex          The specified index after which the searching begins
      * \param pItem                The value of the item for which to search, the searching begins after pAfterIndex.
      * \return                     The index of the item found, -1 if not found.
      * \remarks                    The index of the first item whose value equals pItem is returned.
      */
	template <class T> inline int FindAfter(int pAfterIndex, T const& pItem) const   { return FindAfter(pAfterIndex, (const void*)&pItem, FbxTypeOf(pItem)); }

    /** Searches for one item before the specified index in the data buffer.  
      * \param pBeforeIndex         The specified index before which the searching begins
      * \param pItem                The value of the item for which to search, the searching begins before pBeforeIndex.
      * \return                     The index of the item found, -1 if not found.
      * \remarks                    The index of the first item whose value equals pItem is returned.
      */
	template <class T> inline int FindBefore(int pBeforeIndex, T const& pItem) const { return FindBefore(pBeforeIndex, (const void*)&pItem, FbxTypeOf(pItem)); }


    /** Copies the items in the data buffer to an array.
      * \param pDst                 The destination array where the items are to be copied.
      */
	template<typename T> inline void CopyTo(FbxArray<T>& pDst)
	{
		T src;
		T* srcPtr = &src;

		pDst.Clear();
		if (mDataType != FbxTypeOf(src))
		{
			SetStatus(LockAccessStatus::eUnsupportedDTConversion);
			return;
		}

		pDst.Resize(GetCount());
		for (int i = 0; i < GetCount(); i++)
		{
			if (GetAt(i, (void**)&srcPtr, mDataType))
			{
				pDst.SetAt(i, src);
			}
		}
		SetStatus(LockAccessStatus::eSuccess);
	}
	//@}

protected:
	void*   GetDataPtr();
	void*   GetReference(int pIndex, EFbxType pValueType);
	void    GetReferenceTo(int pIndex, void** pRef, EFbxType pValueType);

	inline void SetStatus(LockAccessStatus::ELockAccessStatus pVal) const
	{
		const_cast<FbxLayerElementArray*>(this)->mStatus = pVal;
	}

	        void   SetImplementation(void* pImplementation);
	inline 	void*  GetImplementation() { return mImplementation; }
	virtual void   ConvertDataType(EFbxType pDataType, void** pDataPtr, size_t* pStride);

	EFbxType mDataType;

private:
	LockAccessStatus::ELockAccessStatus	mStatus;

	int			  mReadLockCount;
	bool		  mWriteLock;
	void*		  mImplementation;
	size_t        mStride;
	int           mDirectLockOn;
	bool          mDirectAccessOn;

	FbxArray<void*>	mConvertedData;

};

/** \internal
  * This class provides simple RAII-style read locking of a FbxLayerElementArray object.
  */
template <typename T>
struct FbxLayerElementArrayReadLock
{
    /** \internal
      * On construction, this class requires the read lock.
      */
    FbxLayerElementArrayReadLock(FbxLayerElementArray& pArray) : mArray(pArray)
    {
        mLockedData = mArray.GetLocked((T*)NULL, FbxLayerElementArray::eReadLock);
    }

    /** \internal
      * On destruction, this class releases the read lock.
      */
    ~FbxLayerElementArrayReadLock()
    {
        if( mLockedData )
        {
            mArray.Release((void **) &mLockedData);
        }
    }

    /** \internal
      * Retrieve the locked array data.
      */
    const T* GetData() const
    {
        return mLockedData;
    }

private:
    FbxLayerElementArray&  mArray;
    T* mLockedData;
};

class FbxLayerElementUserData;

/** FbxLayerElementArrayTemplate provides data array manipulation of the data buffer for FbxLayerElement.
  * It is the subclass of FbxLayerElementArray.
  * \nosubgrouping
  */
template <class T> class FbxLayerElementArrayTemplate : public FbxLayerElementArray
{
public:

    /** Constructor
      * \param pDataType                The data type of the array items.
      */
	FbxLayerElementArrayTemplate(EFbxType pDataType) :
		FbxLayerElementArray(pDataType)
		{
		}

    /** Appends a new item to the end of the data buffer.
      * \param pItem                The new item to be added
      * \return                     The index of the new item
      */   
	inline int  Add( T const &pItem )						{ return FbxLayerElementArray::Add(pItem); }

    /** Inserts a new item at the specified position of the data buffer.
      * \param pIndex               The specified position
      * \param pItem                The new item to be inserted
      * \return                     The index of the inserted item
      */
	inline int  InsertAt(int pIndex, T const &pItem)		{ return FbxLayerElementArray::InsertAt(pIndex, pItem); }

    /** Sets the value of the specified item.
      * \param pIndex               The index of the item to be updated.
      * \param pItem                The item whose value is copied to pIndex'th item
      */
	inline void SetAt(int pIndex, T const &pItem)			{ FbxLayerElementArray::SetAt(pIndex, pItem); }

    /** Sets the value of the last item.
      * \param pItem                The item whose value is copied to the last item
      */
	inline void SetLast( T const &pItem)					{ FbxLayerElementArray::SetLast(pItem); }

    /** Removes the specified item from the data buffer.
      * \param pIndex               The index of the item to be removed
      * \return                     The value of the item removed
      */
	inline T RemoveAt(int pIndex)			   				{ T lValue; FbxLayerElementArray::RemoveAt(pIndex, &lValue); return lValue; }

    /** Removes the last item from the data buffer.    
      * \return                     The value of the last item removed
      */
	inline T RemoveLast()									{ T lValue; FbxLayerElementArray::RemoveLast(&lValue); return lValue; }

    /** Removes one item from the data buffer.    
      * \param pItem                The first item who equals pItem is to be removed
      * \return                     \c True if the item is removed successfully, \c false otherwise                     
      */
	inline bool RemoveIt(T const &pItem)					{ return FbxLayerElementArray::RemoveIt(&pItem); }

    /** Returns the specified item's value.  
      * \param pIndex               Index of the item
      * \return                     The value of the specified item
      * \remarks                    If the index is invalid, pItem is set to zero.
      */
	inline T  GetAt(int pIndex) const						{ T lValue; FbxLayerElementArray::GetAt(pIndex, &lValue); return lValue; }

    /** Returns the first item's value.  
      * \return                     The first item's value.                        
      */
	inline T  GetFirst() const								{ T lValue; FbxLayerElementArray::GetFirst(&lValue); return lValue; }

    /** Returns the last item's value.  
      * \return                     The last item's value.                        
      */
	inline T  GetLast() const								{ T lValue; FbxLayerElementArray::GetLast(&lValue); return lValue; }

    /** Searches for an item in the data buffer.  
      * \param pItem                The value of the item for which to search
      * \return                     The index of the item found, -1 if not found.
      * \remarks                    The index of the first item whose value equals pItem is returned.
      */
	inline int Find(T const &pItem)							{ return FbxLayerElementArray::Find(pItem); }

    /** Searches for an item after the specified index in the data buffer.  
      * \param pAfterIndex          The specified index after which the searching begins
      * \param pItem                The value of the item for which to search, the searching begins after pAfterIndex.
      * \return                     The index of the item found, -1 if not found.
      * \remarks                    The index of the first item whose value equals pItem is returned.
      */
	inline int FindAfter(int pAfterIndex, T const &pItem)	{ return FbxLayerElementArray::FindAfter(pAfterIndex, pItem); }

    /** Searches for one item before the specified index in the data buffer.  
      * \param pBeforeIndex         The specified index before which the searching begins
      * \param pItem                The value of the item for which to search, the searching begins before pBeforeIndex.
      * \return                     The index of the item found, -1 if not found.
      * \remarks                    The index of the first item whose value equals pItem is returned.
      */
	inline int FindBefore(int pBeforeIndex, T const &pItem) { return FbxLayerElementArray::FindBefore(pBeforeIndex, pItem); }

    /** Returns the specified item's value.  
      * \param pIndex               Index of the item
      * \return                     The value of the item
      * \remarks                    If the index is invalid, pItem is set to zero.
      */
	T  operator[](int pIndex) const							{ T lValue; FbxLayerElementArray::GetAt(pIndex, &lValue); return lValue; }	

    /** Assignment operator.
      * \param pArrayTemplate       The source array whose items are copied to this array.
      */
    FbxLayerElementArray& operator=(const FbxArray<T>& pArrayTemplate)
    {
        SetStatus(LockAccessStatus::eNoWriteLock);
        if (WriteLock())
        {
            SetCount(pArrayTemplate.GetCount());
            for (int i = 0; i < pArrayTemplate.GetCount(); i++)
                SetAt(i, pArrayTemplate.GetAt(i));
            WriteUnlock();
            SetStatus(LockAccessStatus::eSuccess);
        }
        return *this;
    }

    /** Assignment operator.
      * \param pArrayTemplate           The source array whose items are copied to this array.
      */
    FbxLayerElementArrayTemplate<T>& operator=(const FbxLayerElementArrayTemplate<T>& pArrayTemplate)
    {
        if ( this != &pArrayTemplate )
        {
            SetStatus(LockAccessStatus::eNoWriteLock);
            if (WriteLock())
            {
                SetCount(pArrayTemplate.GetCount());
                for (int i = 0; i < pArrayTemplate.GetCount(); i++)
                    SetAt(i, pArrayTemplate.GetAt(i));
                WriteUnlock();
                SetStatus(LockAccessStatus::eSuccess);
            }
        }
        return *this;
    }

private:
	// This one is not the best thing to do, but at least I don't get deprecated calls inside this file.
	// Note that FbxLayerElementUserData is kind of a weird class in the first place anyway. So either
	// we clean it up, or we live with this piece of code ;-)
	friend class FbxLayerElementUserData;
	T& AsReference(int pIndex) 		{ T* v = (T*)FbxLayerElementArray::GetReference(pIndex, mDataType); return (v)?*v:dummy;}

	T dummy;
};


/** Remap the index array to a new EMappingMode
  * \param pLayerEl     The layer element to remap
  * \param pNewMapping  The new mapping mode
  * \param pIndexArray  The index array to modify
  * \return return -1 if the layer element is FbxLayerElement::eDirect
  *         0 if layer element or index array is \c NULL and 1 if the remap is successful
  */
extern FBXSDK_DLL int RemapIndexArrayTo(FbxLayerElement* pLayerEl, 
							 FbxLayerElement::EMappingMode pNewMapping, 
							 FbxLayerElementArrayTemplate<int>* pIndexArray);


/** This class complements the FbxLayerElement class.
  * It provides interfaces to access the direct array and index array of different layer elements.
  * \nosubgrouping
  */
template <class Type> class FbxLayerElementTemplate : public FbxLayerElement
{
public:

	/** Returns the direct array of Layer Elements.
	  * \return      A reference to the Layer Elements direct array.
	  * \remarks     You cannot put elements in the direct array when the reference mode is set to eIndex.
	  */
	FbxLayerElementArrayTemplate<Type>& GetDirectArray() const
	{ 
		FBX_ASSERT(mReferenceMode == FbxLayerElement::eDirect || mReferenceMode == FbxLayerElement::eIndexToDirect);
		return *mDirectArray; 
	}

	/** Returns the direct array of Layer Elements.
	  * \return      A reference to the Layer Elements direct array.
	  * \remarks     You cannot put elements in the direct array when the reference mode is set to eIndex.
	  */
	FbxLayerElementArrayTemplate<Type>& GetDirectArray()
	{ 
		FBX_ASSERT(mReferenceMode == FbxLayerElement::eDirect || mReferenceMode == FbxLayerElement::eIndexToDirect);
		return *mDirectArray; 
	}

	/** Returns the index array of Layer Elements.
	  * \return      A reference to the index array.
	  * \remarks     You cannot put elements in the index array when the mapping mode is set to eDirect.
	  */
	FbxLayerElementArrayTemplate<int>& GetIndexArray() const
	{ 
		FBX_ASSERT(mReferenceMode == FbxLayerElement::eIndex || mReferenceMode == FbxLayerElement::eIndexToDirect);
		return *mIndexArray; 
	}

	/** Returns the index array of Layer Elements.
	  * \return      A reference to the index array.
	  * \remarks     You cannot put elements in the index array when the mapping mode is set to eDirect.
	  */
	FbxLayerElementArrayTemplate<int>& GetIndexArray()
	{ 
		FBX_ASSERT(mReferenceMode == FbxLayerElement::eIndex || mReferenceMode == FbxLayerElement::eIndexToDirect);
		return *mIndexArray; 
	}

	/** Removes all elements from the direct and the index arrays.
	  * \remarks This function fails if there is a lock on the arrays.
	  * \return \c True if successful, \c false if a lock is present.
	  */
	bool Clear()
	{
		bool ret = true;
		mDirectArray->Clear();
		ret = (mDirectArray->GetStatus() == LockAccessStatus::eSuccess);

		mIndexArray->Clear();
		ret |= (mIndexArray->GetStatus() == LockAccessStatus::eSuccess);

		return ret;
	}

public:

    /** Equivalence operator.
      * \param pOther               Another element compared to this object
      * \return                     \c True if equal, \c false if unequal.
      */
	bool operator==(const FbxLayerElementTemplate& pOther) const
	{
		bool ret = true;

        if (pOther.GetReferenceMode() == FbxLayerElement::eDirect || 
            pOther.GetReferenceMode() == FbxLayerElement::eIndexToDirect)
        {
            const FbxLayerElementArrayTemplate<Type>& directArray = pOther.GetDirectArray();
            if( directArray.GetCount() != mDirectArray->GetCount() || 
                !directArray.ReadLock() || !mDirectArray->ReadLock() )
            {
                ret = false;
            }

            if( ret && !mDirectArray->IsEqual(directArray) )
                ret = false;

            directArray.ReadUnlock();
            mDirectArray->ReadUnlock();
        }

        if (ret)
        {
            if (pOther.GetReferenceMode() == FbxLayerElement::eIndex || 
                pOther.GetReferenceMode()  == FbxLayerElement::eIndexToDirect)
            {
                const FbxLayerElementArrayTemplate<int>& indexArray = pOther.GetIndexArray();
                if( indexArray.GetCount() != mIndexArray->GetCount() ||
                    !indexArray.ReadLock() || !mIndexArray->ReadLock() )
                {
                    ret = false;
                }

                if( ret && !mIndexArray->IsEqual(indexArray) )
                    ret = false;

                indexArray.ReadUnlock();
                mIndexArray->ReadUnlock();
            }
        }

        if (ret == false)
            return false;

        return FbxLayerElement::operator==(pOther);
	}

    /** Assignment operator.
      * \param pOther               Another element assigned to this one
      */
	FbxLayerElementTemplate& operator=( FbxLayerElementTemplate const& pOther )
	{
		FBX_ASSERT(mDirectArray != NULL);
		FBX_ASSERT(mIndexArray != NULL);

		if (pOther.GetReferenceMode() == FbxLayerElement::eDirect || 
			pOther.GetReferenceMode() == FbxLayerElement::eIndexToDirect)
		{
			const FbxLayerElementArrayTemplate<Type>& directArray = pOther.GetDirectArray();
			*mDirectArray = directArray;
		}

		if (pOther.GetReferenceMode() == FbxLayerElement::eIndex || 
			pOther.GetReferenceMode()  == FbxLayerElement::eIndexToDirect)
		{
			const FbxLayerElementArrayTemplate<int>& indexArray = pOther.GetIndexArray();
			*mIndexArray = indexArray;
		}
		
		FbxLayerElement* myself = (FbxLayerElement*)this;
		FbxLayerElement* myOther = (FbxLayerElement*)&pOther;
		*myself = *myOther;
		return *this; 
	}

	/** Changes the Mapping mode to the new one and re-computes the index array.
	  * \param pNewMapping          New mapping mode.
	  * \return                     If the remapping is successful, returns 1.
	  *                             If an error occurs, returns 0. In case the function cannot
	  *                             remap to the desired mode because of incompatible modes or
	  *                             unsupported modes, returns -1.
	  */
	int RemapIndexTo(FbxLayerElement::EMappingMode pNewMapping)
	{
		return RemapIndexArrayTo(this, pNewMapping, mIndexArray);
	}

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
protected:
	FbxLayerElementTemplate() 
	{
		mDirectArray = NULL;
		mIndexArray = NULL;
	}

	~FbxLayerElementTemplate() 
	{
		FbxDelete(mDirectArray);
		FbxDelete(mIndexArray);
	}

	virtual void AllocateArrays()
	{
		mDirectArray = FbxNew< FbxLayerElementArrayTemplate<Type> >(mType->GetType());
		mIndexArray = FbxNew< FbxLayerElementArrayTemplate<int> >(FbxIntDT.GetType());
	}

public:
	virtual int MemorySize() const
	{
		int size = FbxLayerElement::MemorySize();
		size += (mDirectArray->GetCount()*sizeof(Type));
		size += (mIndexArray->GetCount()*sizeof(int));
		return size;
	}

	/**
	  * \name Serialization section
	  */
	//@{
	virtual bool ContentWriteTo(FbxStream& pStream) const
	{
		void* a;
		int s,v;
		int count = 0;

		// direct array
		count = mDirectArray->GetCount();
		s = pStream.Write(&count, sizeof(int)); 
		if (s != sizeof(int)) return false;
		if (count > 0)
		{
			a = mDirectArray->GetLocked();
			FBX_ASSERT(a != NULL);
			v = count*sizeof(Type);
			s = pStream.Write(a, v); 
			mDirectArray->Release(&a);
			if (s != v) return false;
		}

		// index array
		count = mIndexArray->GetCount();
		s = pStream.Write(&count, sizeof(int)); 
		if (s != sizeof(int)) return false;
		if (count > 0)
		{
			a = mIndexArray->GetLocked();
			FBX_ASSERT(a != NULL);
			v = count*sizeof(int);
			s = pStream.Write(a, v);
			mIndexArray->Release(&a);
			if (s != v) return false;
		}

		return FbxLayerElement::ContentWriteTo(pStream);
	}

	virtual bool ContentReadFrom(const FbxStream& pStream)
	{
		void* a;
		int s,v;
		int count = 0;

		// direct array
		s = pStream.Read(&count, sizeof(int)); 
		if (s != sizeof(int)) return false;
		mDirectArray->Resize(count);
		if (count > 0)
		{
			a = mDirectArray->GetLocked();
			FBX_ASSERT(a != NULL);
			v = count*sizeof(Type);
			s = pStream.Read(a, v); 
			mDirectArray->Release(&a);
			if (s != v) return false;
		}

		// index array
		s = pStream.Read(&count, sizeof(int)); 
		if (s != sizeof(int)) return false;
		mIndexArray->Resize(count);		
		if (count > 0)
		{
			a = mIndexArray->GetLocked();
			FBX_ASSERT(a != NULL);
			v = count*sizeof(int);
			s = pStream.Read(a, v);
			mIndexArray->Release(&a);
			if (s != v) return false;
		}
		return FbxLayerElement::ContentReadFrom(pStream);
	}
	//@}

    typedef Type ArrayElementType;
    typedef FbxLayerElementArrayTemplate<Type> DirectArrayType;
    typedef FbxLayerElementArrayTemplate<int> IndexArrayType;

	FbxLayerElementArrayTemplate<Type>* mDirectArray;
	FbxLayerElementArrayTemplate<int>*  mIndexArray;
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};

#define FBXSDK_LAYER_ELEMENT_CREATE_DECLARE(classDesc) \
    FBXSDK_FRIEND_NEW();        \
	static Fbx##classDesc* Create(FbxLayerContainer* pOwner, const char* pName);

/** \brief Layer element for mapping Normals to a geometry.
  * \remarks To be correctly saved in FBX file, this type of Layer element should have its reference 
  *         mode set to \e eIndexToDirect. 
  * \nosubgrouping
  */
class FBXSDK_DLL FbxLayerElementNormal : public FbxLayerElementTemplate<FbxVector4>
{
public:

    /** Allocation method.
      * \return             A pointer to the layer element or \c NULL if creation fails. 
      */
	FBXSDK_LAYER_ELEMENT_CREATE_DECLARE(LayerElementNormal);
	
protected:
	FbxLayerElementNormal();
	~FbxLayerElementNormal();
};

/** \brief Layer element for mapping Binormals to a geometry.
  * \nosubgrouping
  */
class FBXSDK_DLL FbxLayerElementBinormal : public FbxLayerElementTemplate<FbxVector4>
{
public:

    /** Allocation method.
      * \return             A pointer to the layer element or \c NULL if creation fails. 
      */
	FBXSDK_LAYER_ELEMENT_CREATE_DECLARE(LayerElementBinormal);
	
protected:
	FbxLayerElementBinormal();
	~FbxLayerElementBinormal();
};

/** \brief Layer element for mapping Tangents to a geometry.
  * \nosubgrouping
  */
class FBXSDK_DLL FbxLayerElementTangent : public FbxLayerElementTemplate<FbxVector4>
{
public:

    /** Allocation method.
      * \return             A pointer to the layer element or \c NULL if creation fails. 
      */
	FBXSDK_LAYER_ELEMENT_CREATE_DECLARE(LayerElementTangent);
	
protected:
	FbxLayerElementTangent();
	~FbxLayerElementTangent();
};

/** Layer element for mapping materials (FbxSurfaceMaterial) to a geometry.
  *
  * FBX SDK 2011 and later connects materials (FbxSurfaceMaterial) to nodes (FbxNode).
  * The direct array of this class is no longer used.
  * The integer "n" in the index array of this class represents the n-th material (zero-based) connected to the node.
  *
  * For example:
  *
  *   Mapping mode eAllSame and index array {0} means the whole geometry is assigned with the 0-th material
  *   connected to the node.
  *
  *   Mapping mode eByPolygon and index array {0, 1} means the first polygon is assigned with the 0-th material and
  *   the second polygon is assigned with the 1-th material.
  * 
  * 
  * You can access the materials from a node by using FbxNode::GetMaterialCount() and FbxNode::GetMaterial(int pIndex)
  * or the more generic calls to GetSrcObjectCount<FbxSurfaceMaterial>() and 
  * GetSrcObject<FbxSurfaceMaterial>(index)
  *
  * For example:
  *
  * \code
  * FbxNode* node;
  * int nbMat = node->GetMaterialCount();
  * int nbMat1= node->GetSrcObjectCount<FbxSurfaceMaterial>();
  *
  * FbxSurfaceMaterial* material;
  * FbxLayerElementMaterial* layerElement;
  * if (layerElement->GetMappingMode() == FbxLayerElement::eAllSame)
  * {
  *     int index = layerElement->GetIndexArray()[0];
  *     material = node->GetMaterial(index);
  * }
  * \endcode
  *
  * \remarks
  * The DirectArray() methods still exist for legacy reasons but has been made private and should not be used.
  * Therefore, to be correctly saved in FBX file, this type of Layer element should have its reference 
  * mode set to \e eIndexToDirect. 
  *
  * \see FbxSurfaceMaterial
  * \see FbxNode
  */
class FBXSDK_DLL FbxLayerElementMaterial : public FbxLayerElementTemplate<FbxSurfaceMaterial*>
{
public:
	typedef FbxLayerElementTemplate<FbxSurfaceMaterial*> ParentClass;

    /** Allocation method.
      * \return             A pointer to the layer element or \c NULL if creation fails. 
      */
	FBXSDK_LAYER_ELEMENT_CREATE_DECLARE(LayerElementMaterial);
	
    /** \internal
      * Internal class to maintain backward compatibility with old FBX code (prior to FBX SDK 2011).
      * This class synchronizes the direct array with FbxNode connections.
      * Thus, changes on the direct array will reflect on FbxNode.
      */
	class LayerElementArrayProxy : public FbxLayerElementArrayTemplate<FbxSurfaceMaterial*>
	{
	public:
		typedef FbxLayerElementArrayTemplate<FbxSurfaceMaterial*> ParentClass;

		LayerElementArrayProxy(EFbxType pType);
		void SetContainer( FbxLayerContainer* pContainer, int pInstance = 0);
	};

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
	virtual void AllocateArrays();
	virtual void SetOwner( FbxLayerContainer* pOwner, int pInstance = 0);
	virtual void SetInstance( int pInstance ) { SetOwner( mOwner, pInstance ); }

protected:
	FbxLayerElementMaterial();
	~FbxLayerElementMaterial();

private:
    FbxLayerElementArrayTemplate<FbxSurfaceMaterial*>& GetDirectArray() const
	{ 
        return ParentClass::GetDirectArray();
	}

    FbxLayerElementArrayTemplate<FbxSurfaceMaterial*>& GetDirectArray()
	{ 
        return ParentClass::GetDirectArray();
	}
    
    friend class FbxLayerContainer;
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
}; 

/** \brief Layer element for grouping related polygons together.
  * \remarks To be correctly saved in FBX file, this type of Layer element should have its reference 
  *         mode set to \e eIndexToDirect. 
  * \nosubgrouping
  */
class FBXSDK_DLL FbxLayerElementPolygonGroup : public FbxLayerElementTemplate<int>
{
public:

    /** Allocation method.
      * \return             A pointer to the layer element or \c NULL if creation fails. 
      */
	FBXSDK_LAYER_ELEMENT_CREATE_DECLARE(LayerElementPolygonGroup);
	
protected:
	FbxLayerElementPolygonGroup();
	~FbxLayerElementPolygonGroup();
};

/** \brief Layer element for mapping UVs to a geometry.
  *
  * This class represents a UV set belongs to a geometry. Each UV set in a geometry
  * has a name to identify itself. The string property FbxTexture.UVSet indicates
  * the UV set to use.
  *
  * \remarks    if the Mapping mode of this LayerElement is \e eNone, the stored data
  *             should be treated as irrelevant. In some circumstances, you can still send this data  
  *             to systems that cannot function without UV coordinates, but ensure
  *             that you have enough coordinates to do so.
  *             
  * \see FbxTexture
  * \nosubgrouping
  */
class FBXSDK_DLL FbxLayerElementUV : public FbxLayerElementTemplate<FbxVector2>
{
public:
    /** Allocation method.
      * \return             A pointer to the layer element or \c NULL if creation fails. 
      */
	FBXSDK_LAYER_ELEMENT_CREATE_DECLARE(LayerElementUV);
	
protected:
	FbxLayerElementUV();
	~FbxLayerElementUV();
};

/** \brief Layer element for mapping Vertex Colors to a geometry.
  * \nosubgrouping
  */
class FBXSDK_DLL FbxLayerElementVertexColor : public FbxLayerElementTemplate<FbxColor>
{
public:

    /** Allocation method.
      * \return             A pointer to the layer element or \c NULL if creation fails. 
      */
	FBXSDK_LAYER_ELEMENT_CREATE_DECLARE(LayerElementVertexColor);
	
protected:
	FbxLayerElementVertexColor();
	~FbxLayerElementVertexColor();
};

template <class T> inline FbxLayerElementArrayTemplate<T>&       FbxGetDirectArray(FbxLayerElementUserData       *pLayerElement, int pIndex, bool* pStatus = NULL);
template <class T> inline FbxLayerElementArrayTemplate<T> const& FbxGetDirectArray(FbxLayerElementUserData const *pLayerElement, int pIndex, bool* pStatus = NULL);
template <class T> inline FbxLayerElementArrayTemplate<T>&       FbxGetDirectArray(FbxLayerElementUserData       *pLayerElement, const char* pName, bool* pStatus = NULL );
template <class T> inline FbxLayerElementArrayTemplate<T> const& FbxGetDirectArray(FbxLayerElementUserData const *pLayerElement, const char* pName, bool* pStatus = NULL );

/** \brief Layer element for mapping custom user data to a geometry. 
  * This layer element is different from the other types of layer elements in that it has multiple direct arrays. There is one array for each user data attribute.
  * Each array is indexed by the index array.
  * \nosubgrouping
  */
class FBXSDK_DLL FbxLayerElementUserData : public FbxLayerElementTemplate<void*>
{
public:
    FBXSDK_FRIEND_NEW();

    /** Allocation method.
      * \param pOwner       The owner of this layer element.       
      * \param pName        The layer element name.
      * \param pId          The layer element ID.
      * \param pDataTypes   Attribute data types of this layer element, one direct array is allocated for each Attribute data type.
      * \param pDataNames   Attribute names of this layer element.
      * \return             A pointer to the layer element or \c NULL if creation fails. 
      * \remarks            Only "bool", "int", "float" and "double" are supported. 
      */
	static FbxLayerElementUserData* Create(FbxLayerContainer* pOwner, const char* pName, int pId, FbxArray<FbxDataType>& pDataTypes, FbxArray<const char*>& pDataNames);

    /** Allocation method.
      * \param pOwner       The owner of this layer element.        
      * \param pOther       Other layer element from which to copy. 
      * \return             A pointer to the layer element or \c NULL if creation fails. 
      */
	static FbxLayerElementUserData* Create(FbxLayerContainer* pOwner, FbxLayerElementUserData const& pOther );

    /** Returns the direct array with the specified attribute index.
	  * \param pIndex                   Specified attribute index.
	  * \param pStatus                  A flag to indicate whether the direct array is returned successfully or not.
	  * \return                         The specified attribute's direct array.
	  */ 
	FbxLayerElementArrayTemplate<void*>* GetDirectArrayVoid( int pIndex, bool* pStatus = NULL)
	{		
		if( pIndex >= 0 || pIndex < GetDirectArray().GetCount() )
		{
			if (pStatus) *pStatus = true;
			return (FbxLayerElementArrayTemplate<void*>*)GetDirectArray().AsReference(pIndex);
		}
		else
		{
			if( pStatus ) *pStatus = false;
			FBX_ASSERT_NOW("Index out of bounds");
			return (FbxLayerElementArrayTemplate<void*>*)NULL;
		}
	}

    /** Returns the direct array with the specified attribute index.
	  * \param pIndex                   Specified attribute index.
	  * \param pStatus                  A flag to indicate whether the direct array is returned successfully or not.
	  * \return                         The specified attribute's direct array.
	  */ 
	const FbxLayerElementArrayTemplate<void*>* GetDirectArrayVoid( int pIndex, bool* pStatus = NULL) const
	{
		if( pIndex >= 0 || pIndex < GetDirectArray().GetCount() )
		{
			if (pStatus) *pStatus = true;
			return (FbxLayerElementArrayTemplate<void*>*)GetDirectArray().AsReference(pIndex);
		}
		else
		{
			if( pStatus ) *pStatus = false;
			FBX_ASSERT_NOW("Index out of bounds");
			return (const FbxLayerElementArrayTemplate<void*>*)NULL;
		}
	}


    /** Returns the direct array with the specified attribute name.
	  * \param pName                    Specified attribute name.
	  * \param pStatus                  A flag to indicate whether the direct array is returned successfully or not.
	  * \return                         The specified attribute's direct array.
	  */ 
	FbxLayerElementArrayTemplate<void *>* GetDirectArrayVoid ( const char* pName, bool* pStatus = NULL )
	{
		FbxString lName( pName );
		for( int i = 0; i < mDataNames.GetCount(); ++i )
		{
			if( *mDataNames[i] == lName )
				return GetDirectArrayVoid(i, pStatus);
		}

		if (pStatus) *pStatus = false;
		return (FbxLayerElementArrayTemplate<void *>*)NULL;
	}
 
    /** Returns the direct array with the specified attribute name.
	  * \param pName                    Specified attribute name.
	  * \param pStatus                  A flag to indicate whether the direct array is returned successfully or not.
	  * \return                         The specified attribute's direct array.
	  */ 
	const FbxLayerElementArrayTemplate<void*>* GetDirectArrayVoid ( const char* pName, bool* pStatus = NULL ) const
	{
		FbxString lName( pName );
		for( int i = 0; i < mDataNames.GetCount(); ++i )
		{
			if( *mDataNames[i] == lName )
				return GetDirectArrayVoid(i, pStatus);
		}

		if (pStatus) *pStatus = false;
		return (const FbxLayerElementArrayTemplate<void*>*)NULL;
	}

	/** Returns the data type for the specified index
	 * \param pIndex     The index of the attribute being queried
	 * \return           The data type, or FbxUndefinedDT if pIndex is out of range
	 */
	FbxDataType GetDataType( int pIndex ) const
	{
		if( pIndex < 0 || pIndex >= mDataTypes.GetCount() )
			return FbxUndefinedDT;

		return mDataTypes[pIndex];
	}

	/** Returns the specified attribute data type.
	 * \param pName     The name of the attribute being queried
	 * \return          The data type, or FbxUndefinedDT if no attribute has the given name
	 */
	FbxDataType GetDataType( const char* pName ) const
	{
		FbxString lName( pName );

		for( int i = 0; i < mDataNames.GetCount(); ++i )
		{
			if( *mDataNames[i] == lName )
				return mDataTypes[i];
		}

		return FbxUndefinedDT;
	}

	/** Returns the attribute name at the specified index
	 * \param pIndex     Attribute index
	 * \return           The name, or \c NULL if pIndex is out of range.
	 */
	const char* GetDataName( int pIndex ) const
	{
		if( pIndex >= 0 && pIndex < mDataNames.GetCount() )
			return mDataNames[pIndex]->Buffer();

		return NULL;
	}

	/** Resizes all direct arrays to the specified size. 
	 * \param pSize     The new size of the direct arrays.
	 */
	void ResizeAllDirectArrays( int pSize )
	{
		for( int i = 0; i < GetDirectArray().GetCount(); ++i )
		{
			switch( mDataTypes[i].GetType() )
			{
				case eFbxBool:	FbxGetDirectArray<bool>(this,i).Resize( pSize )  ; break;
				case eFbxInt:	FbxGetDirectArray<int>(this,i).Resize( pSize )   ;	break;
				case eFbxFloat:	FbxGetDirectArray<float>(this,i).Resize( pSize ) ;	break;
				case eFbxDouble:	FbxGetDirectArray<double>(this,i).Resize( pSize );	break;
				//case eFbxDouble3:	GetDirectArray< FbxDouble3 >(i).Resize( pSize );	break;
				//case eFbxDouble4:	GetDirectArray< FbxDouble4 >(i).Resize( pSize );	break;
				//case eFbxDouble4x4:	GetDirectArray< FbxDouble4x4>(i).Resize( pSize );	break;  
				default:
					FBX_ASSERT_NOW("unknown type" ); break;
			}
		}
	}

	/** Removes a single element at pIndex from every direct array.
	 * \param pIndex     The index of the element to be removed.
	 */
	void RemoveFromAllDirectArrays( int pIndex )
	{
		for( int i = 0; i < GetDirectArray().GetCount(); ++i )
		{
			switch( mDataTypes[i].GetType() )
			{
				case eFbxBool:	FbxGetDirectArray<bool>(this,i).RemoveAt( pIndex )  ; break;
				case eFbxInt:	FbxGetDirectArray<int>(this,i).RemoveAt( pIndex )   ; break;
				case eFbxFloat:	FbxGetDirectArray<float>(this,i).RemoveAt( pIndex ) ; break;
				case eFbxDouble:	FbxGetDirectArray<double>(this,i).RemoveAt( pIndex ); break;
				//case eFbxDouble3:	GetDirectArray< FbxDouble3 >(i).RemoveAt( pIndex );	break;
				//case eFbxDouble4:	GetDirectArray< FbxDouble4 >(i).RemoveAt( pIndex );	break;
				//case eFbxDouble4x4:	GetDirectArray< FbxDouble4x4>(i).RemoveAt( pIndex );	break;  
				default:
					FBX_ASSERT_NOW("unknown type" ); break;
			}
		}
	}

	/** Returns the direct array count for the attribute at pIndex
	 * \param pIndex     The attribute index
	 * \return           The specified attribute's direct array count.
	 */
	int GetArrayCount( int pIndex ) const 
	{
		if( pIndex >= 0 && pIndex < GetDirectArray().GetCount() )
		{
			switch( mDataTypes[pIndex].GetType() )
			{
				case eFbxBool:	return FbxGetDirectArray<bool>(this,pIndex).GetCount();
				case eFbxInt:	return FbxGetDirectArray<int>(this,pIndex).GetCount();
				case eFbxFloat:	return FbxGetDirectArray<float>(this,pIndex).GetCount();
				case eFbxDouble:	return FbxGetDirectArray<double>(this,pIndex).GetCount();
				//case eFbxDouble3:	return GetDirectArray< FbxDouble3 >(pIndex).GetCount();
				//case eFbxDouble4:	return GetDirectArray< FbxDouble4 >(pIndex).GetCount();
				//case eFbxDouble4x4:	return GetDirectArray< FbxDouble4x4>(pIndex).GetCount();
				default:
					FBX_ASSERT_NOW("Unknown type" ); break;
			}
		}

		return -1;
	}

	/** Queries the this layer element's ID.
	 * \return     The ID expressed as an int
	 */
	int GetId() const { return mId; }

	/** Returns this layer element's direct array count.
	 * \return     The direct array count expressed as an int.
     * \remarks    This count should be equal to the count of user data attributes.
	 */
	int GetDirectArrayCount() const { return GetDirectArray().GetCount(); }

    /** Assignment operator which performs a deep copy. 
      * \param pOther      Other FbxLayerElementUserData from which to perform a deep copy.
      * \return            This FbxLayerElementUserData.
      */
    FbxLayerElementUserData& operator=( FbxLayerElementUserData const& pOther )
    {
        if (this == &pOther)
            return *this;

        Clear();

        mId = pOther.mId;
        mDataTypes = pOther.mDataTypes;
        mDataNames.Resize(pOther.mDataNames.GetCount());
        for(int i = 0; i < pOther.mDataNames.GetCount(); ++i)
            mDataNames.SetAt(i,  FbxNew< FbxString >( *pOther.mDataNames[i] ) );

        Init();
        for(int i = 0; i < pOther.GetDirectArrayCount(); ++i)
        {
            switch (mDataTypes[i].GetType())
            {
            case eFbxBool:
                FbxGetDirectArray<bool>(this, i) = FbxGetDirectArray<bool>(&pOther, i);
                break;

            case eFbxInt:
                FbxGetDirectArray<int>(this, i) = FbxGetDirectArray<int>(&pOther, i);
                break;

            case eFbxFloat:
                FbxGetDirectArray<float>(this, i) = FbxGetDirectArray<float>(&pOther, i);
                break;

            case eFbxDouble:
                FbxGetDirectArray<double>(this, i) = FbxGetDirectArray<double>(&pOther, i);
                break;

            default:
                FBX_ASSERT_NOW("Unknown type" );
                break;
            }
        }

        if ( ( mReferenceMode == FbxLayerElement::eIndex || 
               mReferenceMode == FbxLayerElement::eIndexToDirect) &&
             ( pOther.GetReferenceMode() == FbxLayerElement::eIndex || 
               pOther.GetReferenceMode()  == FbxLayerElement::eIndexToDirect))
        {
            GetIndexArray() = pOther.GetIndexArray();
        }

        return *this;
    }

	/** Removes all data from this layer element.
      * \return             \c True always
	  */
	bool Clear()
	{
		int i;
		const int lCount = GetDirectArray().GetCount();
		FbxLayerElementArray** directArray = NULL;
		directArray = GetDirectArray().GetLocked(directArray);
		for( i = 0; directArray != NULL && i < lCount; ++i )
		{
			if( directArray[i] )
				FbxDelete(directArray[i]);
		}
		FbxLayerElementArray*** ptr = &directArray;
		GetDirectArray().Release((void**)ptr);
		for( i = 0; i < mDataNames.GetCount(); ++i )
		{
			FBX_SAFE_DELETE(mDataNames[i]);
		}
		mDataNames.Clear();
		mDataTypes.Clear();

		FbxLayerElementTemplate<void*>::Clear();

        return true;
	}

	/** Queries the amount of memory used by this
	  * object as well as its content. It does not consider the content pointed.
	  * \return                The amount of memory used.
	  */
	virtual int MemorySize() const
	{
		int size = FbxLayerElementTemplate<void*>::MemorySize();
		size += sizeof(mId);

        for(int i = 0; i < mDataTypes.GetCount(); i++)
        {
            size += sizeof(mDataTypes[i]);
        }
        size += (mDataNames.GetCount() * sizeof(FbxString*));

		return size;
	}

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
protected:
	/**
	  * \name Constructor and Destructor.
	  */
	//@{
		/** Constructs a user data layer element. 
	      * \param pId            An identifier for this UserData layer element
	      * \param pDataTypes     Attribute data types for this layer element
	      * \param pDataNames     Attribute names for this layer element
	      */
	FbxLayerElementUserData( int pId, FbxArray<FbxDataType>& pDataTypes, FbxArray<const char*>& pDataNames )
		:
		mId( pId ),
		mDataTypes( pDataTypes )
	{
		FBX_ASSERT( pDataTypes.GetCount() == pDataNames.GetCount() );
		for( int i = 0; i < pDataNames.GetCount(); ++i )
		{
			mDataNames.Add( FbxNew< FbxString >( pDataNames[i] ) );
		}
	}

    /** Copy constructor. A deep copy is made.
    * \param pOther Another FbxLayerElementUserData object to be copied.
    */
    FbxLayerElementUserData( FbxLayerElementUserData const& pOther ) : mId(pOther.mId), mDataTypes(pOther.mDataTypes)
    {
        for (int lIndex = 0; lIndex < pOther.mDataNames.GetCount(); ++lIndex)
        {
            mDataNames.Add(FbxNew<FbxString>(*(pOther.mDataNames[lIndex])));
        }

        SetType(&FbxLayerElementUserDataDT);
        AllocateArrays();

        for(int i = 0; i < pOther.GetDirectArrayCount(); ++i)
        {
            switch (mDataTypes[i].GetType())
            {
            case eFbxBool:
                FbxGetDirectArray<bool>(this, i) = FbxGetDirectArray<bool>(&pOther, i);
                break;

            case eFbxInt:
                FbxGetDirectArray<int>(this, i) = FbxGetDirectArray<int>(&pOther, i);
                break;

            case eFbxFloat:
                FbxGetDirectArray<float>(this, i) = FbxGetDirectArray<float>(&pOther, i);
                break;

            case eFbxDouble:
                FbxGetDirectArray<double>(this, i) = FbxGetDirectArray<double>(&pOther, i);
                break;

            default:
                FBX_ASSERT_NOW("Unknown type" );
                break;
            }
        }

        if ( ( mReferenceMode == FbxLayerElement::eIndex || 
            mReferenceMode == FbxLayerElement::eIndexToDirect) &&
            ( pOther.GetReferenceMode() == FbxLayerElement::eIndex || 
            pOther.GetReferenceMode()  == FbxLayerElement::eIndexToDirect))
        {
            GetIndexArray() = pOther.GetIndexArray();
        }
    }

    //!Destructor.
	~FbxLayerElementUserData()
	{
		Clear();
	}

	//@}
	virtual void AllocateArrays()
	{
		FbxLayerElementTemplate<void*>::AllocateArrays();
		Init();
	}


private:

	void Init()
	{
	    int i;
		GetDirectArray().Resize( mDataTypes.GetCount() );

		// initialize arrays
		for( i = 0; i < mDataTypes.GetCount(); ++i )
		{
			FbxHandle** dst = NULL;
			dst = GetDirectArray().GetLocked(dst);
			if (dst)
			{
				switch( mDataTypes[i].GetType() )
				{
					case eFbxBool:	dst[i] = (FbxHandle*)FbxNew< FbxLayerElementArrayTemplate<bool> >(mDataTypes[i].GetType());	break;
					case eFbxInt:	dst[i] = (FbxHandle*)FbxNew< FbxLayerElementArrayTemplate<int> >(mDataTypes[i].GetType());	break;
					case eFbxFloat:	dst[i] = (FbxHandle*)FbxNew< FbxLayerElementArrayTemplate<float> >(mDataTypes[i].GetType());	break;
					case eFbxDouble:	dst[i] = (FbxHandle*)FbxNew< FbxLayerElementArrayTemplate<double> >(mDataTypes[i].GetType());	break;
					default:
						FBX_ASSERT_NOW("Trying to assign an unknown type" ); break;
				}	
				FbxHandle*** ptr = &dst;
				GetDirectArray().Release((void**)ptr);
			}
		}
	}
	
	int mId;
	FbxArray<FbxDataType> mDataTypes;
	FbxArray<FbxString*> mDataNames;
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};

/** Returns the direct array with the given attribute index. The template type must match the attribute type at pIndex. 
 * \param pLayerElement     The layer element whose direct array to return.
 * \param pIndex            The direct array index
 * \param pStatus           Will be set to \c false if accessing the direct array encounters an error.
 * \return                  If pStatus receives \c true, the direct array at the given index is
 *                          returned. Otherwise the return value is \c undefined.
 */
template <class T>
inline FbxLayerElementArrayTemplate<T>& FbxGetDirectArray( FbxLayerElementUserData *pLayerElement,int pIndex, bool* pStatus)
{
	return *(FbxLayerElementArrayTemplate<T>*)pLayerElement->GetDirectArrayVoid(pIndex,pStatus);
}

/** Returns the direct array with the given attribute index. The template type must match the attribute type at pIndex. 
 * \param pLayerElement     The layer element whose direct array to return.
 * \param pIndex            The direct array index
 * \param pStatus           Will be set to \c false if accessing the direct array encounters an error.
 * \return                  If pStatus receives \c true, the direct array at the given index is
 *                          returned. Otherwise the return value is \c undefined.
 */
template <class T>
inline FbxLayerElementArrayTemplate<T> const& FbxGetDirectArray(FbxLayerElementUserData const *pLayerElement, int pIndex, bool* pStatus)
{
	return *(const FbxLayerElementArrayTemplate<T>*)pLayerElement->GetDirectArrayVoid(pIndex,pStatus);
}


/** Returns the direct array with the given attribute name.The template type must match the attribute type with pName. 
 * \param pLayerElement     The layer element whose direct array to return.
 * \param pName             The given attribute name.
 * \param pStatus           Will be set to false if accessing the direct array encounters an error.
 * \return                  If pStatus receives \c true, the direct array at the given index is
 *                          returned. Otherwise the return value is \c undefined. 
 */ 
template <class T>
inline FbxLayerElementArrayTemplate<T>& FbxGetDirectArray( FbxLayerElementUserData *pLayerElement,const char* pName, bool* pStatus )
{
	return *(FbxLayerElementArrayTemplate<T>*)pLayerElement->GetDirectArrayVoid(pName,pStatus);
}

/** Returns the direct array with the given attribute name.The template type must match the attribute type with pName. 
 * \param pLayerElement     The layer element whose direct array to return.
 * \param pName             The given attribute name.
 * \param pStatus           Will be set to false if accessing the direct array encounters an error.
 * \return                  If pStatus receives \c true, the direct array at the given index is
 *                          returned. Otherwise the return value is \c undefined. 
 */ 
template <class T>
inline FbxLayerElementArrayTemplate<T> const& FbxGetDirectArray(FbxLayerElementUserData const *pLayerElement, const char* pName, bool* pStatus )
{
	return *(const FbxLayerElementArrayTemplate<T>*)pLayerElement->GetDirectArrayVoid(pName,pStatus);
}


/** Layer element for indicating smoothness of components of a geometry.
  * \remarks To be correctly saved in FBX file, this type of Layer element should have its reference 
  *         mode set to \e eDirect. 
  *
  * \nosubgrouping
  */
class FBXSDK_DLL FbxLayerElementSmoothing : public FbxLayerElementTemplate<int>
{
public:
    FBXSDK_FRIEND_NEW();

    /** Allocation method.
      * \param pOwner       The owner of this layer element.
      * \param pName        The name of this layer element.
      * \return             A pointer to the layer element or \c NULL if creation fails. 
      */
	static FbxLayerElementSmoothing* Create(FbxLayerContainer* pOwner, const char* pName);

	/** Sets the Reference Mode.
	  * \param pMode       Specifies the reference mode.
      * \remarks                    Only support eDirect.                                         
	  */
	void SetReferenceMode( FbxLayerElement::EReferenceMode pMode )
	{
		if( pMode != FbxLayerElement::eDirect )
		{
			FBX_ASSERT_NOW( "Smoothing layer elements must be direct mapped" );
			return;
		}
	}

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
protected:
	FbxLayerElementSmoothing()
	{
		mReferenceMode = FbxLayerElement::eDirect;
	}
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};

/** Layer element for indicating crease of components of a geometry.
  * \nosubgrouping
  */
class FBXSDK_DLL FbxLayerElementCrease : public FbxLayerElementTemplate<double>
{
public:
    FBXSDK_FRIEND_NEW();

    /** Allocation method.
      * \param pOwner       The owner of this layer element. 
      * \param pName        The name of this layer element.
      * \return             A pointer to the layer element or \c NULL if creation fails. 
      */
	static FbxLayerElementCrease* Create(FbxLayerContainer* pOwner, const char* pName);

	/** Sets the Reference Mode.
	  * \param pMode       Specifies the reference mode.
      * \remarks                    Only support eDirect.
	  */
	void SetReferenceMode( FbxLayerElement::EReferenceMode pMode )
	{
		if( pMode != FbxLayerElement::eDirect )
		{
			FBX_ASSERT_NOW( "Crease layer elements must be direct mapped" );
			return;
		}
	}

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
protected:
	FbxLayerElementCrease()
	{
		mReferenceMode = FbxLayerElement::eDirect;
	}
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};

/** Layer element for indicating hole of polygon of a geometry.
* \nosubgrouping
*/
class FBXSDK_DLL FbxLayerElementHole : public FbxLayerElementTemplate<bool>
{
public:
    FBXSDK_FRIEND_NEW();

        /** Allocation method.
        * \param pOwner       The owner of this layer element. 
        * \param pName        The name of this layer element.
        * \return             A pointer to the layer element or \c NULL if creation fails. 
        */
        static FbxLayerElementHole* Create(FbxLayerContainer* pOwner, const char* pName);

    /** Sets the Reference Mode.
    * \param pMode       Specifies the reference mode.
    * \remarks                    Only support eDirect.
    */
    void SetReferenceMode( FbxLayerElement::EReferenceMode pMode )
    {
        if( pMode != FbxLayerElement::eDirect )
        {
            FBX_ASSERT_NOW( "hole layer elements must be direct mapped" );
            return;
        }
    }

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
protected:
    FbxLayerElementHole()
    {
        mReferenceMode = FbxLayerElement::eDirect;
    }
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};

/** Layer element for indicating if specified components are shown/hidden 
 */
class FBXSDK_DLL FbxLayerElementVisibility : public FbxLayerElementTemplate<bool>
{
public:

    /** Allocation method.
      * \return             A pointer to the layer element or \c NULL if creation fails. 
      */
	FBXSDK_LAYER_ELEMENT_CREATE_DECLARE(LayerElementVisibility);

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
protected:
	FbxLayerElementVisibility();
	~FbxLayerElementVisibility();
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};

/** \brief Layer element for mapping Textures to a geometry. This class is deprecated.
  *
  * Deprecated since FBX SDK 2011. Textures (FbxTexture derived classes) should be connected
  * to material properties.
  *
  * For example:
  *
  * \code
  * FbxFileTexture*  file;
  * FbxSurfacePhong* phong;
  * phong->Diffuse.ConnectSrcObject(file);
  * \endcode
  * \see FbxSurfaceMaterial
  *
  * \remarks To be correctly saved in FBX file, this type of Layer element should have its reference 
  *         mode set to \e eIndexToDirect. 
  * \nosubgrouping
  */
class FBXSDK_DLL FbxLayerElementTexture : public FbxLayerElementTemplate<FbxTexture*>
{
public:
    /** Allocation method.
      * \return             A pointer to the layer element or \c NULL if creation fails. 
      */
	FBXSDK_LAYER_ELEMENT_CREATE_DECLARE(LayerElementTexture);

	/** \enum EBlendMode      Lets you control how textures are combined when you apply multiple layers of texture to a surface.
	  * - \e eTranslucent     The new texture layer is transparent (depending on the Alpha value).
	  * - \e eAdd             Add the color of the new texture to the previous texture.
	  * - \e eModulate        Multiples the color value of the new texture by the color values of all previous layers of texture.
	  * - \e eModulate2       Multiples the color value of the new texture by two and then by the color values of all previous layers of texture.
	  * - \e eOver            Equivalent to eTranslucent. Blends the new texture over top of the old texture, according to the new texture's alpha channel.
      * - \e eNormal,         The colors of the two layers will not interact in any way, and it will display the full value of the colors in layer 1.
      * - \e eDissolve,       Dissolve makes the lower layer take on the colors of the top layer, and how much depends on the opacity of the upper layer. 
      * - \e eDarken,		  Darken compares each pixel value of the upper layer to its counterpart's pixel value of the lower layer and chooses the darker of the two to display.
      * - \e eColorBurn,      Color Burn burns in the color of the upper layer with the lower layer. No part of the image will get lighter.
      * - \e eLinearBurn, 	  Linear Burn works like multiply but the results are more intense.
      * - \e eDarkerColor,    This blend mode simply divides pixel values of one layer with the other.
      * - \e eLighten,		  Lighten compares the two layers pixel for pixel and uses the lightest pixel value. No part of the image gets darker. 
      * - \e eScreen,		  Screen brightens by lightning the lower layer based on the lightness of the upper layer
      * - \e eColorDodge,	  Color Dodge dodges the lower layer with the upper layer, resulting in a lighter image. No part of the image will be darkened.
      * - \e eLinearDodge,    Linear Dodge works like screen but with more intense results.
      * - \e eLighterColor,   This blend mode has the opposite effect of the Darker Color mode. It compares all the values in both layers, then displays the lightest values.
      * - \e eSoftLight,      Soft Light will multiply the dark tones and screen the light tones.
      * - \e eHardLight,      Hard Light multiplies the dark colors and screens the light colors.
      * - \e eVividLight,     Vivid Light will dodges or burn the lower layer pixels depending on whether the upper layer pixels are brighter or darker than neutral gray. It works on the contrast of the lower layer.
      * - \e eLinearLight,    Linear Light is the same as Vivid light but it works on the brightness of the lower layer.
      * - \e ePinLight,       Pin Light changes the lower layer pixels depending on how bright the pixels are in the upper layer.
      * - \e eHardMix,		  Produces either white or black, depending on similarities between A and B.
      * - \e eDifference, 	  Difference reacts to the differences between the upper and lower layer pixels.
      * - \e eExclusion, 	  Exclusion uses the darkness of the lower layer to mask the difference between upper and lower layers.
      * - \e eSubtract,       The result color is the foreground color subtracted from the background color. The result color is then applied over the background color using the foreground alpha to define the opacity of the result.
      * - \e eDivide,         This blend mode simply divides pixel values of one layer with the other.
      * - \e eHue, 			  Hue changes the hue of the lower layer to the hue of the upper layer but leaves brightness and saturation alone.
      * - \e eSaturation,	  Saturation changes the saturation of the lower layer to the hue of the upper layer but leaves brightness and hue alone.
      * - \e eColor,          Color changes the hue and saturation of the lower layer to the hue and saturation of the upper layer but leaves luminosity alone.
      * - \e eLuminosity,     Luminosity changes the luminosity of the lower layer to the luminosity of the upper layer while leaving hue and saturation the same.
      * - \e eOverlay,        Multiplies (darkens) when the layer on which the mode is set is dark and screens (brightens) when the layer on which the mode is applied is lighter.
	  * - \e eBlendModeCount        Marks the end of the blend mode enum.
	  */
	enum EBlendMode
	{
		eTranslucent,
		eAdd,
		eModulate,
		eModulate2,
        eOver,
        eNormal,		
        eDissolve,
        eDarken,			
        eColorBurn,
        eLinearBurn, 	
        eDarkerColor,
        eLighten,			
        eScreen,		
        eColorDodge,
        eLinearDodge,
        eLighterColor,
        eSoftLight,		
        eHardLight,		
        eVividLight,
        eLinearLight,
        ePinLight, 		
        eHardMix,		
        eDifference, 		
        eExclusion, 		
        eSubtract,
        eDivide,
        eHue, 			
        eSaturation,		
        eColor,		
        eLuminosity,
        eOverlay,
		eBlendModeCount
	};

	/** Sets the way Textures blend between layers.
	  * \param pBlendMode     A valid blend mode.
	  */
	void       SetBlendMode(EBlendMode pBlendMode) { mBlendMode = pBlendMode; }

	/** Sets the transparency level between multiple texture levels.
	  * \param pAlpha     Set to a value between 0.0 and 1.0, where 0.0 is totally transparent and 1.0 is totally opaque.
	  * \remarks          Values smaller than 0.0 are clipped to 0.0, while values greater than 1.0 are clipped to 1.0.
	  */
    void       SetAlpha(double pAlpha)
    {
        if (pAlpha > 1.0)
            mAlpha = 1.0;
        else if (pAlpha < 0.0)
            mAlpha = 0.0;
        else
            mAlpha = pAlpha;
    }

	/** Returns the way Textures blend between layers.
	  * \return     The current Blend Mode.
	  */
	EBlendMode GetBlendMode() const                      { return mBlendMode; } 

	/** Returns the transparency level between multiple levels of textures.
	  * \return     An alpha value between 0.0 and 1.0, where 0.0 is totally transparent and 1.0 is totally opaque.
	  */
	double     GetAlpha() const                          { return mAlpha; }

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
	virtual int MemorySize() const
	{
		int size = FbxLayerElementTemplate<FbxTexture*>::MemorySize();
		size += sizeof(mBlendMode);
		size += sizeof(mAlpha);
		return size;
	}

protected:
	/** Constructor
	* By default, textures have a Blend Mode of eTranslucent,
	* a Reference Mode of eIndexToDirect, and an Alpha value of 1.0.
	*/
	FbxLayerElementTexture() : mBlendMode(eTranslucent)
	{
		mReferenceMode = eIndexToDirect;
		mAlpha         = 1.0;
	}

private:
	EBlendMode mBlendMode;
	double     mAlpha;
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};


/** FbxLayer class provides a base for the layering mechanism.
  * 
  * A layer can contain one or more of the following layer elements:
  *      \li Normals
  *      \li Binormals
  *      \li Tangents
  *      \li Materials
  *      \li Polygon Groups
  *      \li UVs
  *      \li Vertex Colors
  *      \li Smoothing informations
  *      \li Vertex Creases
  *      \li Edge Creases
  *      \li Custom User Data
  *      \li Visibilities 
  *      \li Textures (diffuse, ambient, specular, etc.) (deprecated)
  * 
  * A typical layer for a Mesh contains Normals, UVs and Materials. A typical layer for NURBS contains only Materials. 
  * In the case of the NURBS, the NURBS' parameterization is used for the UVs; no UVs should be specified.
  *
  * In most cases, you only need a single layer to describe a geometry. Many applications only support what is defined on the first layer. 
  * Take this into account when you fill the layer. For example, it is legal to define the Layer 0 with the UVs and then
  * define the model's Normals on layer 1. However if you construct a file this way, it may not be imported correctly in other applications.
  * Store the Normals in Layer 0 to avoid problems.
  *
  * Since FBX SDK 2011, Textures are connected to the properties of FbxSurfaceMaterial derived classes.
  * FbxLayerElementTexture is no longer used. See the code example in FbxLayerElementTexture for how to connect a texture.
  *
  * Since FBX SDK 2011, texture layering is achieved by FbxLayeredTexture. See the code example in FbxLayeredTexture for how to blend textures.
  *
  * Normally, you can access layer from FbxLayerContainer like FbxGeometry.
  * For example,
  * \code
  * FbxMesh* mesh;
  * FbxLayer* layer0 = mesh->GetLayer(0);
  * FbxLayerElementNormal* normals = layer0->GetNormals();
  * \endcode
  *
  * \nosubgrouping
  * \see FbxLayerElement
  * \see FbxLayerElementNormal
  * \see FbxLayerElementBinormal
  * \see FbxLayerElementTangent
  * \see FbxLayerElementMaterial
  * \see FbxLayerElementPolygonGroup
  * \see FbxLayerElementUV
  * \see FbxLayerElementVertexColor
  * \see FbxLayerElementSmoothing
  * \see FbxLayerElementCrease
  * \see FbxLayerElementUserData
  * \see FbxLayerElementHole
  * \see FbxLayerElementVisibility
  */
class FBXSDK_DLL FbxLayer
{

public:
    FBXSDK_FRIEND_NEW();

	/**
	  * \name Layer Element Management
	  */
	//@{

	/** Returns this layer's Normals description .
	  * \return      A pointer to the Normals layer element, or \c NULL if no Normals layer element is defined in this layer.
	  * \remarks     FbxNurbs or FbxPatch geometry should not have Normals defined.
	  */
	FbxLayerElementNormal* GetNormals();	

	/** Returns this layer's Normals description .
	  * \return      A pointer to the Normals layer element, or \c NULL if no Normals layer element is defined in this layer.
	  * \remarks     FbxNurbs or FbxPatch geometry should not have Normals defined.
	  */
	const FbxLayerElementNormal* GetNormals() const;

    /** Returns this layer's Tangents description.
      * \return      A pointer to the Tangents layer element, or \c NULL if no Tangents layer element is defined in this layer.
      * \remarks     FbxNurbs or FbxPatch geometry should not have Tangents defined.
      */
    FbxLayerElementTangent* GetTangents();	

    /** Returns this layer's Tangents description.
      * \return      A pointer to the Tangents layer element, or \c NULL if no Tangents layer element is defined in this layer.
      * \remarks     FbxNurbs or FbxPatch geometry should not have Tangents defined.
      */
    const FbxLayerElementTangent* GetTangents() const;

    /** Returns this layer's Binormals description.
      * \return      A pointer to the Binormals layer element, or \c NULL if no Binormals layer element is defined in this layer.
      * \remarks     FbxNurbs or FbxPatch geometry should not have Binormals defined.
      */
    FbxLayerElementBinormal* GetBinormals();	

    /** Returns this layer's Binormals description.
      * \return      A pointer to the Binormals layer element, or \c NULL if no Binormals layer element is defined in this layer.
      * \remarks     FbxNurbs or FbxPatch geometry should not have Binormals defined.
      */
    const FbxLayerElementBinormal* GetBinormals() const;

	/** Returns this layer's Materials description.
	  * \return     A pointer to the Materials layer element, or \c NULL if no Materials layer element is defined in this layer.
	  */
	FbxLayerElementMaterial* GetMaterials();

	/** Returns this layer's Materials description.
	  * \return     A pointer to the Materials layer element, or \c NULL if no Materials layer element is defined in this layer.
	  */
	const FbxLayerElementMaterial* GetMaterials() const;

	/** Returns this layer's Polygon Groups description.
	  * \return     A pointer to the Polygon Groups layer element, or \c NULL if no Polygon Groups layer element is defined in this layer.
	  */
	FbxLayerElementPolygonGroup* GetPolygonGroups();

	/** Returns this layer's Polygon Groups description.
	  * \return     A pointer to the Polygon Groups layer element, or \c NULL if no Polygon Groups layer element is defined in this layer.
	  */
	const FbxLayerElementPolygonGroup* GetPolygonGroups() const;

	/** Returns this layer's UV description.
	  * \param pTypeIdentifier          Layer element type identifier, should be a texture type identifier.  
	  * \return                         A pointer to the UVs layer element, or \c NULL if no UV is defined in this layer.
	  * \remarks                        FbxNurbs or FbxPatch geometry should not have UVs defined. 
	  *                                 The NURBS/Patch parameterization is used as UV parameters to map a texture.
	  */
	FbxLayerElementUV* GetUVs(FbxLayerElement::EType pTypeIdentifier=FbxLayerElement::eTextureDiffuse);

	/** Returns this layer's UV description.
	  * \param pTypeIdentifier          Layer element type identifier, should be a texture type identifier.  
	  * \return                         A pointer to the UVs layer element, or \c NULL if no UV is defined in this layer.
	  * \remarks                        FbxNurbs or FbxPatch geometry should not have UVs defined. 
	  *                                 The NURBS/Patch parameterization is used as UV parameters to map a texture.
	  */
	const FbxLayerElementUV* GetUVs(FbxLayerElement::EType pTypeIdentifier=FbxLayerElement::eTextureDiffuse) const;


	/** Returns the number of different UV sets in this layer.
	  */
	int GetUVSetCount() const;
	
	/** Returns an array that describes which UV sets are in this layer.
	  */
	FbxArray<FbxLayerElement::EType> GetUVSetChannels() const;

	/** Returns an array of UV sets in this layer.
	  */
	FbxArray<const FbxLayerElementUV*> GetUVSets() const;

	/** Returns this layer's Vertex Colors description.
	  * \return      A pointer to the Vertex Colors layer element, or \c NULL if no Vertex Color layer element is defined in this layer.
	  * \remarks     FbxNurbs or FbxPatch geometry should not have Vertex Colors defined, since no vertex exists.
	  */
	FbxLayerElementVertexColor* GetVertexColors();

	/** Returns this layer's Vertex Colors description.
	  * \return      A pointer to the Vertex Colors layer element, or \c NULL if no Vertex Color layer element is defined in this layer.
	  * \remarks     FbxNurbs or FbxPatch geometry should not have Vertex Colors defined, since no vertex exists.
	  */
	const FbxLayerElementVertexColor* GetVertexColors() const;

	/** Returns this layer's Smoothing description.
	  * \return      A pointer to the Smoothing layer element, or \c NULL if no Smoothing layer element is defined in this layer.
	  * \remarks     FbxNurbs or FbxPatch geometry should not have Smoothing defined.
	  */
	FbxLayerElementSmoothing* GetSmoothing();

	/** Returns this layer's Smoothing description.
	  * \return      A pointer to the Smoothing layer element, or \c NULL if no Smoothing layer element is defined in this layer.
	  * \remarks     FbxNurbs or FbxPatch geometry should not have Smoothing defined.
	  */
	const FbxLayerElementSmoothing* GetSmoothing() const;

	/** Returns this layer's vertex crease description.
	  * \return      A pointer to the Crease layer element, or \c NULL if no Crease layer element is defined in this layer.
	  * \remarks     Crease info should only be defined when the geometry is FbxSubDiv.
	  */
	FbxLayerElementCrease* GetVertexCrease();

	/** Returns this layer's vertex crease description.
	  * \return      A pointer to the Crease layer element, or \c NULL if no Crease layer element is defined in this layer.
	  * \remarks     Crease info should only be defined when the geometry is FbxSubDiv.
	  */
	const FbxLayerElementCrease* GetVertexCrease() const;

    /** Returns this layer's edge crease description.
      * \return      A pointer to the Crease layer element, or \c NULL if no Crease layer element is defined in this layer.
      * \remarks     Crease info should only be defined when the geometry is FbxSubDiv.
      */
    FbxLayerElementCrease* GetEdgeCrease();

    /** Returns this layer's edge crease description.
      * \return      A pointer to the Crease layer element, or \c NULL if no Crease layer element is defined in this layer.
      * \remarks     Crease info should only be defined when the geometry is FbxSubDiv.
      */
    const FbxLayerElementCrease* GetEdgeCrease() const;

    /** Returns this layer's Hole description.
    * \return      A pointer to the Hole layer element, or \c NULL if no Hole layer element is defined in this layer.
    * \remarks     Hole info should only be defined when the geometry is FbxMesh.
    */
    FbxLayerElementHole* GetHole();

    /** Returns this layer's Hole description.
    * \return      A pointer to the Hole layer element, or \c NULL if no Hole layer element is defined in this layer.
    * \remarks     Hole info should only be defined when the geometry is FbxMesh.
    */
    const FbxLayerElementHole* GetHole() const;

	/** Returns this layer's User Data.
	  * \return     A pointer to the User Data layer element, or \c NULL if no User Data layer element is defined in this layer.
	  */
	FbxLayerElementUserData* GetUserData();

	/** Returns this layer's User Data.
	  * \return     A pointer to the User Data layer element, or \c NULL if no User Data layer element is defined in this layer.
	  */
	const FbxLayerElementUserData* GetUserData() const;

	/** Returns this layer's visibility.
	  * \return     A pointer to the visibility layer element, or \c NULL if no visibility layer element is defined in this layer.
	  */
	FbxLayerElementVisibility* GetVisibility();

	/** Returns this layer's visibility.
	  * \return     A pointer to the visibility layer element, or \c NULL if no visibility layer element is defined in this layer.
	  */
	const FbxLayerElementVisibility* GetVisibility() const;

	/** Returns this layer's Textures description.
	  * \param pType            Layer element type, should be a texture type identifier.
	  * \return                 A pointer to the Textures layer element, or \c NULL if no Textures layer element is defined in this layer.
	  */
	FbxLayerElementTexture* GetTextures(FbxLayerElement::EType pType);

	/** Returns this layer's Textures description.
	  * \param pType            Layer element type, should be a texture type identifier.
	  * \return                 A pointer to the Textures layer element, or \c NULL if no Textures layer element is defined in this layer.
	  */
	const FbxLayerElementTexture* GetTextures(FbxLayerElement::EType pType) const;

	/** Sets this layer's Textures description.
	  * \param pType            Texture type identifier.
	  * \param pTextures        A pointer to the Textures layer element, or \c NULL to remove the Textures definition.
	  */
    void SetTextures(FbxLayerElement::EType pType, FbxLayerElementTexture* pTextures);

	/** Returns the specified type of layer element description for this layer.
	  * \param pType            The required Layer element type. 
	  *                             - Calling with eNormal is the equivalent of calling GetNormals().
      *                             - Calling with eBiNormal is the equivalent of calling GetBinormals().
      *                             - Calling with eTangent is the equivalent of calling GetTangents().
	  *                             - Calling with eMaterial is the equivalent of calling GetMaterials().
	  *                             - Calling with ePolygonGroup is the equivalent of calling GetPolygonGroups().
	  *                             - Calling with eUV is the equivalent of calling GetUVs().
	  *                             - Calling with eVertexColor is the equivalent of calling GetVertexColors().
	  *                             - Calling with eSmoothing is the equivalent of calling GetSmoothing().
      *                             - Calling with eVertexCrease is the equivalent of calling GetVertexCrease().
      *                             - Calling with eEdgeCrease is the equivalent of calling GetEdgeCrease().
	  *                             - Calling with eUserData is the equivalent of calling GetUserData().
      *                             - Calling with eVisibility is the equivalent of calling GetVisibility().
      *                             - Calling with texture type is the equivalent of calling GetTextures(FbxLayerElement::EType pType).
      * \param pIsUV            If \c true, requests the UV layer element that corresponds with the specified texture type.
	  * \return                 A pointer to the requested layer element, or \e NULL if the layer element is not defined in this layer.
	  */
	FbxLayerElement* GetLayerElementOfType(FbxLayerElement::EType pType, bool pIsUV=false);

	/** Returns the specified type of layer element description for this layer.
	  * \param pType            The required Layer element type. 
	  *                             - Calling with eNormal is the equivalent of calling GetNormals().
      *                             - Calling with eBiNormal is the equivalent of calling GetBinormals().
      *                             - Calling with eTangent is the equivalent of calling GetTangents().
	  *                             - Calling with eMaterial is the equivalent of calling GetMaterials().
	  *                             - Calling with ePolygonGroup is the equivalent of calling GetPolygonGroups().
	  *                             - Calling with eUV is the equivalent of calling GetUVs().
	  *                             - Calling with eVertexColor is the equivalent of calling GetVertexColors().
	  *                             - Calling with eSmoothing is the equivalent of calling GetSmoothing().
      *                             - Calling with eVertexCrease is the equivalent of calling GetVertexCrease().
      *                             - Calling with eEdgeCrease is the equivalent of calling GetEdgeCrease().
	  *                             - Calling with eUserData is the equivalent of calling GetUserData().
      *                             - Calling with eVisibility is the equivalent of calling GetVisibility().
      *                             - Calling with texture type is the equivalent of calling GetTextures(FbxLayerElement::EType pType).
      * \param pIsUV            If \c true, requests the UV layer element that corresponds with the specified texture type.
	  * \return                 A pointer to the requested layer element, or \e NULL if the layer element is not defined in this layer.
	  */
	const FbxLayerElement* GetLayerElementOfType(FbxLayerElement::EType pType, bool pIsUV=false) const;

	/** Sets this layer's Normals description.
	  * \param pNormals         A pointer to the Normals layer element, or \c NULL to remove the Normals definition.
	  * \remarks                FbxNurbs or FbxPatch geometry should not have Normals defined.
	  */
	void SetNormals(FbxLayerElementNormal* pNormals);

    /** Sets this layer's Binormals description.
      * \param pBinormals       A pointer to the Binormals layer element, or \c NULL to remove the Binormals definition.
      * \remarks                FbxNurbs or FbxPatch geometry should not have Binormals defined.
      */
    void SetBinormals(FbxLayerElementBinormal* pBinormals);

    /** Sets this layer's Tangents description.
      * \param pTangents        A pointer to the Tangents layer element, or \c NULL to remove the Tangents definition.
      * \remarks                FbxNurbs or FbxPatch geometry should not have Tangents defined.
      */
    void SetTangents(FbxLayerElementTangent* pTangents);

	/** Sets this layer's Materials description.
	  * \param pMaterials       A pointer to the Materials layer element, or \c NULL to remove the Material definition.
	  */
	void SetMaterials(FbxLayerElementMaterial* pMaterials);

	/** Sets this layer's Polygon Groups description.
	  * \param pPolygonGroups     A pointer to the Polygon Groups layer element, or \c NULL to remove the Polygon Group definition.
	  */
	void SetPolygonGroups(FbxLayerElementPolygonGroup* pPolygonGroups);

	/** Sets this layer's UVs description.
	  * \param pUVs             A pointer to the UVs layer element, or \c NULL to remove the UV definition.
	  * \param pTypeIdentifier  Layer element type, should be texture type.
	  * \remarks                FbxNurbs or FbxPatch geometry should not have UVs defined.
	  *                         The NURBS/Patch parameterization is used as UV parameters to map a texture.
	  */
	void SetUVs(FbxLayerElementUV* pUVs, FbxLayerElement::EType pTypeIdentifier=FbxLayerElement::eTextureDiffuse);

	/** Sets this layer's Vertex Colors description.
	  * \param pVertexColors     A pointer to the Vertex Colors layer element, or \c NULL to remove the Vertex Color definition.
	  * \remarks                 FbxNurbs or FbxPatch geometry should not have Vertex Colors defined, since no vertex exists.
	  */
	void SetVertexColors (FbxLayerElementVertexColor* pVertexColors);

	/** Sets this layer's Smoothing description.
	  * \param pSmoothing       A pointer to the Smoothing layer element, or \c NULL to remove the Smoothing definition.
	  * \remarks                FbxNurbs or FbxPatch geometry should not have Smoothing defined.
	  */
	void SetSmoothing (FbxLayerElementSmoothing* pSmoothing);

	/** Sets this layer's Vertex Crease description.
	  * \param pCrease          A pointer to the Vertex Crease layer element, or \c NULL to remove the Crease definition.
	  * \remarks                Crease should only be defined when the geometry is FbxSubDiv.
	  */
	void SetVertexCrease (FbxLayerElementCrease* pCrease);

    /** Sets this layer's Edge Crease description.
      * \param pCrease          A pointer to the Edge Crease layer element, or \c NULL to remove the Crease definition.
      * \remarks                Crease should only be defined when the geometry is FbxSubDiv.
      */
    void SetEdgeCrease (FbxLayerElementCrease* pCrease);

    /** Sets this layer's Hole description.
    * \param pHole          A pointer to the Hole layer element, or \c NULL to remove the Hole definition.
    * \remarks                Hole should only be defined when the geometry is FbxMesh.
    */
    void SetHole (FbxLayerElementHole* pHole);

	/** Sets this layer's User Data.
	  * \param pUserData        A pointer to the User Data layer element, or \c NULL to remove the User Data.
	  */
	void SetUserData (FbxLayerElementUserData* pUserData);

	/** Sets  this layer's the visibility.
	  * \param pVisibility      A pointer to the visibility layer element, or \c NULL to remove the visibility.
	  */
	void SetVisibility( FbxLayerElementVisibility* pVisibility );

    /** Sets the specified type of layer element description for this layer.
      * \param pLayerElement    A pointer to the layer element, or \c NULL to remove the layer element.
	  * \param pType            The required Layer element type. 
	  *                             - Calling with eNormal is the equivalent of calling GetNormals().
      *                             - Calling with eBiNormal is the equivalent of calling GetBinormals().
      *                             - Calling with eTangent is the equivalent of calling GetTangents().
	  *                             - Calling with eMaterial is the equivalent of calling GetMaterials().
	  *                             - Calling with ePolygonGroup is the equivalent of calling GetPolygonGroups().
	  *                             - Calling with eUV is the equivalent of calling GetUVs().
	  *                             - Calling with eVertexColor is the equivalent of calling GetVertexColors().
	  *                             - Calling with eSmoothing is the equivalent of calling GetSmoothing().
      *                             - Calling with eVertexCrease is the equivalent of calling GetVertexCrease().
      *                             - Calling with eEdgeCrease is the equivalent of calling GetEdgeCrease().
	  *                             - Calling with eUserData is the equivalent of calling GetUserData().
      *                             - Calling with eVisibility is the equivalent of calling GetVisibility().
      *                             - Calling with texture type is the equivalent of calling GetTextures(FbxLayerElement::EType pType).
      * \param pIsUV            If \c true, requests the UV layer element that corresponds with the specified texture type.
	  */
	void SetLayerElementOfType(FbxLayerElement* pLayerElement, FbxLayerElement::EType pType, bool pIsUV=false);

	/** Creates the specified type of layer element description for this layer.
	  * \param pType            The required Layer element type. 
      * \param pIsUV            When \c true, requests the UV LayerElement that corresponds with the specified Layer Element type (only applies to
	  *                         TEXTURE type layer elements).
	  * \return                 A pointer to the newly created layer element, or \e NULL if the layer element has not been created for this layer.
	  */
	FbxLayerElement* CreateLayerElementOfType(FbxLayerElement::EType pType, bool pIsUV=false);

    /** Clone function.
	  * \param pSrcLayer        The source layer to be cloned.
	  */
	void Clone(FbxLayer const& pSrcLayer);	
	
/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
protected:
	//! Assignment operator.
	FbxLayer& operator=(FbxLayer const& pSrcLayer);
	//@}	
private:

	FbxLayer(FbxLayerContainer& pOwner);
	virtual ~FbxLayer();

	void Clear();

	FbxLayerContainer& mOwner;

    FbxLayerElement*             mNonTexturesArray[FbxLayerElement::sTypeNonTextureCount];
    FbxLayerElementUV*           mUVsArray[FbxLayerElement::sTypeTextureCount];
    FbxLayerElementTexture*      mTexturesArray[FbxLayerElement::sTypeTextureCount];


	friend class FbxLayerContainer;

public:
	/**
	  * \name Serialization section
	  */
	//@{
		bool ContentWriteTo(FbxStream& pStream) const;
		bool ContentReadFrom(const FbxStream& pStream);
	//@}
	virtual int MemoryUsage() const;
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};

/**
  *  Utility macro for iterating over texture layer elements
  */
#define FBXSDK_FOR_EACH_TEXTURE(lLayerIndex) for((lLayerIndex)=0;(lLayerIndex)<FbxLayerElement::sTypeTextureCount;(lLayerIndex)++)

/**
  *  Utility macro for iterating over non-texture layer elements
  */
#define FBXSDK_FOR_EACH_NON_TEXTURE(lLayerIndex) for((lLayerIndex)=0;(lLayerIndex)<FbxLayerElement::sTypeNonTextureCount;(lLayerIndex)++)

/**
  *  Utility macro for getting texture layer element index by type
  */
#define FBXSDK_TEXTURE_INDEX(ElementType) (int(ElementType)-FbxLayerElement::sTypeTextureStartIndex)

/**
  *  Utility macro for getting texture layer element type by index
  */
#define FBXSDK_TEXTURE_TYPE(TextureIndex) (FbxLayerElement::EType((TextureIndex)+FbxLayerElement::sTypeTextureStartIndex))

/**
  *  Utility macro for getting non-texture layer element index by type
  */
#define FBXSDK_NON_TEXTURE_INDEX(ElementType) (int(ElementType)-FbxLayerElement::sTypeNonTextureStartIndex)

/**
  *  Utility macro for getting non-texture layer element type by index
  */
#define FBXSDK_NON_TEXTURE_TYPE(Index) (FbxLayerElement::EType((Index)+FbxLayerElement::sTypeNonTextureStartIndex))

/**  Defines geometry element classes.
  *  A geometry element describes how the geometry element is mapped to a geometry surface
  *  and how the mapping information is arranged in memory.
  *  \remarks Geometry elements are independent of layer elements and hide the complexity of layers.
  *  \code
  *  FbxGeometryElementUV* lUVs = lMesh->GetElementUV("map1");
  *  FbxGeometryElementUV::DirectArrayType lDirectArray = lUVs->GetDirectArray();
  *  int lDirectUVCount = lDirectArray.GetCount();
  *  FbxVector2 lFirstUV = lDirectArray[0];
  *  \endcode
  *  \see FbxGeometryBase
  */
typedef FbxLayerElement FbxGeometryElement;
typedef FbxLayerElementNormal FbxGeometryElementNormal;
typedef FbxLayerElementBinormal FbxGeometryElementBinormal;
typedef FbxLayerElementTangent FbxGeometryElementTangent;
typedef FbxLayerElementMaterial FbxGeometryElementMaterial;
typedef FbxLayerElementPolygonGroup FbxGeometryElementPolygonGroup;
typedef FbxLayerElementUV FbxGeometryElementUV;
typedef FbxLayerElementVertexColor FbxGeometryElementVertexColor;
typedef FbxLayerElementUserData FbxGeometryElementUserData;
typedef FbxLayerElementSmoothing FbxGeometryElementSmoothing;
typedef FbxLayerElementCrease FbxGeometryElementCrease;
typedef FbxLayerElementHole FbxGeometryElementHole;
typedef FbxLayerElementVisibility FbxGeometryElementVisibility;

#undef FBXSDK_LAYER_ELEMENT_CREATE_DECLARE

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_SCENE_GEOMETRY_LAYER_H_ */
