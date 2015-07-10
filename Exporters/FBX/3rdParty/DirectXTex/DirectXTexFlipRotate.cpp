//-------------------------------------------------------------------------------------
// DirectXTexFlipRotate.cpp
//  
// DirectX Texture Library - Image flip/rotate operations
//
// THIS CODE AND INFORMATION IS PROVIDED "AS IS" WITHOUT WARRANTY OF
// ANY KIND, EITHER EXPRESSED OR IMPLIED, INCLUDING BUT NOT LIMITED TO
// THE IMPLIED WARRANTIES OF MERCHANTABILITY AND/OR FITNESS FOR A
// PARTICULAR PURPOSE.
//
// Copyright (c) Microsoft Corporation. All rights reserved.
//
// http://go.microsoft.com/fwlink/?LinkId=248926
//-------------------------------------------------------------------------------------

#include "directxtexp.h"

using Microsoft::WRL::ComPtr;

namespace DirectX
{

//-------------------------------------------------------------------------------------
// Do flip/rotate operation using WIC
//-------------------------------------------------------------------------------------
static HRESULT _PerformFlipRotateUsingWIC( _In_ const Image& srcImage, _In_ DWORD flags,
                                           _In_ const WICPixelFormatGUID& pfGUID, _In_ const Image& destImage )
{
    if ( !srcImage.pixels || !destImage.pixels )
        return E_POINTER;

    assert( srcImage.format == destImage.format );

    IWICImagingFactory* pWIC = _GetWIC();
    if ( !pWIC )
        return E_NOINTERFACE;

    ComPtr<IWICBitmap> source;
    HRESULT hr = pWIC->CreateBitmapFromMemory( static_cast<UINT>( srcImage.width ), static_cast<UINT>( srcImage.height ), pfGUID,
                                               static_cast<UINT>( srcImage.rowPitch ), static_cast<UINT>( srcImage.slicePitch ),
                                               srcImage.pixels, source.GetAddressOf() );
    if ( FAILED(hr) )
        return hr;

    ComPtr<IWICBitmapFlipRotator> FR;
    hr = pWIC->CreateBitmapFlipRotator( FR.GetAddressOf() );
    if ( FAILED(hr) )
        return hr;

    hr = FR->Initialize( source.Get(), static_cast<WICBitmapTransformOptions>( flags ) );
    if ( FAILED(hr) )
        return hr;

    WICPixelFormatGUID pfFR;
    hr = FR->GetPixelFormat( &pfFR );
    if ( FAILED(hr) )
        return hr;

    if ( memcmp( &pfFR, &pfGUID, sizeof(GUID) ) != 0 )
    {
        // Flip/rotate should return the same format as the source...
        return HRESULT_FROM_WIN32( ERROR_NOT_SUPPORTED );
    }

    UINT nwidth, nheight;
    hr = FR->GetSize( &nwidth, &nheight );
    if ( FAILED(hr) )
        return hr;

    if ( destImage.width != nwidth || destImage.height != nheight )
        return E_FAIL;

    hr = FR->CopyPixels( 0, static_cast<UINT>( destImage.rowPitch ), static_cast<UINT>( destImage.slicePitch ), destImage.pixels );
    if ( FAILED(hr) )
        return hr;

    return S_OK;
}


//-------------------------------------------------------------------------------------
// Do conversion, flip/rotate using WIC, conversion cycle
//-------------------------------------------------------------------------------------
static HRESULT _PerformFlipRotateViaF32( _In_ const Image& srcImage, _In_ DWORD flags, _In_ const Image& destImage )
{
    if ( !srcImage.pixels || !destImage.pixels )
        return E_POINTER;

    assert( srcImage.format != DXGI_FORMAT_R32G32B32A32_FLOAT );
    assert( srcImage.format == destImage.format );

    ScratchImage temp;
    HRESULT hr = _ConvertToR32G32B32A32( srcImage, temp );
    if ( FAILED(hr) )
        return hr;

    const Image *tsrc = temp.GetImage( 0, 0, 0 );
    if ( !tsrc )
        return E_POINTER;

    ScratchImage rtemp;
    hr = rtemp.Initialize2D( DXGI_FORMAT_R32G32B32A32_FLOAT, destImage.width, destImage.height, 1, 1 );
    if ( FAILED(hr) )
        return hr;

    const Image *tdest = rtemp.GetImage( 0, 0, 0 );
    if ( !tdest )
        return E_POINTER;

    hr = _PerformFlipRotateUsingWIC( *tsrc, flags, GUID_WICPixelFormat128bppRGBAFloat, *tdest );
    if ( FAILED(hr) )
        return hr;

    temp.Release();

    hr = _ConvertFromR32G32B32A32( *tdest, destImage );
    if ( FAILED(hr) )
        return hr;

    return S_OK;
}


//=====================================================================================
// Entry-points
//=====================================================================================

//-------------------------------------------------------------------------------------
// Flip/rotate image
//-------------------------------------------------------------------------------------
_Use_decl_annotations_
HRESULT FlipRotate( const Image& srcImage, DWORD flags, ScratchImage& image )
{
    if ( !srcImage.pixels )
        return E_POINTER;

    if ( !flags )
        return E_INVALIDARG;

#ifdef _M_X64
    if ( (srcImage.width > 0xFFFFFFFF) || (srcImage.height > 0xFFFFFFFF) )
        return E_INVALIDARG;
#endif

    if ( IsCompressed( srcImage.format ) )
    {
        // We don't support flip/rotate operations on compressed images
        return HRESULT_FROM_WIN32( ERROR_NOT_SUPPORTED );
    }

    static_assert( TEX_FR_ROTATE0 == WICBitmapTransformRotate0, "TEX_FR_ROTATE0 no longer matches WIC" );
    static_assert( TEX_FR_ROTATE90 == WICBitmapTransformRotate90, "TEX_FR_ROTATE90 no longer matches WIC" );
    static_assert( TEX_FR_ROTATE180 == WICBitmapTransformRotate180, "TEX_FR_ROTATE180 no longer matches WIC" );
    static_assert( TEX_FR_ROTATE270 == WICBitmapTransformRotate270, "TEX_FR_ROTATE270 no longer matches WIC" );
    static_assert( TEX_FR_FLIP_HORIZONTAL == WICBitmapTransformFlipHorizontal, "TEX_FR_FLIP_HORIZONTAL no longer matches WIC" );
    static_assert( TEX_FR_FLIP_VERTICAL == WICBitmapTransformFlipVertical, "TEX_FR_FLIP_VERTICAL no longer matches WIC" );

    // Only supports 90, 180, 270, or no rotation flags... not a combination of rotation flags
    switch ( flags & (TEX_FR_ROTATE90|TEX_FR_ROTATE180|TEX_FR_ROTATE270) )
    {
    case 0:
    case TEX_FR_ROTATE90:
    case TEX_FR_ROTATE180:
    case TEX_FR_ROTATE270:
        break;

    default:
        return E_INVALIDARG;
    }

    size_t nwidth = srcImage.width;
    size_t nheight = srcImage.height;

    if (flags & (TEX_FR_ROTATE90|TEX_FR_ROTATE270))
    {
        nwidth = srcImage.height;
        nheight = srcImage.width;
    }

    HRESULT hr = image.Initialize2D( srcImage.format, nwidth, nheight, 1, 1 );
    if ( FAILED(hr) )
        return hr;
   
    const Image *rimage = image.GetImage( 0, 0, 0 );
    if ( !rimage )
        return E_POINTER;

    WICPixelFormatGUID pfGUID;
    if ( _DXGIToWIC( srcImage.format, pfGUID ) )
    {
        // Case 1: Source format is supported by Windows Imaging Component
        hr = _PerformFlipRotateUsingWIC( srcImage, flags, pfGUID, *rimage );
    }
    else
    {
        // Case 2: Source format is not supported by WIC, so we have to convert, flip/rotate, and convert back
        hr = _PerformFlipRotateViaF32( srcImage, flags, *rimage );
    }

    if ( FAILED(hr) )
    {
        image.Release();
        return hr;
    }

    return S_OK;
}


//-------------------------------------------------------------------------------------
// Flip/rotate image (complex)
//-------------------------------------------------------------------------------------
_Use_decl_annotations_
HRESULT FlipRotate( const Image* srcImages, size_t nimages, const TexMetadata& metadata,
                    DWORD flags, ScratchImage& result )
{
    if ( !srcImages || !nimages )
        return E_INVALIDARG;

    if ( IsCompressed( metadata.format ) )
    {
        // We don't support flip/rotate operations on compressed images
        return HRESULT_FROM_WIN32( ERROR_NOT_SUPPORTED );
    }

    static_assert( TEX_FR_ROTATE0 == WICBitmapTransformRotate0, "TEX_FR_ROTATE0 no longer matches WIC" );
    static_assert( TEX_FR_ROTATE90 == WICBitmapTransformRotate90, "TEX_FR_ROTATE90 no longer matches WIC" );
    static_assert( TEX_FR_ROTATE180 == WICBitmapTransformRotate180, "TEX_FR_ROTATE180 no longer matches WIC" );
    static_assert( TEX_FR_ROTATE270 == WICBitmapTransformRotate270, "TEX_FR_ROTATE270 no longer matches WIC" );
    static_assert( TEX_FR_FLIP_HORIZONTAL == WICBitmapTransformFlipHorizontal, "TEX_FR_FLIP_HORIZONTAL no longer matches WIC" );
    static_assert( TEX_FR_FLIP_VERTICAL == WICBitmapTransformFlipVertical, "TEX_FR_FLIP_VERTICAL no longer matches WIC" );

    // Only supports 90, 180, 270, or no rotation flags... not a combination of rotation flags
    switch ( flags & (TEX_FR_ROTATE90|TEX_FR_ROTATE180|TEX_FR_ROTATE270) )
    {
    case 0:
    case TEX_FR_ROTATE90:
    case TEX_FR_ROTATE180:
    case TEX_FR_ROTATE270:
        break;

    default:
        return E_INVALIDARG;
    }

    TexMetadata mdata2 = metadata;

    bool flipwh = false;
    if (flags & (TEX_FR_ROTATE90|TEX_FR_ROTATE270))
    {
        flipwh = true;
        mdata2.width = metadata.height;
        mdata2.height = metadata.width;
    }

    HRESULT hr = result.Initialize( mdata2 );
    if ( FAILED(hr) )
        return hr;

    if ( nimages != result.GetImageCount() )
    {
        result.Release();
        return E_FAIL;
    }

    const Image* dest = result.GetImages();
    if ( !dest )
    {
        result.Release();
        return E_POINTER;
    }

    WICPixelFormatGUID pfGUID;
    bool wicpf = _DXGIToWIC( metadata.format, pfGUID );

    for( size_t index=0; index < nimages; ++index )
    {
        const Image& src = srcImages[ index ];
        if ( src.format != metadata.format )
        {
            result.Release();
            return E_FAIL;
        }

#ifdef _M_X64
        if ( (src.width > 0xFFFFFFFF) || (src.height > 0xFFFFFFFF) )
            return E_FAIL;
#endif

        const Image& dst = dest[ index ];
        assert( dst.format == metadata.format );

        if ( flipwh )
        {
            if ( src.width != dst.height || src.height != dst.width )
            {
                result.Release();
                return E_FAIL;
            }
        }
        else
        {
            if ( src.width != dst.width || src.height != dst.height )
            {
                result.Release();
                return E_FAIL;
            }
        }

        if (wicpf)
        {
            // Case 1: Source format is supported by Windows Imaging Component
            hr = _PerformFlipRotateUsingWIC( src, flags, pfGUID, dst );
        }
        else
        {
            // Case 2: Source format is not supported by WIC, so we have to convert, flip/rotate, and convert back
            hr = _PerformFlipRotateViaF32( src, flags, dst );
        }

        if ( FAILED(hr) )
        {
            result.Release();
            return hr;
        }
    }

    return S_OK;
}

}; // namespace
