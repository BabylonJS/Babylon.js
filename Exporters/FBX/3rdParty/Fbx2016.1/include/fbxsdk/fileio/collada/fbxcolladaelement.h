/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxcolladaelement.h
#ifndef _FBXSDK_FILEIO_COLLADA_ELEMENT_H_
#define _FBXSDK_FILEIO_COLLADA_ELEMENT_H_

#include <fbxsdk.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

// Utility functions to convert type to array tag used in COLLADA source element
template <typename T>
inline const FbxString TypeToArrayTag()
{
    return COLLADA_FLOAT_ARRAY_STRUCTURE;
}

template <>
inline const FbxString TypeToArrayTag<bool>()
{
    return COLLADA_BOOL_ARRAY_STRUCTURE;
}

template <>
inline const FbxString TypeToArrayTag<int>()
{
    return COLLADA_INT_ARRAY_STRUCTURE;
}

template <>
inline const FbxString TypeToArrayTag<FbxString>()
{
    return COLLADA_NAME_ARRAY_STRUCTURE;
}

// Utility functions to convert type to parameter tag used in COLLADA source element
template <typename T>
inline const FbxString TypeToParameterTag()
{
    return COLLADA_FLOAT_TYPE;
}

template <>
inline const FbxString TypeToParameterTag<bool>()
{
    return COLLADA_BOOL_TYPE;
}

template <>
inline const FbxString TypeToParameterTag<int>()
{
    return COLLADA_INT_TYPE;
}

template <>
inline const FbxString TypeToParameterTag<FbxString>()
{
    return COLLADA_NAME_TYPE;
}

//----------------------------------------------------------------------------//

/** A struct for convenient access to the content of common COLLADA element.
  */
struct ElementContentAccessor
{
    ElementContentAccessor();
    ElementContentAccessor(xmlNode * pElement);
    virtual ~ElementContentAccessor();

    template <typename TYPE>
    bool GetNext(TYPE * pData)
    {
        return FromString(pData, mPointer, &mPointer);
    }

    template <typename TYPE>
    int GetArray(TYPE * pArray,
        int pSourceUnitOffset = 0, int pSourceUnitValidCount = 1, int pSourceUnitSize = 1,
        int pDestUnitOffset = 0, int pDestUnitValidCount = 1, int pDestUnitSize = 1,
        TYPE pDefaultValue = TYPE())
    {
        if (pArray)
        {
            return FromStringToArray(mPointer, pArray,
                pSourceUnitOffset, pSourceUnitValidCount, pSourceUnitSize,
                pDestUnitOffset, pDestUnitValidCount, pDestUnitSize, pDefaultValue);
        }
        return 0;
    }

    xmlChar * mContent;
    const char * mPointer;
};

//----------------------------------------------------------------------------//

/** A struct for convenient access to the content of COLLADA source element.
  */
template <typename TYPE>
struct SourceElementContentAccessor : public ElementContentAccessor
{
    SourceElementContentAccessor(xmlNode * pSourceElement)
        : mCount(0), mStride(1), mOffset(0)
    {
        bool lReadCount = true;
        xmlNode* lTechniqueElement = DAE_FindChildElementByTag(pSourceElement, COLLADA_TECHNIQUE_COMMON_ELEMENT);
        if (lTechniqueElement)
        {
            xmlNode* lAccessorElement = DAE_FindChildElementByTag(lTechniqueElement, COLLADA_ACCESSOR_STRUCTURE);
            FBX_ASSERT(lAccessorElement);
            if (!lAccessorElement)
                return;

            DAE_GetElementAttributeValue(lAccessorElement, COLLADA_COUNT_PROPERTY, mCount);
            DAE_GetElementAttributeValue(lAccessorElement, COLLADA_STRIDE_PROPERTY, mStride);
            DAE_GetElementAttributeValue(lAccessorElement, COLLADA_OFFSET_PROPERTY, mOffset);
            lReadCount = false;
        }

        xmlNode * lDataArrayElement = DAE_FindChildElementByTag(pSourceElement,
            TypeToArrayTag<TYPE>());
        // Some COLLADA exporters use IDREF_array instead of Name_array
        if (!lDataArrayElement && TypeToArrayTag<TYPE>() == COLLADA_NAME_ARRAY_STRUCTURE)
            lDataArrayElement = DAE_FindChildElementByTag(pSourceElement, COLLADA_IDREF_ARRAY_STRUCTURE);
        FBX_ASSERT(lDataArrayElement);

        if (lDataArrayElement && lReadCount)
            DAE_GetElementAttributeValue(lDataArrayElement, COLLADA_COUNT_PROPERTY, mCount);

        mContent = xmlNodeGetContent(lDataArrayElement);
        mPointer = (const char *)mContent;
    }

    int mCount;
    int mStride;
    int mOffset;
};

//----------------------------------------------------------------------------//

/** Representing a common COLLADA element.
  */
class ElementBase
{
public:
    enum
    {
        MATRIX_STRIDE = 16,
    };

    // The name of user property in FBX which is used to preserve the ID of COLLADA element
    static const char* smID_PROPERTY_NAME;    

    /** Constructor & Destructor.
      */
    ElementBase();
    virtual ~ElementBase();

    /** Access for XML element.
      */
    void SetXMLElement(xmlNode * pElement) { mXMLElement = pElement; }
    xmlNode * GetXMLElement() const { return mXMLElement; }

    /** Get the ID of the element.
      * \return Return the ID string.
      */
    const FbxString & GetID() const;

    /** Get the unit of the element,
      * which takes effect in this element and its children elements.
      * \return Return the unit.
      */
    const FbxSystemUnit * GetUnit() const;

private:
    xmlNode * mXMLElement;
    mutable FbxString * mID;
    mutable FbxSystemUnit * mUnit;
};

/** Convert from ID to URL, just add a prefix "#".
  * \param pID The ID string.
  * \return Return the URL string.
  */
inline const FbxString URL(const FbxString & pID)
{
    return FbxString("#") + pID;
}

/** Convert the array data to a source element under specific parent element.
  * \param pParentElement The parent element.
  * \param pID The ID of the new source element.
  * \param pData The array data.
  * \param pCount The length of the array.
  * \param pStride The stride of each unit in the array. For example, when you
  * export an array of FbxDouble3 of size 10, you convert it to a double array
  * of size 30 with a stride 3 and call this method.
  * \return The new source element.
  */
template <typename T>
xmlNode * AddSourceElement(xmlNode * pParentElement, const char * pID,
                           const T * pData, int pCount, int pStride = 1)
{
    FBX_ASSERT(pParentElement && pData);
    if (!pParentElement || !pData)
        return NULL;

    xmlNode * lSourceElement = DAE_AddChildElement(pParentElement, COLLADA_SOURCE_STRUCTURE);
    DAE_AddAttribute(lSourceElement, COLLADA_ID_PROPERTY, pID);

    FbxString lContent;
    const int lDataCount = pCount * pStride;
    for (int lIndex = 0; lIndex < lDataCount; ++lIndex)
    {
        lContent += ToString(pData[lIndex]);
        if (lIndex != lDataCount - 1)
            lContent += " ";
    }
    const FbxString lArrayID = FbxString(pID) + "-array";
    xmlNode * lArrayElement = DAE_AddChildElement(lSourceElement, TypeToArrayTag<T>(), lContent);
    DAE_AddAttribute(lArrayElement, COLLADA_ID_PROPERTY, lArrayID);
    DAE_AddAttribute(lArrayElement, COLLADA_COUNT_PROPERTY, lDataCount);

    xmlNode * lTechniqueCommonElement = DAE_AddChildElement(lSourceElement,
        COLLADA_TECHNIQUE_COMMON_ELEMENT);
    xmlNode * lAccessElement = DAE_AddChildElement(lTechniqueCommonElement, 
        COLLADA_ACCESSOR_STRUCTURE);
    DAE_AddAttribute(lAccessElement, COLLADA_SOURCE_PROPERTY, URL(lArrayID));
    DAE_AddAttribute(lAccessElement, COLLADA_COUNT_PROPERTY, pCount);
    DAE_AddAttribute(lAccessElement, COLLADA_STRIDE_PROPERTY, pStride);

    for (int lStrideIndex = 0; lStrideIndex < pStride; ++lStrideIndex)
    {
        xmlNode * lParamElement = DAE_AddChildElement(lAccessElement, COLLADA_PARAMETER_STRUCTURE);
        DAE_AddAttribute(lParamElement, COLLADA_TYPE_PROPERTY, TypeToParameterTag<T>());
    }

    return lSourceElement;
}

/** Populate the layer element with direct array and return index array for later use.
  * \param pLayerElement The layer element to be populated.
  * \param pSourceElement The source element containing the direct array data.
  * \param pSize The count of double data of direct array element.
  * \return Return the index array of the layer element.
  */
template <typename TYPE> FbxLayerElementArray * PopulateLayerElementDirectArray(FbxLayerElement * pLayerElement, xmlNode * pSourceElement, int pSize)
{
    SourceElementContentAccessor<TYPE> lSourceElementAccessor(pSourceElement);

    FbxLayerElementTemplate<TYPE> * lLayerElement = (FbxLayerElementTemplate<TYPE> *)pLayerElement;
    lLayerElement->SetMappingMode(FbxLayerElement::eByPolygonVertex);
    lLayerElement->SetReferenceMode(FbxLayerElement::eIndexToDirect);
    lLayerElement->GetDirectArray().SetCount(lSourceElementAccessor.mCount);

    TYPE * lArray = NULL;
    lArray = lLayerElement->GetDirectArray().GetLocked(lArray);
    lSourceElementAccessor.GetArray((double *)lArray, 0, pSize,
        lSourceElementAccessor.mStride, 0, pSize, sizeof(TYPE)/sizeof(double), 1.0);
    lLayerElement->GetDirectArray().Release(&lArray, lArray);

    return &(lLayerElement->GetIndexArray());
}

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_FILEIO_COLLADA_ELEMENT_H_ */
