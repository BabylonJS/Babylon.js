/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxcolladautils.h
#ifndef _FBXSDK_FILEIO_COLLADA_UTILS_H_
#define _FBXSDK_FILEIO_COLLADA_UTILS_H_

#include <fbxsdk.h>

#include <fbxsdk/fileio/collada/fbxcolladatokens.h>
#include <fbxsdk/fileio/collada/fbxcolladaiostream.h>

#include <components/libxml2-2.7.8/include/libxml/globals.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

#ifndef INT_MAX
	#define INT_MAX 0x7FFFFFFF
#endif

#ifndef CENTIMETERS_TO_INCHES
	#define CENTIMETERS_TO_INCHES 2.54f
#endif

#ifndef RADIANS_TO_DEGREES
	#define RADIANS_TO_DEGREES 57.295799f
#endif

enum DAE_Flow { kCOLLADAFlowIn, kCOLLADAFlowOut, kCOLLADAFlowInOut };

const int MATRIX_STRIDE = 16;
const int VECTOR_STRIDE = 3;

#define COLLADA_ID_PROPERTY_NAME "COLLADA_ID"

class XmlNodeDeletionPolicy
{
public:
    static inline void DeleteIt(xmlNode ** ptr)
    {
        if (*ptr != NULL)
        {
            xmlFreeNode(*ptr);
            *ptr = NULL;
        }
    }
};

typedef FbxAutoPtr<xmlNode, XmlNodeDeletionPolicy> XmlNodePtr;
typedef FbxMap< FbxString, xmlNode* > SourceElementMapType;
typedef FbxMap< FbxString, xmlNode* > SkinMapType;

// Some information connecting COLLADA layer string, such as "NORMAL" or "UV", to FBX layer element type.
struct ColladaLayerTraits
{
    ColladaLayerTraits() 
		: mLayerType(FbxLayerElement::eUnknown), mLayerElementLength(0) {}
		
    ColladaLayerTraits(FbxLayerElement::EType pType, int pLength)
        : mLayerType(pType), mLayerElementLength(pLength) {}

    // Type of FBX element layer
    FbxLayerElement::EType mLayerType;
    // Count of double of each element in FBX element layer
    int mLayerElementLength;

    /** Construct traits according to COLLADA layer string.
      * \param pLabel COLLADA layer string.
      * \return Return created traits.
      */
    static const ColladaLayerTraits GetLayerTraits(const FbxString & pLabel);
};

/** Emit error message.
  * \param pSdkManger The SDK manager used to access user notification object.
  * \param pErrorMessage The message to be presented.
  */
void DAE_AddNotificationError(const FbxManager * pSdkManger, const FbxString & pErrorMessage);

/** Emit warning message.
  * \param pSdkManger The SDK manager used to access user notification object.
  * \param pWarningMessage The message to be presented.
  */
void DAE_AddNotificationWarning(const FbxManager * pSdkManger, const FbxString & pWarningMessage);

void DAE_ExportArray(xmlNode* parentXmlNode, const char* id, FbxArray<FbxVector4>& arr);
void DAE_ExportArray(xmlNode* parentXmlNode, const char* id, FbxArray<FbxVector2>& arr);
void DAE_ExportArray(xmlNode* parentXmlNode, const char* id, FbxArray<FbxColor>& arr);
void DAE_ExportArray(xmlNode* parentXmlNode, const char* id, FbxArray<double>& arr);
void DAE_ExportArray(xmlNode* parentXmlNode, const char* id, FbxStringList& arr);

// Syntax modification - for COLLADA 1.4
xmlNode* DAE_ExportSource14(xmlNode* parentXmlNode, const char* id, FbxStringList& accessorParams, FbxArray<double>& arr, bool isCommonProfile=true); 
xmlNode* DAE_ExportSource14(xmlNode* parentXmlNode, const char* id, FbxArray<FbxVector4>& arr);
xmlNode* DAE_ExportSource14(xmlNode* parentXmlNode, const char* id, FbxArray<FbxVector2>& arr);
xmlNode* DAE_ExportSource14(xmlNode* parentXmlNode, const char* id, FbxArray<FbxColor>& arr);
xmlNode* DAE_ExportSource14(xmlNode* parentXmlNode, const char* id, FbxArray<FbxAMatrix>& arr); 
xmlNode* DAE_ExportSource14(xmlNode* parentXmlNode, const char* id, FbxArray<FbxMatrix>& arr);
xmlNode* DAE_ExportSource14(xmlNode* parentXmlNode, const char* id, FbxStringList& arr, const char* type, bool isCommonProfile=true);


void DAE_ExportSourceArray(xmlNode* sourceNode, const char* id, FbxArray<FbxColor>& arr);
void DAE_ExportSourceArray14(xmlNode* sourceNode, const char* id, FbxArray<FbxColor>& arr);

xmlNode* DAE_ExportAccessor(xmlNode* parentXmlNode, const char* id, const char* arrayRef, int count, int stride, const char* name, const char* type);
xmlNode* DAE_ExportAccessor14(xmlNode* parentXmlNode, const char* id, const char* arrayRef, int count, int stride, const char* name, const char* type);

void DAE_AddXYZAccessor(xmlNode* parentXmlNode, const char* profile, const char* arrayName, const char* arrayRef, int count);
void DAE_AddSTAccessor(xmlNode* parentXmlNode, const char* profile, const char* arrayName, const char* arrayRef, int count);
void DAE_AddFlow(xmlNode* node, DAE_Flow flow);
void DAE_AddXYZAccessor14(xmlNode* parentXmlNode, const char* profile, const char* arrayName, const char* arrayRef, int count);
void DAE_AddSTAccessor14(xmlNode* parentXmlNode, const char* profile, const char* arrayName, const char* arrayRef, int count);

// AddParameter functions for COLLADA 1.3.
xmlNode* DAE_AddParameter(xmlNode* parentXmlNode, const char* name, const FbxColor& color, DAE_Flow flow);
xmlNode* DAE_AddParameter(xmlNode* parentXmlNode, const char* name, const FbxVector4& vector, DAE_Flow flow);
xmlNode* DAE_AddParameter(xmlNode* parentXmlNode, const char* name, double value, DAE_Flow flow);
xmlNode* DAE_AddParameter(xmlNode* parentXmlNode, const char* name, bool value, DAE_Flow flow);
xmlNode* DAE_AddParameter(xmlNode* parentXmlNode, const char* name, const char* type, const char* value, DAE_Flow flow);

// Overload functions without DAE_Flow, for COLLADA 1.4.
xmlNode* DAE_AddParameter(xmlNode* parentXmlNode, const char* name, const FbxDouble3& color);
xmlNode* DAE_AddParameter(xmlNode* parentXmlNode, const char* name, const FbxColor& color);
xmlNode* DAE_AddParameter(xmlNode* parentXmlNode, const char* name, const FbxVector4& vector);
xmlNode* DAE_AddParameter(xmlNode* parentXmlNode, const char* name, double value);
xmlNode* DAE_AddParameter(xmlNode* parentXmlNode, const char* name, bool value);
xmlNode* DAE_AddParameter(xmlNode* parentXmlNode, const char* name, const char* type, const char* value);
xmlNode* DAE_AddTechnique(xmlNode* parentXmlNode, const char* technique);
void DAE_AddInput(xmlNode* parentXmlNode, const char* semantic, const char* source, int idx = -1);
void DAE_AddInput14(xmlNode* parentXmlNode, const char* semantic, const char* source, int offset = -1, int set=-1);

FbxString matrixToString(const FbxAMatrix& mx);

typedef FbxArray<xmlNode*> CNodeList;

/** Find children elements whose type is included in a list of type.
  * \param pParentElement The parent element.
  * \param pTypes The list of types.
  * \param pChildrenElements The found children elements.
  */
void findChildrenByType(xmlNode* pParentElement, const FbxSet<FbxString>& pTypes, CNodeList& pChildrenElements);

/** Find children elements of a specific type.
  * \param pParentElement The parent element.
  * \param pType The type.
  * \param pChildrenElements The found children elements.
  */
void findChildrenByType(xmlNode* pParentElement, const char * pType, CNodeList& pChildrenElements);

xmlNode* getSourceAccessor(xmlNode* sourceNode);
xmlNode* getTechniqueNode(xmlNode* parent, const char * profile);

// Conversions
inline double inchesToCentimeters(double val) { return FbxFloor(val / CENTIMETERS_TO_INCHES * 100000) / 100000; }
inline double centimetersToInches(double val) { return FbxFloor(val * CENTIMETERS_TO_INCHES * 100000) / 100000; }

inline double degreesToRadians(double val) { return FbxFloor(val / RADIANS_TO_DEGREES * 100000) / 100000; }
inline double radiansToDegrees(double val) { return FbxFloor(val * RADIANS_TO_DEGREES * 100000) / 100000; }

/** Find a child element with a given attribute value.
  * \param pParentElement The parent element.
  * \param pAttributeName The name of the attribute.
  * \param pAttributeValue The value of the attribute.
  * \param pDefaultAttributeValue The default value of the attribute used when the attribute is not found explicitly.
  * \return Return NULL if no child element has the given attribute value.
  */
xmlNode* DAE_FindChildElementByAttribute(xmlNode* pParentElement, const char * pAttributeName,
                                        const char * pAttributeValue, const char * pDefaultAttributeValue = "");

/** Find a child element with a given tag.
  * \param pParentElement The parent element.
  * \param pTag The value of the tag.
  * \param pFindFrom Find from the next child after pFindFrom if pFindFrom is not NULL.
  * \return Return NULL if no child element has the given tag.
  */
xmlNode* DAE_FindChildElementByTag(xmlNode* pParentElement, const char * pTag, xmlNode* pFindFrom = NULL);

/** Get the content of a XML element.
  * \param pElement The element whose content is returned.
  * \param pData The returned data.
  */
template <typename TYPE>
void DAE_GetElementContent(xmlNode * pElement, TYPE & pData)
{
    if (pElement != NULL)
    {
        FbxAutoFreePtr<xmlChar> lContent(xmlNodeGetContent(pElement));
        FromString(&pData, (const char *)lContent.Get());
    }
}

/** Check whether this node is compatible to FBX transform structure.
  * \param pNodeElement The specific node element.
  * \return Return true if it is compatible.
  */
bool DAE_CheckCompatibility(xmlNode * pNodeElement);

/** Get the tag of the specific element.
  * \param pElement The specific element.
  * \param pTag Return the tag of the element.
  */
void DAE_GetElementTag(xmlNode * pElement, FbxString & pTag);

/** Get the value of an attribute of an element.
  * \param pElement The specific XML element.
  * \param pAttributeName The name of the specific attribute.
  * \return The value of the attribute in the form of a string. If the attribute is not available, an empty string is returned.
  */
const FbxString DAE_GetElementAttributeValue(xmlNode * pElement, const char * pAttributeName);

/** Get the value of an attribute of an element.
  * \param pElement The specific XML element.
  * \param pAttributeName The name of the specific attribute.
  * \param pData The returned data.
  * \return Return \c true on success and \c false if no attribute has the given name.
  */
template <typename TYPE>
bool DAE_GetElementAttributeValue(xmlNode * pElement, const char * pAttributeName, TYPE & pData)
{
    if (!pElement || !pAttributeName)
        return false;

    FbxAutoFreePtr<xmlChar> lPropertyValue(xmlGetProp(pElement, (const xmlChar *)pAttributeName));
    if (lPropertyValue)
    {
        FromString(&pData, (const char *)lPropertyValue.Get());
        return true;
    }
    return false;
}

// Special instantiation for string;
// Omit the whitespaces, just return the whole string
template <>
inline bool DAE_GetElementAttributeValue(xmlNode * pElement,
                                         const char * pAttributeName,
                                         FbxString & pData)
{
    if (!pElement || !pAttributeName)
        return false;

    FbxAutoFreePtr<xmlChar> lPropertyValue(xmlGetProp(pElement, (const xmlChar *)pAttributeName));
    if (lPropertyValue)
    {
        pData = (const char *)lPropertyValue.Get();
        return true;
    }
    return false;
}

/** Compare the value of specific attribute of specific element with given value.
  * \param pElement The specific element.
  * \param pAttributeName The name of the specific attribute.
  * \param pValue The value to compare with.
  * \return Return true if values equal.
  */
bool DAE_CompareAttributeValue(xmlNode * pElement,
                                      const char * pAttributeName,
                                      const char * pValue);

/** Get the ID of another element from the url attribute of the given element.
  * \param pElement The specific XML element in which the ID is looked for.
  * \return The ID of another element if success, or an empty string if no url attributes are found.
  */
const FbxString DAE_GetIDFromUrlAttribute(xmlNode * pElement);

/** Get the ID of another element from the source attribute of the given element.
  * \param pElement The specific XML element in which the ID is looked for.
  * \return The ID of another element if success, or an empty string if no source attributes are found.
  */
const FbxString DAE_GetIDFromSourceAttribute(xmlNode * pElement);

/** Get the ID of another element from the target attribute of the given element.
  * Note that in target attribute, the URI identifier may or may not preceded with the pound sign.
  * \param pElement The specific XML element in which the ID is looked for.
  * \return The ID of another element if success, or an empty string if no target attributes are found.
  */
const FbxString DAE_GetIDFromTargetAttribute(xmlNode * pElement);

/** Set the name of the object with a given name. If the name is empty, use the ID.
  * \param pObject The object whose name is to be set.
  * \param pName The name string.
  * \param pID The ID string.
  */
void DAE_SetName(FbxObject * pObject, const FbxString & pName, const FbxString & pID);

/** Get the COLLADA source element with a semantic meaning and a consumer element;
  * The COLLADA input element declares the input connections to a data source that a consumer requires.
  * A data source is a container of raw data that lacks semantic meaning so that the data can be reused within the
  * document. To use the data, a consumer declares a connection to it with the desired semantic information.
  * \param pConsumerElement A consumer element, like sampler element in animation system or joints element in controller system.
  * \param pSemantic A semantic meaning, like "INPUT", "OUTPUT" or "INTERPOLATION" in animation system.
  * \param pSourceElements The container of raw data.
  * \return Return \c NULL is failed.
  */
xmlNode * DAE_GetSourceWithSemantic(xmlNode * pConsumerElement, const char * pSemantic,
                                    const SourceElementMapType & pSourceElements);

/** Add a child element with specific content.
  * \param pParentElement The parent element.
  * \param pTag The tag string of the new child element.
  * \param pContent The content of the child element.
  * \return The created child element.
  */
template <typename T>
xmlNode * DAE_AddChildElement(xmlNode * pParentElement, const char * pTag,
                              const T & pContent)
{
    const FbxString lRepr = ToString(pContent);
    return xmlNewChild(pParentElement, NULL, (xmlChar *)pTag,
        (xmlChar *)lRepr.Buffer());
}

// Create a child element with empty content.
inline xmlNode * DAE_AddChildElement(xmlNode * pParentElement, const char * pTag)
{
    return DAE_AddChildElement(pParentElement, pTag, FbxString());
}

// Create a new element with empty content.
inline xmlNode * DAE_NewElement(const char * pTag)
{
    return xmlNewNode(NULL, reinterpret_cast<xmlChar*>(const_cast<char *>(pTag)));
}

/** Add an attribute for a element.
  * \param pElement The element where the attribute is added.
  * \param pAttributeName The name of the attribute.
  * \param pAttributeValue The value of the attribute.
  * \return The created attribute.
  */
template <typename T>
xmlAttr * DAE_AddAttribute(xmlNode * pElement, const FbxString & pAttributeName,
                           const T & pAttributeValue)
{
    const FbxString lRepr = ToString(pAttributeValue);
    return xmlNewProp(pElement, (xmlChar *)pAttributeName.Buffer(),
        (xmlChar *)lRepr.Buffer());
}

/** Import a COLLADA unit element into a FBX system unit.
  * \param pUnitElement The COLLADA unit element.
  * \return The created FBX system unit.
  */
const FbxSystemUnit DAE_ImportUnit(xmlNode * pUnitElement);

/** If the specific node has animation on its local translation, increase every key by the offset.
  * \param pNode The specific node.
  * \param pOffset The specific offset value.
  */
void IncreaseLclTranslationAnimation(FbxNode * pNode, FbxDouble3 & pOffset);

/** Search the elements with given tag, push the found results to the end of the given array.
  * \param pBaseElement Search from this element.
  * \param pTag The given tag.
  * \param pResult The array to return the found results.
  */
void RecursiveSearchElement(xmlNode * pBaseElement, const char * pTag, FbxArray<xmlNode*> & pResult);

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_FILEIO_COLLADA_UTILS_H_ */
