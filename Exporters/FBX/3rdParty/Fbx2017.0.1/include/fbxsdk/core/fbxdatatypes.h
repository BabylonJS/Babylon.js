/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxdatatypes.h
#ifndef _FBXSDK_CORE_DATA_TYPES_H_
#define _FBXSDK_CORE_DATA_TYPES_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/core/fbxpropertytypes.h>
#include <fbxsdk/core/fbxpropertyhandle.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

/** FBX SDK data type class
  * \nosubgrouping
  */
class FBXSDK_DLL FbxDataType
{
public:
	static FbxDataType Create(const char* pName, const EFbxType pType);
	static FbxDataType Create(const char* pName, const FbxDataType& pDataType);

	/**
	  *\name Constructor and Destructor.
	  */
	//@{
		//! Constructor.
		FbxDataType();

		/** Copy constructor.
		  * \param pDataType Another FbxDataType object copied to this one.
		  */
		FbxDataType(const FbxDataType& pDataType);

		//! Destroy this datatype.
		void Destroy();

		/** Constructor.
		  * \param pTypeInfoHandle Type information handle
		  */
		FbxDataType(const FbxPropertyHandle& pTypeInfoHandle);

		//! Destructor.
		~FbxDataType();
	//@}

	/** Assignment operator
	  * \param pDataType Datatype whose value is assigned to this datatype.
	  * \return This datatype
	  */
    inline FbxDataType& operator=(const FbxDataType& pDataType){ mTypeInfoHandle=pDataType.mTypeInfoHandle; return *this; }

	/**
	  * \name boolean operation
	  */
	//@{
		/** Equality operator
		  * \param pDataType Datatype to compare to.
		  * \return \c true if equal,\c false otherwise.
		  */
		inline bool operator==(const FbxDataType& pDataType) const { return mTypeInfoHandle==pDataType.mTypeInfoHandle; }

		/** Non-equality operator
		  * \param pDataType Datatype to compare to.
		  * \return \c true if unequal,\c false otherwise.
		  */
		inline bool operator!=(const FbxDataType& pDataType) const { return mTypeInfoHandle!=pDataType.mTypeInfoHandle; }
	//@}

	/** Test whether this datatype is a valid datatype.
	  * \return \c true if valid, \c false otherwise.
	  */
	inline bool Valid() const { return mTypeInfoHandle.Valid(); }

	/** Test if this datatype is the specified datatype. 
	  * \param pDataType Datatype to compare to.
	  * \return \c true if this datatype is the specified datatype, \c false otherwise. 
	  */
	inline bool Is(const FbxDataType& pDataType) const { return mTypeInfoHandle.Is(pDataType.mTypeInfoHandle); }

	/** Retrieve this data type.
	  * \return This data type.
	  */
	EFbxType GetType() const;

	/** Retrieve data type name.
	  * \return Data type name.
	  */
	const char* GetName() const;

	/** Retrieve the information handle of this data type.
	  * \return Information handle of this data type.
	  */
	inline const FbxPropertyHandle& GetTypeInfoHandle() const { return mTypeInfoHandle; }

private:
	FbxPropertyHandle mTypeInfoHandle;
    friend class FbxManager;
};

/** Retrieve data type from type enumeration index
  * \param pType The type enumeration index
  * \return The corresponding data type
  */
FBXSDK_DLL const FbxDataType& FbxGetDataTypeFromEnum(const EFbxType pType);

/** Retrieve data type name string used by I/O operations
  * \param pDataType The data type instance to retrieve its I/O name string
  * \return The data type name string
  * \remark This function is only used during I/O operations. It is not equal
  *         to the actual data type name.
  */
FBXSDK_DLL const char* FbxGetDataTypeNameForIO(const FbxDataType& pDataType);

//! \name Basic Data Types
//@{
	extern FBXSDK_DLL FbxDataType FbxUndefinedDT;
	extern FBXSDK_DLL FbxDataType FbxBoolDT;
	extern FBXSDK_DLL FbxDataType FbxCharDT;
	extern FBXSDK_DLL FbxDataType FbxUCharDT;
	extern FBXSDK_DLL FbxDataType FbxShortDT;
	extern FBXSDK_DLL FbxDataType FbxUShortDT;
	extern FBXSDK_DLL FbxDataType FbxIntDT;
	extern FBXSDK_DLL FbxDataType FbxUIntDT;
	extern FBXSDK_DLL FbxDataType FbxLongLongDT;
	extern FBXSDK_DLL FbxDataType FbxULongLongDT;
	extern FBXSDK_DLL FbxDataType FbxFloatDT;
	extern FBXSDK_DLL FbxDataType FbxHalfFloatDT;
	extern FBXSDK_DLL FbxDataType FbxDoubleDT;
	extern FBXSDK_DLL FbxDataType FbxDouble2DT;
	extern FBXSDK_DLL FbxDataType FbxDouble3DT;
	extern FBXSDK_DLL FbxDataType FbxDouble4DT;
	extern FBXSDK_DLL FbxDataType FbxDouble4x4DT;
	extern FBXSDK_DLL FbxDataType FbxEnumDT;
	extern FBXSDK_DLL FbxDataType FbxStringDT;
	extern FBXSDK_DLL FbxDataType FbxTimeDT;
	extern FBXSDK_DLL FbxDataType FbxReferenceDT;
	extern FBXSDK_DLL FbxDataType FbxBlobDT;
	extern FBXSDK_DLL FbxDataType FbxDistanceDT;
	extern FBXSDK_DLL FbxDataType FbxDateTimeDT;
//@}

//! \name Extended Data Types
//@{
	extern FBXSDK_DLL FbxDataType FbxColor3DT;
	extern FBXSDK_DLL FbxDataType FbxColor4DT;
	extern FBXSDK_DLL FbxDataType FbxCompoundDT;
	extern FBXSDK_DLL FbxDataType FbxReferenceObjectDT;
	extern FBXSDK_DLL FbxDataType FbxReferencePropertyDT;
	extern FBXSDK_DLL FbxDataType FbxVisibilityDT;
	extern FBXSDK_DLL FbxDataType FbxVisibilityInheritanceDT;
	extern FBXSDK_DLL FbxDataType FbxUrlDT;
	extern FBXSDK_DLL FbxDataType FbxXRefUrlDT;
//@}

//! \name Transform Data Types
//@{
	extern FBXSDK_DLL FbxDataType FbxTranslationDT;
	extern FBXSDK_DLL FbxDataType FbxRotationDT;
	extern FBXSDK_DLL FbxDataType FbxScalingDT;
	extern FBXSDK_DLL FbxDataType FbxQuaternionDT;
	extern FBXSDK_DLL FbxDataType FbxLocalTranslationDT;
	extern FBXSDK_DLL FbxDataType FbxLocalRotationDT;
	extern FBXSDK_DLL FbxDataType FbxLocalScalingDT;
	extern FBXSDK_DLL FbxDataType FbxLocalQuaternionDT;
	extern FBXSDK_DLL FbxDataType FbxTransformMatrixDT;
	extern FBXSDK_DLL FbxDataType FbxTranslationMatrixDT;
	extern FBXSDK_DLL FbxDataType FbxRotationMatrixDT;
	extern FBXSDK_DLL FbxDataType FbxScalingMatrixDT;
//@}

//! \name Material Data Types
//@{
	extern FBXSDK_DLL FbxDataType FbxMaterialEmissiveDT;
	extern FBXSDK_DLL FbxDataType FbxMaterialEmissiveFactorDT;
	extern FBXSDK_DLL FbxDataType FbxMaterialAmbientDT;
	extern FBXSDK_DLL FbxDataType FbxMaterialAmbientFactorDT;
	extern FBXSDK_DLL FbxDataType FbxMaterialDiffuseDT;
	extern FBXSDK_DLL FbxDataType FbxMaterialDiffuseFactorDT;
	extern FBXSDK_DLL FbxDataType FbxMaterialBumpDT;
	extern FBXSDK_DLL FbxDataType FbxMaterialNormalMapDT;
	extern FBXSDK_DLL FbxDataType FbxMaterialTransparentColorDT;
	extern FBXSDK_DLL FbxDataType FbxMaterialTransparencyFactorDT;
	extern FBXSDK_DLL FbxDataType FbxMaterialSpecularDT;
	extern FBXSDK_DLL FbxDataType FbxMaterialSpecularFactorDT;
	extern FBXSDK_DLL FbxDataType FbxMaterialShininessDT;
	extern FBXSDK_DLL FbxDataType FbxMaterialReflectionDT;
	extern FBXSDK_DLL FbxDataType FbxMaterialReflectionFactorDT;
	extern FBXSDK_DLL FbxDataType FbxMaterialDisplacementDT;
	extern FBXSDK_DLL FbxDataType FbxMaterialVectorDisplacementDT;
	extern FBXSDK_DLL FbxDataType FbxMaterialCommonFactorDT;
	extern FBXSDK_DLL FbxDataType FbxMaterialCommonTextureDT;
//@}

//! \name Layer Element Data Types
//@{
	extern FBXSDK_DLL FbxDataType FbxLayerElementUndefinedDT;
	extern FBXSDK_DLL FbxDataType FbxLayerElementNormalDT;
	extern FBXSDK_DLL FbxDataType FbxLayerElementBinormalDT;
	extern FBXSDK_DLL FbxDataType FbxLayerElementTangentDT;
	extern FBXSDK_DLL FbxDataType FbxLayerElementMaterialDT;
	extern FBXSDK_DLL FbxDataType FbxLayerElementTextureDT;
	extern FBXSDK_DLL FbxDataType FbxLayerElementPolygonGroupDT;
	extern FBXSDK_DLL FbxDataType FbxLayerElementUVDT;
	extern FBXSDK_DLL FbxDataType FbxLayerElementVertexColorDT;
	extern FBXSDK_DLL FbxDataType FbxLayerElementSmoothingDT;
	extern FBXSDK_DLL FbxDataType FbxLayerElementCreaseDT;
	extern FBXSDK_DLL FbxDataType FbxLayerElementHoleDT;
	extern FBXSDK_DLL FbxDataType FbxLayerElementUserDataDT;
	extern FBXSDK_DLL FbxDataType FbxLayerElementVisibilityDT;
//@}

//! \name I/O Specialized Data Types
//@{
	extern FBXSDK_DLL FbxDataType FbxAliasDT;
	extern FBXSDK_DLL FbxDataType FbxPresetsDT;
	extern FBXSDK_DLL FbxDataType FbxStatisticsDT;
	extern FBXSDK_DLL FbxDataType FbxTextLineDT;
	extern FBXSDK_DLL FbxDataType FbxUnitsDT;
	extern FBXSDK_DLL FbxDataType FbxWarningDT;
	extern FBXSDK_DLL FbxDataType FbxWebDT;
//@}

//! \name External Support Data Types
//@{
	extern FBXSDK_DLL FbxDataType FbxActionDT;
	extern FBXSDK_DLL FbxDataType FbxCameraIndexDT;
	extern FBXSDK_DLL FbxDataType FbxCharPtrDT;
	extern FBXSDK_DLL FbxDataType FbxConeAngleDT;
	extern FBXSDK_DLL FbxDataType FbxEventDT;
	extern FBXSDK_DLL FbxDataType FbxFieldOfViewDT;
	extern FBXSDK_DLL FbxDataType FbxFieldOfViewXDT;
	extern FBXSDK_DLL FbxDataType FbxFieldOfViewYDT;
	extern FBXSDK_DLL FbxDataType FbxFogDT;
	extern FBXSDK_DLL FbxDataType FbxHSBDT;
	extern FBXSDK_DLL FbxDataType FbxIKReachTranslationDT;
	extern FBXSDK_DLL FbxDataType FbxIKReachRotationDT;
	extern FBXSDK_DLL FbxDataType FbxIntensityDT;
	extern FBXSDK_DLL FbxDataType FbxLookAtDT;
	extern FBXSDK_DLL FbxDataType FbxOcclusionDT;
	extern FBXSDK_DLL FbxDataType FbxOpticalCenterXDT;
	extern FBXSDK_DLL FbxDataType FbxOpticalCenterYDT;
	extern FBXSDK_DLL FbxDataType FbxOrientationDT;
	extern FBXSDK_DLL FbxDataType FbxRealDT;
	extern FBXSDK_DLL FbxDataType FbxRollDT;
	extern FBXSDK_DLL FbxDataType FbxScalingUVDT;
	extern FBXSDK_DLL FbxDataType FbxShapeDT;
	extern FBXSDK_DLL FbxDataType FbxStringListDT;
	extern FBXSDK_DLL FbxDataType FbxTextureRotationDT;
	extern FBXSDK_DLL FbxDataType FbxTimeCodeDT;
	extern FBXSDK_DLL FbxDataType FbxTimeWarpDT;
	extern FBXSDK_DLL FbxDataType FbxTranslationUVDT;
	extern FBXSDK_DLL FbxDataType FbxWeightDT;
//@}

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_CORE_DATA_TYPES_H_ */
