//-------------------------------------------------------------------------------------
// DirectXTexMipMaps.cpp
//  
// DirectX Texture Library - Mip-map generation
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

#include "filters.h"

using Microsoft::WRL::ComPtr;

namespace DirectX
{

//-------------------------------------------------------------------------------------
// Mipmap helper functions
//-------------------------------------------------------------------------------------
inline static bool ispow2( _In_ size_t x )
{
    return ((x != 0) && !(x & (x - 1)));
}


//--- mipmap (1D/2D) levels computation ---
static size_t _CountMips( _In_ size_t width, _In_ size_t height )
{
    size_t mipLevels = 1;

    while ( height > 1 || width > 1 )
    {
        if ( height > 1 )
            height >>= 1;

        if ( width > 1 )
            width >>= 1;

        ++mipLevels;
    }
    
    return mipLevels;
}

bool _CalculateMipLevels( _In_ size_t width, _In_ size_t height, _Inout_ size_t& mipLevels )
{
    if ( mipLevels > 1 )
    {
        size_t maxMips = _CountMips(width,height);
        if ( mipLevels > maxMips )
            return false;
    }
    else if ( mipLevels == 0 )
    {
        mipLevels = _CountMips(width,height);
    }
    else
    {
        mipLevels = 1;
    }
    return true;
}


//--- volume mipmap (3D) levels computation ---
static size_t _CountMips3D( _In_ size_t width, _In_ size_t height, _In_ size_t depth )
{
    size_t mipLevels = 1;

    while ( height > 1 || width > 1 || depth > 1 )
    {
        if ( height > 1 )
            height >>= 1;

        if ( width > 1 )
            width >>= 1;

        if ( depth > 1 )
            depth >>= 1;

        ++mipLevels;
    }
    
    return mipLevels;
}

bool _CalculateMipLevels3D( _In_ size_t width, _In_ size_t height, _In_ size_t depth, _Inout_ size_t& mipLevels )
{
    if ( mipLevels > 1 )
    {
        size_t maxMips = _CountMips3D(width,height,depth);
        if ( mipLevels > maxMips )
            return false;
    }
    else if ( mipLevels == 0 )
    {
        mipLevels = _CountMips3D(width,height,depth);
    }
    else
    {
        mipLevels = 1;
    }
    return true;
}


//-------------------------------------------------------------------------------------
// WIC related helper functions
//-------------------------------------------------------------------------------------
static HRESULT _EnsureWicBitmapPixelFormat( _In_ IWICImagingFactory* pWIC, _In_ IWICBitmap* src, _In_ DWORD filter,
                                            _In_ const WICPixelFormatGUID& desiredPixelFormat,
                                            _Deref_out_ IWICBitmap** dest )
{
    if ( !pWIC || !src || !dest )
        return E_POINTER;

    *dest = nullptr;
    
    WICPixelFormatGUID actualPixelFormat;
    HRESULT hr = src->GetPixelFormat( &actualPixelFormat );
    
    if ( SUCCEEDED(hr) )
    {
        if ( memcmp( &actualPixelFormat, &desiredPixelFormat, sizeof(WICPixelFormatGUID) ) == 0 )
        {
            src->AddRef();
            *dest = src;
        }
        else
        {
            ComPtr<IWICFormatConverter> converter;
            hr = pWIC->CreateFormatConverter( converter.GetAddressOf() );
            if ( SUCCEEDED(hr) )
            {
                hr = converter->Initialize( src, desiredPixelFormat, _GetWICDither(filter), 0, 0, WICBitmapPaletteTypeCustom );
            }

            if ( SUCCEEDED(hr) )
            {
                hr = pWIC->CreateBitmapFromSource( converter.Get(), WICBitmapCacheOnDemand, dest );
            }
        }
    }

    return hr;
}


//--- Resizing color and alpha channels separately using WIC ---
HRESULT _ResizeSeparateColorAndAlpha( _In_ IWICImagingFactory* pWIC, _In_ IWICBitmap* original,
                                      _In_ size_t newWidth, _In_ size_t newHeight, _In_ DWORD filter, _Inout_ const Image* img )
{
    if ( !pWIC || !original || !img )
        return E_POINTER;

    const WICBitmapInterpolationMode interpolationMode = _GetWICInterp(filter);

    WICPixelFormatGUID desiredPixelFormat = GUID_WICPixelFormatUndefined;
    HRESULT hr = original->GetPixelFormat( &desiredPixelFormat );
    
    size_t colorBytesInPixel = 0;
    size_t colorBytesPerPixel = 0;
    size_t colorWithAlphaBytesPerPixel = 0;
    WICPixelFormatGUID colorPixelFormat = GUID_WICPixelFormatUndefined;
    WICPixelFormatGUID colorWithAlphaPixelFormat = GUID_WICPixelFormatUndefined;

    if ( SUCCEEDED(hr) )
    {
        ComPtr<IWICComponentInfo> componentInfo;
        hr = pWIC->CreateComponentInfo( desiredPixelFormat, componentInfo.GetAddressOf() );

        ComPtr<IWICPixelFormatInfo> pixelFormatInfo;
        if ( SUCCEEDED(hr) )
        {
            hr = componentInfo.As( &pixelFormatInfo );
        }

        UINT bitsPerPixel = 0;
        if ( SUCCEEDED(hr) )
        {
            hr = pixelFormatInfo->GetBitsPerPixel( &bitsPerPixel );
        }

        if ( SUCCEEDED(hr) )
        {
            if ( bitsPerPixel <= 32 )
            {
                colorBytesInPixel = colorBytesPerPixel = 3;
                colorPixelFormat = GUID_WICPixelFormat24bppBGR;

                colorWithAlphaBytesPerPixel = 4;
                colorWithAlphaPixelFormat = GUID_WICPixelFormat32bppBGRA;
            }
            else
            {
#if(_WIN32_WINNT >= _WIN32_WINNT_WIN8) || defined(_WIN7_PLATFORM_UPDATE)
                if ( _IsWIC2() )
                {
                    colorBytesInPixel = colorBytesPerPixel = 12;
                    colorPixelFormat = GUID_WICPixelFormat96bppRGBFloat;
                }
                else
#endif
                {
                    colorBytesInPixel = 12;
                    colorBytesPerPixel = 16;
                    colorPixelFormat = GUID_WICPixelFormat128bppRGBFloat;
                }

                colorWithAlphaBytesPerPixel = 16;
                colorWithAlphaPixelFormat = GUID_WICPixelFormat128bppRGBAFloat;
            }
        }
    }
    
    // Resize color only image (no alpha channel)
    ComPtr<IWICBitmap> resizedColor;
    if ( SUCCEEDED(hr) )
    { 
        ComPtr<IWICBitmapScaler> colorScaler;
        hr = pWIC->CreateBitmapScaler( colorScaler.GetAddressOf() );
        if ( SUCCEEDED(hr) )
        {
            ComPtr<IWICBitmap> converted;
            hr = _EnsureWicBitmapPixelFormat( pWIC, original, filter, colorPixelFormat, converted.GetAddressOf() );
            if ( SUCCEEDED(hr) )
            {
                hr = colorScaler->Initialize( converted.Get(), static_cast<UINT>(newWidth), static_cast<UINT>(newHeight), interpolationMode );
            }
        }
            
        if ( SUCCEEDED(hr) )
        {
            ComPtr<IWICBitmap> resized;
            hr = pWIC->CreateBitmapFromSource( colorScaler.Get(), WICBitmapCacheOnDemand, resized.GetAddressOf() );
            if ( SUCCEEDED(hr) )
            {
                hr = _EnsureWicBitmapPixelFormat( pWIC, resized.Get(), filter, colorPixelFormat, resizedColor.GetAddressOf() );
            }
        }
    }
    
    // Resize color+alpha image
    ComPtr<IWICBitmap> resizedColorWithAlpha;
    if ( SUCCEEDED(hr) )
    {
        ComPtr<IWICBitmapScaler> colorWithAlphaScaler;
        hr = pWIC->CreateBitmapScaler( colorWithAlphaScaler.GetAddressOf() );
        if ( SUCCEEDED(hr) )
        {
            ComPtr<IWICBitmap> converted;
            hr = _EnsureWicBitmapPixelFormat( pWIC, original, filter, colorWithAlphaPixelFormat, converted.GetAddressOf() );
            if ( SUCCEEDED(hr) )
            {
                hr = colorWithAlphaScaler->Initialize( converted.Get(), static_cast<UINT>(newWidth), static_cast<UINT>(newHeight), interpolationMode );
            }
        }
            
        if ( SUCCEEDED(hr) )
        {
            ComPtr<IWICBitmap> resized;
            hr = pWIC->CreateBitmapFromSource( colorWithAlphaScaler.Get(), WICBitmapCacheOnDemand, resized.GetAddressOf() );
            if ( SUCCEEDED(hr) )
            {
                hr = _EnsureWicBitmapPixelFormat( pWIC, resized.Get(), filter, colorWithAlphaPixelFormat, resizedColorWithAlpha.GetAddressOf() );
            }
        }
    }

    // Merge pixels (copying color channels from color only image to color+alpha image)
    if ( SUCCEEDED(hr) )
    {
        ComPtr<IWICBitmapLock> colorLock;
        ComPtr<IWICBitmapLock> colorWithAlphaLock;
        hr = resizedColor->Lock( nullptr, WICBitmapLockRead, colorLock.GetAddressOf() );
        if ( SUCCEEDED(hr) )
        {
            hr = resizedColorWithAlpha->Lock( nullptr, WICBitmapLockWrite, colorWithAlphaLock.GetAddressOf() );
        }
        
        if ( SUCCEEDED(hr) )
        {
            WICInProcPointer colorWithAlphaData = nullptr;
            UINT colorWithAlphaSizeInBytes = 0;
            UINT colorWithAlphaStride = 0;
            
            hr = colorWithAlphaLock->GetDataPointer( &colorWithAlphaSizeInBytes, &colorWithAlphaData );
            if ( SUCCEEDED(hr) )
            {
                if ( !colorWithAlphaData )
                {
                    hr = E_POINTER;
                }
                else
                {
                    hr = colorWithAlphaLock->GetStride( &colorWithAlphaStride );
                }
            }

            WICInProcPointer colorData = nullptr;
            UINT colorSizeInBytes = 0;
            UINT colorStride = 0;
            if ( SUCCEEDED(hr) )
            {
                hr = colorLock->GetDataPointer( &colorSizeInBytes, &colorData );
                if ( SUCCEEDED(hr) )
                {
                    if ( !colorData )
                    {
                        hr = E_POINTER;
                    }
                    else
                    {
                        hr = colorLock->GetStride( &colorStride );
                    }
                }
            }
            
            for ( size_t j = 0; SUCCEEDED(hr) && j < newHeight; j++ )
            {
                for ( size_t i = 0; SUCCEEDED(hr) && i < newWidth; i++ )
                {
                    size_t colorWithAlphaIndex = (j * colorWithAlphaStride) + (i * colorWithAlphaBytesPerPixel);
                    size_t colorIndex = (j * colorStride) + (i * colorBytesPerPixel);
                    
                    if ( ((colorWithAlphaIndex + colorBytesInPixel) > colorWithAlphaSizeInBytes)
                         || ( (colorIndex + colorBytesPerPixel) > colorSizeInBytes) )
                    {
                        hr = E_INVALIDARG;
                    }
                    else
                    {
#pragma warning( suppress : 26014 6386 ) // No overflow possible here
                        memcpy_s( colorWithAlphaData + colorWithAlphaIndex, colorWithAlphaBytesPerPixel, colorData + colorIndex, colorBytesInPixel );
                    }
                }
            }
        }
    }

    if ( SUCCEEDED(hr) )
    {
        ComPtr<IWICBitmap> wicBitmap;
        hr = _EnsureWicBitmapPixelFormat( pWIC, resizedColorWithAlpha.Get(), filter, desiredPixelFormat, wicBitmap.GetAddressOf() );
        if ( SUCCEEDED(hr) )
        {
            hr = wicBitmap->CopyPixels( nullptr, static_cast<UINT>(img->rowPitch), static_cast<UINT>(img->slicePitch), img->pixels );
        }
    }

    return hr;
}


//--- determine when to use WIC vs. non-WIC paths ---
static bool _UseWICFiltering( _In_ DXGI_FORMAT format, _In_ DWORD filter )
{
    if ( filter & TEX_FILTER_FORCE_NON_WIC )
    {
        // Explicit flag indicates use of non-WIC code paths
        return false;
    }

    if ( filter & TEX_FILTER_FORCE_WIC )
    {
        // Explicit flag to use WIC code paths, skips all the case checks below
        return true;
    }

    if ( IsSRGB(format) || (filter & TEX_FILTER_SRGB) )
    {
        // Use non-WIC code paths for sRGB correct filtering
        return false;
    }

    static_assert( TEX_FILTER_POINT == 0x100000, "TEX_FILTER_ flag values don't match TEX_FILTER_MASK" );

    switch ( filter & TEX_FILTER_MASK )
    {
    case TEX_FILTER_LINEAR:
        if ( filter & TEX_FILTER_WRAP )
        {
            // WIC only supports 'clamp' semantics (MIRROR is equivalent to clamp for linear)
            return false;
        }

        if ( BitsPerColor(format) > 8 )
        {
            // Avoid the WIC bitmap scaler when doing Linear filtering of XR/HDR formats
            return false;
        }
        break;

    case TEX_FILTER_CUBIC:
        if ( filter & ( TEX_FILTER_WRAP | TEX_FILTER_MIRROR ) )
        {
            // WIC only supports 'clamp' semantics
            return false;
        }

        if ( BitsPerColor(format) > 8 )
        {
            // Avoid the WIC bitmap scaler when doing Cubic filtering of XR/HDR formats
            return false;
        }
        break;

    case TEX_FILTER_TRIANGLE:
        // WIC does not implement this filter
        return false;
    }

    return true;
}


//--- mipmap (1D/2D) generation using WIC image scalar ---
static HRESULT _GenerateMipMapsUsingWIC( _In_ const Image& baseImage, _In_ DWORD filter, _In_ size_t levels,
                                         _In_ const WICPixelFormatGUID& pfGUID, _In_ const ScratchImage& mipChain, _In_ size_t item )
{
    assert( levels > 1 );

    if ( !baseImage.pixels || !mipChain.GetPixels() )
        return E_POINTER;

    IWICImagingFactory* pWIC = _GetWIC();
    if ( !pWIC )
        return E_NOINTERFACE;

    size_t width = baseImage.width;
    size_t height = baseImage.height;

    ComPtr<IWICBitmap> source;
    HRESULT hr = pWIC->CreateBitmapFromMemory( static_cast<UINT>( width ), static_cast<UINT>( height ), pfGUID,
                                               static_cast<UINT>( baseImage.rowPitch ), static_cast<UINT>( baseImage.slicePitch ),
                                               baseImage.pixels, source.GetAddressOf() );
    if ( FAILED(hr) )
        return hr;

    // Copy base image to top miplevel
    const Image *img0 = mipChain.GetImage( 0, item, 0 );
    if ( !img0 )
        return E_POINTER;

    uint8_t* pDest = img0->pixels;
    if ( !pDest )
        return E_POINTER;

    const uint8_t *pSrc = baseImage.pixels;
    for( size_t h=0; h < height; ++h )
    {
        size_t msize = std::min<size_t>( img0->rowPitch, baseImage.rowPitch );
        memcpy_s( pDest, img0->rowPitch, pSrc, msize );  
        pSrc += baseImage.rowPitch;
        pDest += img0->rowPitch;
    }

    ComPtr<IWICComponentInfo> componentInfo;
    hr = pWIC->CreateComponentInfo( pfGUID, componentInfo.GetAddressOf() );
    if ( FAILED(hr) )
        return hr;

    ComPtr<IWICPixelFormatInfo2> pixelFormatInfo;
    hr = componentInfo.As( &pixelFormatInfo );
    if ( FAILED(hr) )
        return hr;

    BOOL supportsTransparency = FALSE;
    hr = pixelFormatInfo->SupportsTransparency( &supportsTransparency );
    if ( FAILED(hr) )
        return hr;

    // Resize base image to each target mip level
    for( size_t level = 1; level < levels; ++level )
    {
        const Image *img = mipChain.GetImage( level, item, 0 );
        if ( !img )
            return E_POINTER;

        if ( height > 1 )
            height >>= 1;

        if ( width > 1 )
            width >>= 1;

        assert( img->width == width && img->height == height && img->format == baseImage.format );

        if ( (filter & TEX_FILTER_SEPARATE_ALPHA) && supportsTransparency )
        {
            hr = _ResizeSeparateColorAndAlpha( pWIC, source.Get(), width, height, filter, img );
            if ( FAILED(hr) )
                return hr;
        }
        else
        {
            ComPtr<IWICBitmapScaler> scaler;
            hr = pWIC->CreateBitmapScaler( scaler.GetAddressOf() );
            if ( FAILED(hr) )
                return hr;

            hr = scaler->Initialize( source.Get(), static_cast<UINT>( width ), static_cast<UINT>( height ), _GetWICInterp( filter ) );
            if ( FAILED(hr) )
                return hr;

            WICPixelFormatGUID pfScaler;
            hr = scaler->GetPixelFormat( &pfScaler );
            if ( FAILED(hr) )
                return hr;

            if ( memcmp( &pfScaler, &pfGUID, sizeof(WICPixelFormatGUID) ) == 0 )
            {
                hr = scaler->CopyPixels( 0, static_cast<UINT>( img->rowPitch ), static_cast<UINT>( img->slicePitch ), img->pixels );
                if ( FAILED(hr) )
                    return hr;
            }
            else
            {
                // The WIC bitmap scaler is free to return a different pixel format than the source image, so here we
                // convert it back
                ComPtr<IWICFormatConverter> FC;
                hr = pWIC->CreateFormatConverter( FC.GetAddressOf() );
                if ( FAILED(hr) )
                    return hr;

                hr = FC->Initialize( scaler.Get(), pfGUID, _GetWICDither( filter ), 0, 0, WICBitmapPaletteTypeCustom );
                if ( FAILED(hr) )
                    return hr;

                hr = FC->CopyPixels( 0, static_cast<UINT>( img->rowPitch ), static_cast<UINT>( img->slicePitch ), img->pixels );  
                if ( FAILED(hr) )
                    return hr;
            }
        }
    }

    return S_OK;
}


//-------------------------------------------------------------------------------------
// Generate (1D/2D) mip-map helpers (custom filtering)
//-------------------------------------------------------------------------------------
static HRESULT _Setup2DMips( _In_reads_(nimages) const Image* baseImages, _In_ size_t nimages, _In_ const TexMetadata& mdata,
                             _Out_ ScratchImage& mipChain )
{
    if ( !baseImages || !nimages )
        return E_INVALIDARG;

    assert( mdata.mipLevels > 1 );
    assert( mdata.arraySize == nimages );
    assert( mdata.depth == 1 && mdata.dimension != TEX_DIMENSION_TEXTURE3D );
    assert( mdata.width == baseImages[0].width );
    assert( mdata.height == baseImages[0].height );
    assert( mdata.format == baseImages[0].format );
 
    HRESULT hr = mipChain.Initialize( mdata );
    if ( FAILED(hr) )
        return hr;

    // Copy base image(s) to top of mip chain
    for( size_t item=0; item < nimages; ++item )
    {
        const Image& src = baseImages[item];

        const Image *dest = mipChain.GetImage( 0, item, 0 );
        if ( !dest )
        {
            mipChain.Release();
            return E_POINTER;
        }

        assert( src.format == dest->format );

        uint8_t* pDest = dest->pixels;
        if ( !pDest )
        {
            mipChain.Release();
            return E_POINTER;
        }

        const uint8_t *pSrc = src.pixels;
        size_t rowPitch = src.rowPitch;
        for( size_t h=0; h < mdata.height; ++h )
        {
            size_t msize = std::min<size_t>( dest->rowPitch, rowPitch );
            memcpy_s( pDest, dest->rowPitch, pSrc, msize );  
            pSrc += rowPitch;
            pDest += dest->rowPitch;
        }
    }

    return S_OK;
}

//--- 2D Point Filter ---
static HRESULT _Generate2DMipsPointFilter( _In_ size_t levels, _In_ const ScratchImage& mipChain, _In_ size_t item )
{
    if ( !mipChain.GetImages() )
        return E_INVALIDARG;

    // This assumes that the base image is already placed into the mipChain at the top level... (see _Setup2DMips)

    assert( levels > 1 );

    size_t width = mipChain.GetMetadata().width;
    size_t height = mipChain.GetMetadata().height;

    // Allocate temporary space (2 scanlines)
    ScopedAlignedArrayXMVECTOR scanline( reinterpret_cast<XMVECTOR*>( _aligned_malloc( (sizeof(XMVECTOR)*width*2), 16 ) ) );
    if ( !scanline )
        return E_OUTOFMEMORY;

    XMVECTOR* target = scanline.get();

    XMVECTOR* row = target + width;

    // Resize base image to each target mip level
    for( size_t level=1; level < levels; ++level )
    {
#ifdef _DEBUG
        memset( row, 0xCD, sizeof(XMVECTOR)*width );
#endif

        // 2D point filter
        const Image* src = mipChain.GetImage( level-1, item, 0 );
        const Image* dest = mipChain.GetImage( level, item, 0 );

        if ( !src || !dest )
            return E_POINTER;

        const uint8_t* pSrc = src->pixels;
        uint8_t* pDest = dest->pixels;

        size_t rowPitch = src->rowPitch;

        size_t nwidth = (width > 1) ? (width >> 1) : 1;
        size_t nheight = (height > 1) ? (height >> 1) : 1;

        size_t xinc = ( width << 16 ) / nwidth;
        size_t yinc = ( height << 16 ) / nheight;

        size_t lasty = size_t(-1);

        size_t sy = 0;
        for( size_t y = 0; y < nheight; ++y )
        {
            if ( (lasty ^ sy) >> 16 )
            {
                if ( !_LoadScanline( row, width, pSrc + ( rowPitch * (sy >> 16) ), rowPitch, src->format ) )
                    return E_FAIL;
                lasty = sy;
            }

            size_t sx = 0;
            for( size_t x = 0; x < nwidth; ++x )
            {
                target[ x ] = row[ sx >> 16 ];
                sx += xinc;
            }

            if ( !_StoreScanline( pDest, dest->rowPitch, dest->format, target, nwidth ) )
                return E_FAIL;
            pDest += dest->rowPitch;

            sy += yinc;
        }

        if ( height > 1 )
            height >>= 1;

        if ( width > 1 )
            width >>= 1;
    }

    return S_OK;
}


//--- 2D Box Filter ---
static HRESULT _Generate2DMipsBoxFilter( _In_ size_t levels, _In_ DWORD filter, _In_ const ScratchImage& mipChain, _In_ size_t item )
{
    if ( !mipChain.GetImages() )
        return E_INVALIDARG;

    // This assumes that the base image is already placed into the mipChain at the top level... (see _Setup2DMips)

    assert( levels > 1 );

    size_t width = mipChain.GetMetadata().width;
    size_t height = mipChain.GetMetadata().height;

    if ( !ispow2(width) || !ispow2(height) )
        return E_FAIL;

    // Allocate temporary space (3 scanlines)
    ScopedAlignedArrayXMVECTOR scanline( reinterpret_cast<XMVECTOR*>( _aligned_malloc( (sizeof(XMVECTOR)*width*3), 16 ) ) );
    if ( !scanline )
        return E_OUTOFMEMORY;

    XMVECTOR* target = scanline.get();

    XMVECTOR* urow0 = target + width;
    XMVECTOR* urow1 = target + width*2;

    const XMVECTOR* urow2 = urow0 + 1;
    const XMVECTOR* urow3 = urow1 + 1;

    // Resize base image to each target mip level
    for( size_t level=1; level < levels; ++level )
    {
        if ( height <= 1 )
        {
            urow1 = urow0;
        }

        if ( width <= 1 )
        {
            urow2 = urow0;
            urow3 = urow1;
        }

        // 2D box filter
        const Image* src = mipChain.GetImage( level-1, item, 0 );
        const Image* dest = mipChain.GetImage( level, item, 0 );

        if ( !src || !dest )
            return E_POINTER;

        const uint8_t* pSrc = src->pixels;
        uint8_t* pDest = dest->pixels;

        size_t rowPitch = src->rowPitch;

        size_t nwidth = (width > 1) ? (width >> 1) : 1;
        size_t nheight = (height > 1) ? (height >> 1) : 1;

        for( size_t y = 0; y < nheight; ++y )
        {
            if ( !_LoadScanlineLinear( urow0, width, pSrc, rowPitch, src->format, filter ) )
                return E_FAIL;
            pSrc += rowPitch;

            if ( urow0 != urow1 )
            {
                if ( !_LoadScanlineLinear( urow1, width, pSrc, rowPitch, src->format, filter ) )
                    return E_FAIL;
                pSrc += rowPitch;
            }

            for( size_t x = 0; x < nwidth; ++x )
            {
                size_t x2 = x << 1;

                AVERAGE4( target[ x ], urow0[ x2 ], urow1[ x2 ], urow2[ x2 ], urow3[ x2 ] );
            }

            if ( !_StoreScanlineLinear( pDest, dest->rowPitch, dest->format, target, nwidth, filter ) )
                return E_FAIL;
            pDest += dest->rowPitch;
        }

        if ( height > 1 )
            height >>= 1;

        if ( width > 1 )
            width >>= 1;
    }

    return S_OK;
}


//--- 2D Linear Filter ---
static HRESULT _Generate2DMipsLinearFilter( _In_ size_t levels, _In_ DWORD filter, _In_ const ScratchImage& mipChain, _In_ size_t item )
{
    if ( !mipChain.GetImages() )
        return E_INVALIDARG;

    // This assumes that the base image is already placed into the mipChain at the top level... (see _Setup2DMips)

    assert( levels > 1 );

    size_t width = mipChain.GetMetadata().width;
    size_t height = mipChain.GetMetadata().height;

    // Allocate temporary space (3 scanlines, plus X and Y filters)
    ScopedAlignedArrayXMVECTOR scanline( reinterpret_cast<XMVECTOR*>( _aligned_malloc( (sizeof(XMVECTOR)*width*3), 16 ) ) );
    if ( !scanline )
        return E_OUTOFMEMORY;

    std::unique_ptr<LinearFilter[]> lf( new (std::nothrow) LinearFilter[ width+height ] );
    if ( !lf )
        return E_OUTOFMEMORY;

    LinearFilter* lfX = lf.get();
    LinearFilter* lfY = lf.get() + width;
 
    XMVECTOR* target = scanline.get();

    XMVECTOR* row0 = target + width;
    XMVECTOR* row1 = target + width*2;

    // Resize base image to each target mip level
    for( size_t level=1; level < levels; ++level )
    {
        // 2D linear filter
        const Image* src = mipChain.GetImage( level-1, item, 0 );
        const Image* dest = mipChain.GetImage( level, item, 0 );

        if ( !src || !dest )
            return E_POINTER;

        const uint8_t* pSrc = src->pixels;
        uint8_t* pDest = dest->pixels;

        size_t rowPitch = src->rowPitch;

        size_t nwidth = (width > 1) ? (width >> 1) : 1;
        _CreateLinearFilter( width, nwidth, (filter & TEX_FILTER_WRAP_U) != 0, lfX );

        size_t nheight = (height > 1) ? (height >> 1) : 1;
        _CreateLinearFilter( height, nheight, (filter & TEX_FILTER_WRAP_V) != 0, lfY );

#ifdef _DEBUG
        memset( row0, 0xCD, sizeof(XMVECTOR)*width );
        memset( row1, 0xDD, sizeof(XMVECTOR)*width );
#endif

        size_t u0 = size_t(-1);
        size_t u1 = size_t(-1);

        for( size_t y = 0; y < nheight; ++y )
        {
            auto& toY = lfY[ y ];

            if ( toY.u0 != u0 )
            {
                if ( toY.u0 != u1 )
                {
                    u0 = toY.u0;

                    if ( !_LoadScanlineLinear( row0, width, pSrc + (rowPitch * u0), rowPitch, src->format, filter ) )
                        return E_FAIL;
                }
                else
                {
                    u0 = u1;
                    u1 = size_t(-1);

                    std::swap( row0, row1 );
                }
            }

            if ( toY.u1 != u1 )
            {
                u1 = toY.u1;

                if ( !_LoadScanlineLinear( row1, width, pSrc + (rowPitch * u1), rowPitch, src->format, filter ) )
                    return E_FAIL;
            }

            for( size_t x = 0; x < nwidth; ++x )
            {
                auto& toX = lfX[ x ];

                BILINEAR_INTERPOLATE( target[x], toX, toY, row0, row1 );
            }

            if ( !_StoreScanlineLinear( pDest, dest->rowPitch, dest->format, target, nwidth, filter ) )
                return E_FAIL;
            pDest += dest->rowPitch;
        }

        if ( height > 1 )
            height >>= 1;

        if ( width > 1 )
            width >>= 1;
    }

    return S_OK;
}


//--- 2D Cubic Filter ---
static HRESULT _Generate2DMipsCubicFilter( _In_ size_t levels, _In_ DWORD filter, _In_ const ScratchImage& mipChain, _In_ size_t item )
{
    if ( !mipChain.GetImages() )
        return E_INVALIDARG;

    // This assumes that the base image is already placed into the mipChain at the top level... (see _Setup2DMips)

    assert( levels > 1 );

    size_t width = mipChain.GetMetadata().width;
    size_t height = mipChain.GetMetadata().height;

    // Allocate temporary space (5 scanlines, plus X and Y filters)
    ScopedAlignedArrayXMVECTOR scanline( reinterpret_cast<XMVECTOR*>( _aligned_malloc( (sizeof(XMVECTOR)*width*5), 16 ) ) );
    if ( !scanline )
        return E_OUTOFMEMORY;

    std::unique_ptr<CubicFilter[]> cf( new (std::nothrow) CubicFilter[ width+height ] );
    if ( !cf )
        return E_OUTOFMEMORY;

    CubicFilter* cfX = cf.get();
    CubicFilter* cfY = cf.get() + width;
 
    XMVECTOR* target = scanline.get();

    XMVECTOR* row0 = target + width;
    XMVECTOR* row1 = target + width*2;
    XMVECTOR* row2 = target + width*3;
    XMVECTOR* row3 = target + width*4;

    // Resize base image to each target mip level
    for( size_t level=1; level < levels; ++level )
    {
        // 2D cubic filter
        const Image* src = mipChain.GetImage( level-1, item, 0 );
        const Image* dest = mipChain.GetImage( level, item, 0 );

        if (  !src || !dest )
            return E_POINTER;

        const uint8_t* pSrc = src->pixels;
        uint8_t* pDest = dest->pixels;

        size_t rowPitch = src->rowPitch;

        size_t nwidth = (width > 1) ? (width >> 1) : 1;
        _CreateCubicFilter( width, nwidth, (filter & TEX_FILTER_WRAP_U) != 0, (filter & TEX_FILTER_MIRROR_U) != 0, cfX );

        size_t nheight = (height > 1) ? (height >> 1) : 1;
        _CreateCubicFilter( height, nheight, (filter & TEX_FILTER_WRAP_V) != 0, (filter & TEX_FILTER_MIRROR_V) != 0, cfY );

#ifdef _DEBUG
        memset( row0, 0xCD, sizeof(XMVECTOR)*width );
        memset( row1, 0xDD, sizeof(XMVECTOR)*width );
        memset( row2, 0xED, sizeof(XMVECTOR)*width );
        memset( row3, 0xFD, sizeof(XMVECTOR)*width );
#endif

        size_t u0 = size_t(-1);
        size_t u1 = size_t(-1);
        size_t u2 = size_t(-1);
        size_t u3 = size_t(-1);

        for( size_t y = 0; y < nheight; ++y )
        {
            auto& toY = cfY[ y ];

            // Scanline 1
            if ( toY.u0 != u0 )
            {
                if ( toY.u0 != u1 && toY.u0 != u2 && toY.u0 != u3 )
                {
                    u0 = toY.u0;

                    if ( !_LoadScanlineLinear( row0, width, pSrc + (rowPitch * u0), rowPitch, src->format, filter ) )
                        return E_FAIL;
                }
                else if ( toY.u0 == u1 )
                {
                    u0 = u1;
                    u1 = size_t(-1);

                    std::swap( row0, row1 );
                }
                else if ( toY.u0 == u2 )
                {
                    u0 = u2;
                    u2 = size_t(-1);

                    std::swap( row0, row2 );
                }
                else if ( toY.u0 == u3 )
                {
                    u0 = u3;
                    u3 = size_t(-1);

                    std::swap( row0, row3 );
                }
            }

            // Scanline 2
            if ( toY.u1 != u1 )
            {
                if ( toY.u1 != u2 && toY.u1 != u3 )
                {
                    u1 = toY.u1;

                    if ( !_LoadScanlineLinear( row1, width, pSrc + (rowPitch * u1), rowPitch, src->format, filter ) )
                        return E_FAIL;
                }
                else if ( toY.u1 == u2 )
                {
                    u1 = u2;
                    u2 = size_t(-1);

                    std::swap( row1, row2 );
                }
                else if ( toY.u1 == u3 )
                {
                    u1 = u3;
                    u3 = size_t(-1);

                    std::swap( row1, row3 );
                }
            }

            // Scanline 3
            if ( toY.u2 != u2 )
            {
                if ( toY.u2 != u3 )
                {
                    u2 = toY.u2;

                    if ( !_LoadScanlineLinear( row2, width, pSrc + (rowPitch * u2), rowPitch, src->format, filter ) )
                        return E_FAIL;
                }
                else
                {
                    u2 = u3;
                    u3 = size_t(-1);

                    std::swap( row2, row3 );
                }
            }

            // Scanline 4
            if ( toY.u3 != u3 )
            {
                u3 = toY.u3;

                if ( !_LoadScanlineLinear( row3, width, pSrc + (rowPitch * u3), rowPitch, src->format, filter ) )
                    return E_FAIL;
            }

            for( size_t x = 0; x < nwidth; ++x )
            {
                auto& toX = cfX[ x ];

                XMVECTOR C0, C1, C2, C3;

                CUBIC_INTERPOLATE( C0, toX.x, row0[ toX.u0 ], row0[ toX.u1 ], row0[ toX.u2 ], row0[ toX.u3 ] );
                CUBIC_INTERPOLATE( C1, toX.x, row1[ toX.u0 ], row1[ toX.u1 ], row1[ toX.u2 ], row1[ toX.u3 ] );
                CUBIC_INTERPOLATE( C2, toX.x, row2[ toX.u0 ], row2[ toX.u1 ], row2[ toX.u2 ], row2[ toX.u3 ] );
                CUBIC_INTERPOLATE( C3, toX.x, row3[ toX.u0 ], row3[ toX.u1 ], row3[ toX.u2 ], row3[ toX.u3 ] );

                CUBIC_INTERPOLATE( target[x], toY.x, C0, C1, C2, C3 );
            }

            if ( !_StoreScanlineLinear( pDest, dest->rowPitch, dest->format, target, nwidth, filter ) )
                return E_FAIL;
            pDest += dest->rowPitch;
        }

        if ( height > 1 )
            height >>= 1;

        if ( width > 1 )
            width >>= 1;
    }

    return S_OK;
}


//--- 2D Triangle Filter ---
static HRESULT _Generate2DMipsTriangleFilter( _In_ size_t levels, _In_ DWORD filter, _In_ const ScratchImage& mipChain, _In_ size_t item )
{
    if ( !mipChain.GetImages() )
        return E_INVALIDARG;

    using namespace TriangleFilter;

    // This assumes that the base image is already placed into the mipChain at the top level... (see _Setup2DMips)

    assert( levels > 1 );

    size_t width = mipChain.GetMetadata().width;
    size_t height = mipChain.GetMetadata().height;

    // Allocate initial temporary space (1 scanline, accumulation rows, plus X and Y filters)
    ScopedAlignedArrayXMVECTOR scanline( reinterpret_cast<XMVECTOR*>( _aligned_malloc( sizeof(XMVECTOR) * width, 16 ) ) );
    if ( !scanline )
        return E_OUTOFMEMORY;

    std::unique_ptr<TriangleRow[]> rowActive( new (std::nothrow) TriangleRow[ height ] );
    if ( !rowActive )
        return E_OUTOFMEMORY;

    TriangleRow * rowFree = nullptr;

    std::unique_ptr<Filter> tfX, tfY;

    XMVECTOR* row = scanline.get();

    // Resize base image to each target mip level
    for( size_t level=1; level < levels; ++level )
    {
        // 2D triangle filter
        const Image* src = mipChain.GetImage( level-1, item, 0 );
        const Image* dest = mipChain.GetImage( level, item, 0 );

        if ( !src || !dest )
            return E_POINTER;

        const uint8_t* pSrc = src->pixels;
        size_t rowPitch = src->rowPitch;
        const uint8_t* pEndSrc = pSrc + rowPitch * height;

        uint8_t* pDest = dest->pixels;

        size_t nwidth = (width > 1) ? (width >> 1) : 1;
        HRESULT hr = _Create( width, nwidth, (filter & TEX_FILTER_WRAP_U) != 0, tfX );
        if ( FAILED(hr) )
            return hr;
        
        size_t nheight = (height > 1) ? (height >> 1) : 1;
        hr = _Create( height, nheight, (filter & TEX_FILTER_WRAP_V) != 0, tfY );
        if ( FAILED(hr) )
            return hr;

#ifdef _DEBUG
        memset( row, 0xCD, sizeof(XMVECTOR)*width );
#endif

        auto xFromEnd = reinterpret_cast<const FilterFrom*>( reinterpret_cast<const uint8_t*>( tfX.get() ) + tfX->sizeInBytes );
        auto yFromEnd = reinterpret_cast<const FilterFrom*>( reinterpret_cast<const uint8_t*>( tfY.get() ) + tfY->sizeInBytes );

        // Count times rows get written (and clear out any leftover accumulation rows from last miplevel)
        for( FilterFrom* yFrom = tfY->from; yFrom < yFromEnd; )
        {
            for ( size_t j = 0; j < yFrom->count; ++j )
            {
                size_t v = yFrom->to[ j ].u;
                assert( v < nheight );
                TriangleRow* rowAcc = &rowActive.get()[ v ];

                ++rowAcc->remaining;

                if ( rowAcc->scanline )
                {
                    memset( rowAcc->scanline.get(), 0, sizeof(XMVECTOR) * nwidth );
                }
            }

            yFrom = reinterpret_cast<FilterFrom*>( reinterpret_cast<uint8_t*>( yFrom ) + yFrom->sizeInBytes );
        }

        // Filter image
        for( FilterFrom* yFrom = tfY->from; yFrom < yFromEnd; )
        {
            // Create accumulation rows as needed
            for ( size_t j = 0; j < yFrom->count; ++j )
            {
                size_t v = yFrom->to[ j ].u;
                assert( v < nheight );
                TriangleRow* rowAcc = &rowActive.get()[ v ];

                if ( !rowAcc->scanline )
                {
                    if ( rowFree )
                    {
                        // Steal and reuse scanline from 'free row' list
                        // (it will always be at least as wide as nwidth due to loop decending order)
                        assert( rowFree->scanline != 0 );
                        rowAcc->scanline.reset( rowFree->scanline.release() );
                        rowFree = rowFree->next;
                    }
                    else
                    {
                        rowAcc->scanline.reset( reinterpret_cast<XMVECTOR*>( _aligned_malloc( sizeof(XMVECTOR) * nwidth, 16 ) ) );
                        if ( !rowAcc->scanline )
                            return E_OUTOFMEMORY;
                    }

                    memset( rowAcc->scanline.get(), 0, sizeof(XMVECTOR) * nwidth );
                }
            }

            // Load source scanline
            if ( (pSrc + rowPitch) > pEndSrc )
                return E_FAIL;

            if ( !_LoadScanlineLinear( row, width, pSrc, rowPitch, src->format, filter ) )
                return E_FAIL;

            pSrc += rowPitch;

            // Process row
            size_t x = 0;
            for( FilterFrom* xFrom = tfX->from; xFrom < xFromEnd; ++x )
            {
                for ( size_t j = 0; j < yFrom->count; ++j )
                {
                    size_t v = yFrom->to[ j ].u;
                    assert( v < nheight );
                    float yweight = yFrom->to[ j ].weight;

                    XMVECTOR* accPtr = rowActive[ v ].scanline.get();
                    if ( !accPtr )
                        return E_POINTER;

                    for ( size_t k = 0; k < xFrom->count; ++k )
                    {
                        size_t u = xFrom->to[ k ].u;
                        assert( u < nwidth );

                        XMVECTOR weight = XMVectorReplicate( yweight * xFrom->to[ k ].weight );

                        assert( x < width );
                        accPtr[ u ] = XMVectorMultiplyAdd( row[ x ], weight, accPtr[ u ] );
                    }
                }

                xFrom = reinterpret_cast<FilterFrom*>( reinterpret_cast<uint8_t*>( xFrom ) + xFrom->sizeInBytes );
            }

            // Write completed accumulation rows
            for ( size_t j = 0; j < yFrom->count; ++j )
            {
                size_t v = yFrom->to[ j ].u;
                assert( v < nheight );
                TriangleRow* rowAcc = &rowActive.get()[ v ];

                assert( rowAcc->remaining > 0 );
                --rowAcc->remaining;

                if ( !rowAcc->remaining )
                {
                    XMVECTOR* pAccSrc = rowAcc->scanline.get();
                    if ( !pAccSrc )
                        return E_POINTER;

                    switch( dest->format )
                    {
                    case DXGI_FORMAT_R10G10B10A2_UNORM:
                    case DXGI_FORMAT_R10G10B10A2_UINT:
                        {
                            // Need to slightly bias results for floating-point error accumulation which can
                            // be visible with harshly quantized values
                            static const XMVECTORF32 Bias = { 0.f, 0.f, 0.f, 0.1f };
                       
                            XMVECTOR* ptr = pAccSrc;
                            for( size_t i=0; i < dest->width; ++i, ++ptr )
                            {
                                *ptr = XMVectorAdd( *ptr, Bias );
                            }
                        }
                        break;
                    }

                    // This performs any required clamping
                    if ( !_StoreScanlineLinear( pDest + (dest->rowPitch * v), dest->rowPitch, dest->format, pAccSrc, dest->width, filter ) )
                        return E_FAIL;

                    // Put row on freelist to reuse it's allocated scanline
                    rowAcc->next = rowFree;
                    rowFree = rowAcc;
                }
            }

            yFrom = reinterpret_cast<FilterFrom*>( reinterpret_cast<uint8_t*>( yFrom ) + yFrom->sizeInBytes );
        }

        if ( height > 1 )
            height >>= 1;

        if ( width > 1 )
            width >>= 1;
    }

    return S_OK;
}


//-------------------------------------------------------------------------------------
// Generate volume mip-map helpers
//-------------------------------------------------------------------------------------
static HRESULT _Setup3DMips( _In_reads_(depth) const Image* baseImages, _In_ size_t depth, size_t levels,
                             _Out_ ScratchImage& mipChain )
{
    if ( !baseImages || !depth )
        return E_INVALIDARG;

    assert( levels > 1 );

    size_t width = baseImages[0].width;
    size_t height = baseImages[0].height;

    HRESULT hr = mipChain.Initialize3D( baseImages[0].format, width, height, depth, levels );
    if ( FAILED(hr) )
        return hr;

    // Copy base images to top slice
    for( size_t slice=0; slice < depth; ++slice )
    {
        const Image& src = baseImages[slice];

        const Image *dest = mipChain.GetImage( 0, 0, slice );
        if ( !dest )
        {
            mipChain.Release();
            return E_POINTER;
        }

        assert( src.format == dest->format );

        uint8_t* pDest = dest->pixels;
        if ( !pDest )
        {
            mipChain.Release();
            return E_POINTER;
        }

        const uint8_t *pSrc = src.pixels;
        size_t rowPitch = src.rowPitch;
        for( size_t h=0; h < height; ++h )
        {
            size_t msize = std::min<size_t>( dest->rowPitch, rowPitch );
            memcpy_s( pDest, dest->rowPitch, pSrc, msize );  
            pSrc += rowPitch;
            pDest += dest->rowPitch;
        }
    }

    return S_OK;
}


//--- 3D Point Filter ---
static HRESULT _Generate3DMipsPointFilter( _In_ size_t depth, _In_ size_t levels, _In_ const ScratchImage& mipChain )
{
    if ( !depth || !mipChain.GetImages() )
        return E_INVALIDARG;

    // This assumes that the base images are already placed into the mipChain at the top level... (see _Setup3DMips)

    assert( levels > 1 );

    size_t width = mipChain.GetMetadata().width;
    size_t height = mipChain.GetMetadata().height;

    // Allocate temporary space (2 scanlines)
    ScopedAlignedArrayXMVECTOR scanline( reinterpret_cast<XMVECTOR*>( _aligned_malloc( (sizeof(XMVECTOR)*width*2), 16 ) ) );
    if ( !scanline )
        return E_OUTOFMEMORY;

    XMVECTOR* target = scanline.get();

    XMVECTOR* row = target + width;

    // Resize base image to each target mip level
    for( size_t level=1; level < levels; ++level )
    {
#ifdef _DEBUG
        memset( row, 0xCD, sizeof(XMVECTOR)*width );
#endif

        if ( depth > 1 )
        {
            // 3D point filter
            size_t ndepth = depth >> 1;

            size_t zinc = ( depth << 16 ) / ndepth;

            size_t sz = 0;
            for( size_t slice=0; slice < ndepth; ++slice )
            {
                const Image* src = mipChain.GetImage( level-1, 0, (sz >> 16) );
                const Image* dest = mipChain.GetImage( level, 0, slice );

                if ( !src || !dest )
                    return E_POINTER;

                const uint8_t* pSrc = src->pixels;
                uint8_t* pDest = dest->pixels;

                size_t rowPitch = src->rowPitch;

                size_t nwidth = (width > 1) ? (width >> 1) : 1;
                size_t nheight = (height > 1) ? (height >> 1) : 1;

                size_t xinc = ( width << 16 ) / nwidth;
                size_t yinc = ( height << 16 ) / nheight;

                size_t lasty = size_t(-1);

                size_t sy = 0;
                for( size_t y = 0; y < nheight; ++y )
                {
                    if ( (lasty ^ sy) >> 16 )
                    {
                        if ( !_LoadScanline( row, width, pSrc + ( rowPitch * (sy >> 16) ), rowPitch, src->format ) )
                            return E_FAIL;
                        lasty = sy;
                    }

                    size_t sx = 0;
                    for( size_t x = 0; x < nwidth; ++x )
                    {
                        target[ x ] = row[ sx >> 16 ];
                        sx += xinc;
                    }

                    if ( !_StoreScanline( pDest, dest->rowPitch, dest->format, target, nwidth ) )
                        return E_FAIL;
                    pDest += dest->rowPitch;

                    sy += yinc;
                }

                sz += zinc;
            }
        }
        else
        {
            // 2D point filter
            const Image* src = mipChain.GetImage( level-1, 0, 0 );
            const Image* dest = mipChain.GetImage( level, 0, 0 );

            if ( !src || !dest )
                return E_POINTER;

            const uint8_t* pSrc = src->pixels;
            uint8_t* pDest = dest->pixels;

            size_t rowPitch = src->rowPitch;

            size_t nwidth = (width > 1) ? (width >> 1) : 1;
            size_t nheight = (height > 1) ? (height >> 1) : 1;

            size_t xinc = ( width << 16 ) / nwidth;
            size_t yinc = ( height << 16 ) / nheight;

            size_t lasty = size_t(-1);

            size_t sy = 0;
            for( size_t y = 0; y < nheight; ++y )
            {
                if ( (lasty ^ sy) >> 16 )
                {
                    if ( !_LoadScanline( row, width, pSrc + ( rowPitch * (sy >> 16) ), rowPitch, src->format ) )
                        return E_FAIL;
                    lasty = sy;
                }

                size_t sx = 0;
                for( size_t x = 0; x < nwidth; ++x )
                {
                    target[ x ] = row[ sx >> 16 ];
                    sx += xinc;
                }

                if ( !_StoreScanline( pDest, dest->rowPitch, dest->format, target, nwidth ) )
                    return E_FAIL;
                pDest += dest->rowPitch;

                sy += yinc;
            }
        }

        if ( height > 1 )
            height >>= 1;

        if ( width > 1 )
            width >>= 1;

        if ( depth > 1 )
            depth >>= 1;
    }

    return S_OK;
}


//--- 3D Box Filter ---
static HRESULT _Generate3DMipsBoxFilter( _In_ size_t depth, _In_ size_t levels, _In_ DWORD filter, _In_ const ScratchImage& mipChain )
{
    if ( !depth || !mipChain.GetImages() )
        return E_INVALIDARG;

    // This assumes that the base images are already placed into the mipChain at the top level... (see _Setup3DMips)

    assert( levels > 1 );

    size_t width = mipChain.GetMetadata().width;
    size_t height = mipChain.GetMetadata().height;

    if ( !ispow2(width) || !ispow2(height) || !ispow2(depth) )
        return E_FAIL;

    // Allocate temporary space (5 scanlines)
    ScopedAlignedArrayXMVECTOR scanline( reinterpret_cast<XMVECTOR*>( _aligned_malloc( (sizeof(XMVECTOR)*width*5), 16 ) ) );
    if ( !scanline )
        return E_OUTOFMEMORY;

    XMVECTOR* target = scanline.get();

    XMVECTOR* urow0 = target + width;
    XMVECTOR* urow1 = target + width*2;
    XMVECTOR* vrow0 = target + width*3;
    XMVECTOR* vrow1 = target + width*4;

    const XMVECTOR* urow2 = urow0 + 1;
    const XMVECTOR* urow3 = urow1 + 1;
    const XMVECTOR* vrow2 = vrow0 + 1;
    const XMVECTOR* vrow3 = vrow1 + 1;

    // Resize base image to each target mip level
    for( size_t level=1; level < levels; ++level )
    {
        if ( height <= 1 )
        {
            urow1 = urow0;
            vrow1 = vrow0;
        }

        if ( width <= 1 )
        {
            urow2 = urow0;
            urow3 = urow1;
            vrow2 = vrow0;
            vrow3 = vrow1;
        }

        if ( depth > 1 )
        {
            // 3D box filter
            size_t ndepth = depth >> 1;

            for( size_t slice=0; slice < ndepth; ++slice )
            {
                size_t slicea = std::min<size_t>( slice * 2, depth-1 );
                size_t sliceb = std::min<size_t>( slicea + 1, depth-1 );

                const Image* srca = mipChain.GetImage( level-1, 0, slicea );
                const Image* srcb = mipChain.GetImage( level-1, 0, sliceb );
                const Image* dest = mipChain.GetImage( level, 0, slice );

                if ( !srca || !srcb || !dest )
                    return E_POINTER;

                const uint8_t* pSrc1 = srca->pixels;
                const uint8_t* pSrc2 = srcb->pixels;
                uint8_t* pDest = dest->pixels;

                size_t aRowPitch = srca->rowPitch;
                size_t bRowPitch = srcb->rowPitch;

                size_t nwidth = (width > 1) ? (width >> 1) : 1;
                size_t nheight = (height > 1) ? (height >> 1) : 1;

                for( size_t y = 0; y < nheight; ++y )
                {
                    if ( !_LoadScanlineLinear( urow0, width, pSrc1, aRowPitch, srca->format, filter ) )
                        return E_FAIL;
                    pSrc1 += aRowPitch;

                    if ( urow0 != urow1 )
                    {
                        if ( !_LoadScanlineLinear( urow1, width, pSrc1, aRowPitch, srca->format, filter ) )
                            return E_FAIL;
                        pSrc1 += aRowPitch;
                    }

                    if ( !_LoadScanlineLinear( vrow0, width, pSrc2, bRowPitch, srcb->format, filter ) )
                        return E_FAIL;
                    pSrc2 += bRowPitch;

                    if ( vrow0 != vrow1 )
                    {
                        if ( !_LoadScanlineLinear( vrow1, width, pSrc2, bRowPitch, srcb->format, filter ) )
                            return E_FAIL;
                        pSrc2 += bRowPitch;
                    }

                    for( size_t x = 0; x < nwidth; ++x )
                    {
                        size_t x2 = x << 1;

                        AVERAGE8( target[x], urow0[ x2 ], urow1[ x2 ], urow2[ x2 ], urow3[ x2 ],
                                             vrow0[ x2 ], vrow1[ x2 ], vrow2[ x2 ], vrow3[ x2 ] );
                    }

                    if ( !_StoreScanlineLinear( pDest, dest->rowPitch, dest->format, target, nwidth, filter ) )
                        return E_FAIL;
                    pDest += dest->rowPitch;
                }
            }
        }
        else
        {
            // 2D box filter
            const Image* src = mipChain.GetImage( level-1, 0, 0 );
            const Image* dest = mipChain.GetImage( level, 0, 0 );

            if ( !src || !dest )
                return E_POINTER;

            const uint8_t* pSrc = src->pixels;
            uint8_t* pDest = dest->pixels;

            size_t rowPitch = src->rowPitch;

            size_t nwidth = (width > 1) ? (width >> 1) : 1;
            size_t nheight = (height > 1) ? (height >> 1) : 1;

            for( size_t y = 0; y < nheight; ++y )
            {
                if ( !_LoadScanlineLinear( urow0, width, pSrc, rowPitch, src->format, filter ) )
                    return E_FAIL;
                pSrc += rowPitch;

                if ( urow0 != urow1 )
                {
                    if ( !_LoadScanlineLinear( urow1, width, pSrc, rowPitch, src->format, filter ) )
                        return E_FAIL;
                    pSrc += rowPitch;
                }

                for( size_t x = 0; x < nwidth; ++x )
                {
                    size_t x2 = x << 1;

                    AVERAGE4( target[ x ], urow0[ x2 ], urow1[ x2 ], urow2[ x2 ], urow3[ x2 ] );
                }

                if ( !_StoreScanlineLinear( pDest, dest->rowPitch, dest->format, target, nwidth, filter ) )
                    return E_FAIL;
                pDest += dest->rowPitch;
            }
        }

        if ( height > 1 )
            height >>= 1;

        if ( width > 1 )
            width >>= 1;

        if ( depth > 1 )
            depth >>= 1;
    }

    return S_OK;
}


//--- 3D Linear Filter ---
static HRESULT _Generate3DMipsLinearFilter( _In_ size_t depth, _In_ size_t levels, _In_ DWORD filter, _In_ const ScratchImage& mipChain )
{
    if ( !depth || !mipChain.GetImages() )
        return E_INVALIDARG;

    // This assumes that the base images are already placed into the mipChain at the top level... (see _Setup3DMips)

    assert( levels > 1 );

    size_t width = mipChain.GetMetadata().width;
    size_t height = mipChain.GetMetadata().height;

    // Allocate temporary space (5 scanlines, plus X/Y/Z filters)
    ScopedAlignedArrayXMVECTOR scanline( reinterpret_cast<XMVECTOR*>( _aligned_malloc( (sizeof(XMVECTOR)*width*5), 16 ) ) );
    if ( !scanline )
        return E_OUTOFMEMORY;

    std::unique_ptr<LinearFilter[]> lf( new (std::nothrow) LinearFilter[ width+height+depth ] );
    if ( !lf )
        return E_OUTOFMEMORY;

    LinearFilter* lfX = lf.get();
    LinearFilter* lfY = lf.get() + width;
    LinearFilter* lfZ = lf.get() + width + height;

    XMVECTOR* target = scanline.get();

    XMVECTOR* urow0 = target + width;
    XMVECTOR* urow1 = target + width*2;
    XMVECTOR* vrow0 = target + width*3;
    XMVECTOR* vrow1 = target + width*4;

    // Resize base image to each target mip level
    for( size_t level=1; level < levels; ++level )
    {
        size_t nwidth = (width > 1) ? (width >> 1) : 1;
        _CreateLinearFilter( width, nwidth, (filter & TEX_FILTER_WRAP_U) != 0, lfX );

        size_t nheight = (height > 1) ? (height >> 1) : 1;
        _CreateLinearFilter( height, nheight, (filter & TEX_FILTER_WRAP_V) != 0, lfY );

#ifdef _DEBUG
        memset( urow0, 0xCD, sizeof(XMVECTOR)*width );
        memset( urow1, 0xDD, sizeof(XMVECTOR)*width );
        memset( vrow0, 0xED, sizeof(XMVECTOR)*width );
        memset( vrow1, 0xFD, sizeof(XMVECTOR)*width );
#endif

        if ( depth > 1 )
        {
            // 3D linear filter
            size_t ndepth = depth >> 1;
            _CreateLinearFilter( depth, ndepth, (filter & TEX_FILTER_WRAP_W) != 0, lfZ );

            for( size_t slice=0; slice < ndepth; ++slice )
            {
                auto& toZ = lfZ[ slice ];

                const Image* srca = mipChain.GetImage( level-1, 0, toZ.u0 );
                const Image* srcb = mipChain.GetImage( level-1, 0, toZ.u1 );
                if ( !srca || !srcb )
                    return E_POINTER;

                size_t u0 = size_t(-1);
                size_t u1 = size_t(-1);

                const Image* dest = mipChain.GetImage( level, 0, slice );
                if ( !dest )
                    return E_POINTER;

                uint8_t* pDest = dest->pixels;

                for( size_t y = 0; y < nheight; ++y )
                {
                    auto& toY = lfY[ y ];

                    if ( toY.u0 != u0 )
                    {
                        if ( toY.u0 != u1 )
                        {
                            u0 = toY.u0;

                            if ( !_LoadScanlineLinear( urow0, width, srca->pixels + (srca->rowPitch * u0), srca->rowPitch, srca->format, filter )
                                 || !_LoadScanlineLinear( vrow0, width, srcb->pixels + (srcb->rowPitch * u0), srcb->rowPitch, srcb->format, filter ) )
                                return E_FAIL;
                        }
                        else
                        {
                            u0 = u1;
                            u1 = size_t(-1);

                            std::swap( urow0, urow1 );
                            std::swap( vrow0, vrow1 );
                        }
                    }

                    if ( toY.u1 != u1 )
                    {
                        u1 = toY.u1;

                        if ( !_LoadScanlineLinear( urow1, width, srca->pixels + (srca->rowPitch * u1), srca->rowPitch, srca->format, filter )
                                || !_LoadScanlineLinear( vrow1, width, srcb->pixels + (srcb->rowPitch * u1), srcb->rowPitch, srcb->format, filter ) )
                            return E_FAIL;
                    }

                    for( size_t x = 0; x < nwidth; ++x )
                    {
                        auto& toX = lfX[ x ];

                        TRILINEAR_INTERPOLATE( target[x], toX, toY, toZ, urow0, urow1, vrow0, vrow1 );
                    }

                    if ( !_StoreScanlineLinear( pDest, dest->rowPitch, dest->format, target, nwidth, filter ) )
                        return E_FAIL;
                    pDest += dest->rowPitch;
                }
            }
        }
        else
        {
            // 2D linear filter
            const Image* src = mipChain.GetImage( level-1, 0, 0 );
            const Image* dest = mipChain.GetImage( level, 0, 0 );

            if ( !src || !dest )
                return E_POINTER;

            const uint8_t* pSrc = src->pixels;
            uint8_t* pDest = dest->pixels;

            size_t rowPitch = src->rowPitch;

            size_t u0 = size_t(-1);
            size_t u1 = size_t(-1);

            for( size_t y = 0; y < nheight; ++y )
            {
                auto& toY = lfY[ y ];

                if ( toY.u0 != u0 )
                {
                    if ( toY.u0 != u1 )
                    {
                        u0 = toY.u0;

                        if ( !_LoadScanlineLinear( urow0, width, pSrc + (rowPitch * u0), rowPitch, src->format, filter ) )
                            return E_FAIL;
                    }
                    else
                    {
                        u0 = u1;
                        u1 = size_t(-1);

                        std::swap( urow0, urow1 );
                    }
                }

                if ( toY.u1 != u1 )
                {
                    u1 = toY.u1;

                    if ( !_LoadScanlineLinear( urow1, width, pSrc + (rowPitch * u1), rowPitch, src->format, filter ) )
                        return E_FAIL;
                }

                for( size_t x = 0; x < nwidth; ++x )
                {
                    auto& toX = lfX[ x ];

                    BILINEAR_INTERPOLATE( target[x], toX, toY, urow0, urow1 );
                }

                if ( !_StoreScanlineLinear( pDest, dest->rowPitch, dest->format, target, nwidth, filter ) )
                    return E_FAIL;
                pDest += dest->rowPitch;
            }
        }

        if ( height > 1 )
            height >>= 1;

        if ( width > 1 )
            width >>= 1;

        if ( depth > 1 )
            depth >>= 1;
    }

    return S_OK;
}


//--- 3D Cubic Filter ---
static HRESULT _Generate3DMipsCubicFilter( _In_ size_t depth, _In_ size_t levels, _In_ DWORD filter, _In_ const ScratchImage& mipChain )
{
    if ( !depth || !mipChain.GetImages() )
        return E_INVALIDARG;

    // This assumes that the base images are already placed into the mipChain at the top level... (see _Setup3DMips)

    assert( levels > 1 );

    size_t width = mipChain.GetMetadata().width;
    size_t height = mipChain.GetMetadata().height;

    // Allocate temporary space (17 scanlines, plus X/Y/Z filters)
    ScopedAlignedArrayXMVECTOR scanline( reinterpret_cast<XMVECTOR*>( _aligned_malloc( (sizeof(XMVECTOR)*width*17), 16 ) ) );
    if ( !scanline )
        return E_OUTOFMEMORY;

    std::unique_ptr<CubicFilter[]> cf( new (std::nothrow) CubicFilter[ width+height+depth ] );
    if ( !cf )
        return E_OUTOFMEMORY;

    CubicFilter* cfX = cf.get();
    CubicFilter* cfY = cf.get() + width;
    CubicFilter* cfZ = cf.get() + width + height;

    XMVECTOR* target = scanline.get();

    XMVECTOR* urow[4];
    XMVECTOR* vrow[4];
    XMVECTOR* srow[4];
    XMVECTOR* trow[4];

    XMVECTOR *ptr = scanline.get() + width;
    for( size_t j = 0; j < 4; ++j )
    {
        urow[j] = ptr;  ptr += width;
        vrow[j] = ptr;  ptr += width;
        srow[j] = ptr;  ptr += width;
        trow[j] = ptr;  ptr += width;
    }

    // Resize base image to each target mip level
    for( size_t level=1; level < levels; ++level )
    {
        size_t nwidth = (width > 1) ? (width >> 1) : 1;
        _CreateCubicFilter( width, nwidth, (filter & TEX_FILTER_WRAP_U) != 0, (filter & TEX_FILTER_MIRROR_U) != 0, cfX );

        size_t nheight = (height > 1) ? (height >> 1) : 1;
        _CreateCubicFilter( height, nheight, (filter & TEX_FILTER_WRAP_V) != 0, (filter & TEX_FILTER_MIRROR_V) != 0, cfY );

#ifdef _DEBUG
        for( size_t j = 0; j < 4; ++j )
        {
            memset( urow[j], 0xCD, sizeof(XMVECTOR)*width );
            memset( vrow[j], 0xDD, sizeof(XMVECTOR)*width );
            memset( srow[j], 0xED, sizeof(XMVECTOR)*width );
            memset( trow[j], 0xFD, sizeof(XMVECTOR)*width );
        }
#endif

        if ( depth > 1 )
        {
            // 3D cubic filter
            size_t ndepth = depth >> 1;
            _CreateCubicFilter( depth, ndepth, (filter & TEX_FILTER_WRAP_W) != 0, (filter & TEX_FILTER_MIRROR_W) != 0, cfZ );

            for( size_t slice=0; slice < ndepth; ++slice )
            {
                auto& toZ = cfZ[ slice ];

                const Image* srca = mipChain.GetImage( level-1, 0, toZ.u0 );
                const Image* srcb = mipChain.GetImage( level-1, 0, toZ.u1 );
                const Image* srcc = mipChain.GetImage( level-1, 0, toZ.u2 );
                const Image* srcd = mipChain.GetImage( level-1, 0, toZ.u3 );
                if ( !srca || !srcb || !srcc || !srcd )
                    return E_POINTER;

                size_t u0 = size_t(-1);
                size_t u1 = size_t(-1);
                size_t u2 = size_t(-1);
                size_t u3 = size_t(-1);

                const Image* dest = mipChain.GetImage( level, 0, slice );
                if ( !dest )
                    return E_POINTER;

                uint8_t* pDest = dest->pixels;

                for( size_t y = 0; y < nheight; ++y )
                {
                    auto& toY = cfY[ y ];

                    // Scanline 1
                    if ( toY.u0 != u0 )
                    {
                        if ( toY.u0 != u1 && toY.u0 != u2 && toY.u0 != u3 )
                        {
                            u0 = toY.u0;

                            if ( !_LoadScanlineLinear( urow[0], width, srca->pixels + (srca->rowPitch * u0), srca->rowPitch, srca->format, filter )
                                    || !_LoadScanlineLinear( urow[1], width, srcb->pixels + (srcb->rowPitch * u0), srcb->rowPitch, srcb->format, filter )
                                    || !_LoadScanlineLinear( urow[2], width, srcc->pixels + (srcc->rowPitch * u0), srcc->rowPitch, srcc->format, filter )
                                    || !_LoadScanlineLinear( urow[3], width, srcd->pixels + (srcd->rowPitch * u0), srcd->rowPitch, srcd->format, filter ) )
                                return E_FAIL;
                        }
                        else if ( toY.u0 == u1 )
                        {
                            u0 = u1;
                            u1 = size_t(-1);

                            std::swap( urow[0], vrow[0] );
                            std::swap( urow[1], vrow[1] );
                            std::swap( urow[2], vrow[2] );
                            std::swap( urow[3], vrow[3] );
                        }
                        else if ( toY.u0 == u2 )
                        {
                            u0 = u2;
                            u2 = size_t(-1);

                            std::swap( urow[0], srow[0] );
                            std::swap( urow[1], srow[1] );
                            std::swap( urow[2], srow[2] );
                            std::swap( urow[3], srow[3] );
                        }
                        else if ( toY.u0 == u3 )
                        {
                            u0 = u3;
                            u3 = size_t(-1);

                            std::swap( urow[0], trow[0] );
                            std::swap( urow[1], trow[1] );
                            std::swap( urow[2], trow[2] );
                            std::swap( urow[3], trow[3] );
                        }
                    }

                    // Scanline 2
                    if ( toY.u1 != u1 )
                    {
                        if ( toY.u1 != u2 && toY.u1 != u3 )
                        {
                            u1 = toY.u1;

                            if ( !_LoadScanlineLinear( vrow[0], width, srca->pixels + (srca->rowPitch * u1), srca->rowPitch, srca->format, filter )
                                    || !_LoadScanlineLinear( vrow[1], width, srcb->pixels + (srcb->rowPitch * u1), srcb->rowPitch, srcb->format, filter )
                                    || !_LoadScanlineLinear( vrow[2], width, srcc->pixels + (srcc->rowPitch * u1), srcc->rowPitch, srcc->format, filter )
                                    || !_LoadScanlineLinear( vrow[3], width, srcd->pixels + (srcd->rowPitch * u1), srcd->rowPitch, srcd->format, filter ) )
                                return E_FAIL;
                        }
                        else if ( toY.u1 == u2 )
                        {
                            u1 = u2;
                            u2 = size_t(-1);

                            std::swap( vrow[0], srow[0] );
                            std::swap( vrow[1], srow[1] );
                            std::swap( vrow[2], srow[2] );
                            std::swap( vrow[3], srow[3] );
                        }
                        else if ( toY.u1 == u3 )
                        {
                            u1 = u3;
                            u3 = size_t(-1);

                            std::swap( vrow[0], trow[0] );
                            std::swap( vrow[1], trow[1] );
                            std::swap( vrow[2], trow[2] );
                            std::swap( vrow[3], trow[3] );
                        }
                    }

                    // Scanline 3
                    if ( toY.u2 != u2 )
                    {
                        if ( toY.u2 != u3 )
                        {
                            u2 = toY.u2;

                            if ( !_LoadScanlineLinear( srow[0], width, srca->pixels + (srca->rowPitch * u2), srca->rowPitch, srca->format, filter )
                                    || !_LoadScanlineLinear( srow[1], width, srcb->pixels + (srcb->rowPitch * u2), srcb->rowPitch, srcb->format, filter )
                                    || !_LoadScanlineLinear( srow[2], width, srcc->pixels + (srcc->rowPitch * u2), srcc->rowPitch, srcc->format, filter )
                                    || !_LoadScanlineLinear( srow[3], width, srcd->pixels + (srcd->rowPitch * u2), srcd->rowPitch, srcd->format, filter ) )
                                return E_FAIL;
                        }
                        else
                        {
                            u2 = u3;
                            u3 = size_t(-1);

                            std::swap( srow[0], trow[0] );
                            std::swap( srow[1], trow[1] );
                            std::swap( srow[2], trow[2] );
                            std::swap( srow[3], trow[3] );
                        }
                    }

                    // Scanline 4
                    if ( toY.u3 != u3 )
                    {
                        u3 = toY.u3;

                        if ( !_LoadScanlineLinear( trow[0], width, srca->pixels + (srca->rowPitch * u3), srca->rowPitch, srca->format, filter )
                                || !_LoadScanlineLinear( trow[1], width, srcb->pixels + (srcb->rowPitch * u3), srcb->rowPitch, srcb->format, filter )
                                || !_LoadScanlineLinear( trow[2], width, srcc->pixels + (srcc->rowPitch * u3), srcc->rowPitch, srcc->format, filter )
                                || !_LoadScanlineLinear( trow[3], width, srcd->pixels + (srcd->rowPitch * u3), srcd->rowPitch, srcd->format, filter ) )
                            return E_FAIL;
                    }

                    for( size_t x = 0; x < nwidth; ++x )
                    {
                        auto& toX = cfX[ x ];

                        XMVECTOR D[4];

                        for( size_t j=0; j < 4; ++j )
                        {
                            XMVECTOR C0, C1, C2, C3;
                            CUBIC_INTERPOLATE( C0, toX.x, urow[j][ toX.u0 ], urow[j][ toX.u1 ], urow[j][ toX.u2 ], urow[j][ toX.u3 ] );
                            CUBIC_INTERPOLATE( C1, toX.x, vrow[j][ toX.u0 ], vrow[j][ toX.u1 ], vrow[j][ toX.u2 ], vrow[j][ toX.u3 ] );
                            CUBIC_INTERPOLATE( C2, toX.x, srow[j][ toX.u0 ], srow[j][ toX.u1 ], srow[j][ toX.u2 ], srow[j][ toX.u3 ] );
                            CUBIC_INTERPOLATE( C3, toX.x, trow[j][ toX.u0 ], trow[j][ toX.u1 ], trow[j][ toX.u2 ], trow[j][ toX.u3 ] );

                            CUBIC_INTERPOLATE( D[j], toY.x, C0, C1, C2, C3 );
                        }

                        CUBIC_INTERPOLATE( target[x], toZ.x, D[0], D[1], D[2], D[3] );
                    }

                    if ( !_StoreScanlineLinear( pDest, dest->rowPitch, dest->format, target, nwidth, filter ) )
                        return E_FAIL;
                    pDest += dest->rowPitch;
                }
            }
        }
        else
        {
            // 2D cubic filter
            const Image* src = mipChain.GetImage( level-1, 0, 0 );
            const Image* dest = mipChain.GetImage( level, 0, 0 );

            if ( !src || !dest )
                return E_POINTER;

            const uint8_t* pSrc = src->pixels;
            uint8_t* pDest = dest->pixels;

            size_t rowPitch = src->rowPitch;

            size_t u0 = size_t(-1);
            size_t u1 = size_t(-1);
            size_t u2 = size_t(-1);
            size_t u3 = size_t(-1);

            for( size_t y = 0; y < nheight; ++y )
            {
                auto& toY = cfY[ y ];

                // Scanline 1
                if ( toY.u0 != u0 )
                {
                    if ( toY.u0 != u1 && toY.u0 != u2 && toY.u0 != u3 )
                    {
                        u0 = toY.u0;

                        if ( !_LoadScanlineLinear( urow[0], width, pSrc + (rowPitch * u0), rowPitch, src->format, filter ) )
                            return E_FAIL;
                    }
                    else if ( toY.u0 == u1 )
                    {
                        u0 = u1;
                        u1 = size_t(-1);

                        std::swap( urow[0], vrow[0] );
                    }
                    else if ( toY.u0 == u2 )
                    {
                        u0 = u2;
                        u2 = size_t(-1);

                        std::swap( urow[0], srow[0] );
                    }
                    else if ( toY.u0 == u3 )
                    {
                        u0 = u3;
                        u3 = size_t(-1);

                        std::swap( urow[0], trow[0] );
                    }
                }

                // Scanline 2
                if ( toY.u1 != u1 )
                {
                    if ( toY.u1 != u2 && toY.u1 != u3 )
                    {
                        u1 = toY.u1;

                        if ( !_LoadScanlineLinear( vrow[0], width, pSrc + (rowPitch * u1), rowPitch, src->format, filter ) )
                            return E_FAIL;
                    }
                    else if ( toY.u1 == u2 )
                    {
                        u1 = u2;
                        u2 = size_t(-1);

                        std::swap( vrow[0], srow[0] );
                    }
                    else if ( toY.u1 == u3 )
                    {
                        u1 = u3;
                        u3 = size_t(-1);

                        std::swap( vrow[0], trow[0] );
                    }
                }

                // Scanline 3
                if ( toY.u2 != u2 )
                {
                    if ( toY.u2 != u3 )
                    {
                        u2 = toY.u2;

                        if ( !_LoadScanlineLinear( srow[0], width, pSrc + (rowPitch * u2), rowPitch, src->format, filter ) )
                            return E_FAIL;
                    }
                    else
                    {
                        u2 = u3;
                        u3 = size_t(-1);

                        std::swap( srow[0], trow[0] );
                    }
                }

                // Scanline 4
                if ( toY.u3 != u3 )
                {
                    u3 = toY.u3;

                    if ( !_LoadScanlineLinear( trow[0], width, pSrc + (rowPitch * u3), rowPitch, src->format, filter ) )
                        return E_FAIL;
                }

                for( size_t x = 0; x < nwidth; ++x )
                {
                    auto& toX = cfX[ x ];

                    XMVECTOR C0, C1, C2, C3;
                    CUBIC_INTERPOLATE( C0, toX.x, urow[0][ toX.u0 ], urow[0][ toX.u1 ], urow[0][ toX.u2 ], urow[0][ toX.u3 ] );
                    CUBIC_INTERPOLATE( C1, toX.x, vrow[0][ toX.u0 ], vrow[0][ toX.u1 ], vrow[0][ toX.u2 ], vrow[0][ toX.u3 ] );
                    CUBIC_INTERPOLATE( C2, toX.x, srow[0][ toX.u0 ], srow[0][ toX.u1 ], srow[0][ toX.u2 ], srow[0][ toX.u3 ] );
                    CUBIC_INTERPOLATE( C3, toX.x, trow[0][ toX.u0 ], trow[0][ toX.u1 ], trow[0][ toX.u2 ], trow[0][ toX.u3 ] );

                    CUBIC_INTERPOLATE( target[x], toY.x, C0, C1, C2, C3 );
                }

                if ( !_StoreScanlineLinear( pDest, dest->rowPitch, dest->format, target, nwidth, filter ) )
                    return E_FAIL;
                pDest += dest->rowPitch;
            }
        }

        if ( height > 1 )
            height >>= 1;

        if ( width > 1 )
            width >>= 1;

        if ( depth > 1 )
            depth >>= 1;
    }

    return S_OK;
}


//--- 3D Triangle Filter ---
static HRESULT _Generate3DMipsTriangleFilter( _In_ size_t depth, _In_ size_t levels, _In_ DWORD filter, _In_ const ScratchImage& mipChain )
{
    if ( !depth || !mipChain.GetImages() )
        return E_INVALIDARG;

    using namespace TriangleFilter;

    // This assumes that the base images are already placed into the mipChain at the top level... (see _Setup3DMips)

    assert( levels > 1 );

    size_t width = mipChain.GetMetadata().width;
    size_t height = mipChain.GetMetadata().height;

    // Allocate initial temporary space (1 scanline, accumulation rows, plus X/Y/Z filters)
    ScopedAlignedArrayXMVECTOR scanline( reinterpret_cast<XMVECTOR*>( _aligned_malloc( sizeof(XMVECTOR) * width, 16 ) ) );
    if ( !scanline )
        return E_OUTOFMEMORY;

    std::unique_ptr<TriangleRow[]> sliceActive( new (std::nothrow) TriangleRow[ depth ] );
    if ( !sliceActive )
        return E_OUTOFMEMORY;

    TriangleRow * sliceFree = nullptr;

    std::unique_ptr<Filter> tfX, tfY, tfZ;

    XMVECTOR* row = scanline.get();

    // Resize base image to each target mip level
    for( size_t level=1; level < levels; ++level )
    {
        size_t nwidth = (width > 1) ? (width >> 1) : 1;
        HRESULT hr = _Create( width, nwidth, (filter & TEX_FILTER_WRAP_U) != 0, tfX );
        if ( FAILED(hr) )
            return hr;

        size_t nheight = (height > 1) ? (height >> 1) : 1;
        hr = _Create( height, nheight, (filter & TEX_FILTER_WRAP_V) != 0, tfY );
        if ( FAILED(hr) )
            return hr;

        size_t ndepth = (depth > 1 ) ? (depth >> 1) : 1;
        hr = _Create( depth, ndepth, (filter & TEX_FILTER_WRAP_W) != 0, tfZ );
        if ( FAILED(hr) )
            return hr;

#ifdef _DEBUG
        memset( row, 0xCD, sizeof(XMVECTOR)*width );
#endif

        auto xFromEnd = reinterpret_cast<const FilterFrom*>( reinterpret_cast<const uint8_t*>( tfX.get() ) + tfX->sizeInBytes );
        auto yFromEnd = reinterpret_cast<const FilterFrom*>( reinterpret_cast<const uint8_t*>( tfY.get() ) + tfY->sizeInBytes );
        auto zFromEnd = reinterpret_cast<const FilterFrom*>( reinterpret_cast<const uint8_t*>( tfZ.get() ) + tfZ->sizeInBytes );

        // Count times slices get written (and clear out any leftover accumulation slices from last miplevel)
        for( FilterFrom* zFrom = tfZ->from; zFrom < zFromEnd; )
        {
            for ( size_t j = 0; j < zFrom->count; ++j )
            {
                size_t w = zFrom->to[ j ].u;
                assert( w < ndepth );
                TriangleRow* sliceAcc = &sliceActive.get()[ w ];

                ++sliceAcc->remaining;

                if ( sliceAcc->scanline )
                {
                    memset( sliceAcc->scanline.get(), 0, sizeof(XMVECTOR) * nwidth * nheight );
                }
            }

            zFrom = reinterpret_cast<FilterFrom*>( reinterpret_cast<uint8_t*>( zFrom ) + zFrom->sizeInBytes );
        }

        // Filter image
        size_t z = 0;
        for( FilterFrom* zFrom = tfZ->from; zFrom < zFromEnd; ++z )
        {
            // Create accumulation slices as needed
            for ( size_t j = 0; j < zFrom->count; ++j )
            {
                size_t w = zFrom->to[ j ].u;
                assert( w < ndepth );
                TriangleRow* sliceAcc = &sliceActive.get()[ w ];

                if ( !sliceAcc->scanline )
                {
                    if ( sliceFree )
                    {
                        // Steal and reuse scanline from 'free slice' list
                        // (it will always be at least as large as nwidth*nheight due to loop decending order)
                        assert( sliceFree->scanline != 0 );
                        sliceAcc->scanline.reset( sliceFree->scanline.release() );
                        sliceFree = sliceFree->next;
                    }
                    else
                    {
                        size_t bytes = sizeof(XMVECTOR) * nwidth * nheight;
                        sliceAcc->scanline.reset( reinterpret_cast<XMVECTOR*>( _aligned_malloc( bytes, 16 ) ) );
                        if ( !sliceAcc->scanline )
                            return E_OUTOFMEMORY;
                    }

                    memset( sliceAcc->scanline.get(), 0, sizeof(XMVECTOR) * nwidth * nheight );
                }
            }

            assert( z < depth );
            const Image* src = mipChain.GetImage( level-1, 0, z );
            if ( !src )
                return E_POINTER;

            const uint8_t* pSrc = src->pixels;
            size_t rowPitch = src->rowPitch;
            const uint8_t* pEndSrc = pSrc + rowPitch * height;

            for( FilterFrom* yFrom = tfY->from; yFrom < yFromEnd; )
            {
                // Load source scanline
                if ( (pSrc + rowPitch) > pEndSrc )
                    return E_FAIL;

                if ( !_LoadScanlineLinear( row, width, pSrc, rowPitch, src->format, filter ) )
                    return E_FAIL;

                pSrc += rowPitch;

                // Process row
                size_t x = 0;
                for( FilterFrom* xFrom = tfX->from; xFrom < xFromEnd; ++x )
                {
                    for ( size_t j = 0; j < zFrom->count; ++j )
                    {
                        size_t w = zFrom->to[ j ].u;
                        assert( w < ndepth );
                        float zweight = zFrom->to[ j ].weight;

                        XMVECTOR* accSlice = sliceActive[ w ].scanline.get();
                        if ( !accSlice )
                            return E_POINTER;

                        for ( size_t k = 0; k < yFrom->count; ++k )
                        {
                            size_t v = yFrom->to[ k ].u;
                            assert( v < nheight );
                            float yweight = yFrom->to[ k ].weight;

                            XMVECTOR * accPtr = accSlice + v * nwidth;

                            for ( size_t l = 0; l < xFrom->count; ++l )
                            {
                                size_t u = xFrom->to[ l ].u;
                                assert( u < nwidth );

                                XMVECTOR weight = XMVectorReplicate( zweight * yweight * xFrom->to[ l ].weight );

                                assert( x < width );
                                accPtr[ u ] = XMVectorMultiplyAdd( row[ x ], weight, accPtr[ u ] );
                            }
                        }
                    }

                    xFrom = reinterpret_cast<FilterFrom*>( reinterpret_cast<uint8_t*>( xFrom ) + xFrom->sizeInBytes );
                }

                yFrom = reinterpret_cast<FilterFrom*>( reinterpret_cast<uint8_t*>( yFrom ) + yFrom->sizeInBytes );
            }

            // Write completed accumulation slices
            for ( size_t j = 0; j < zFrom->count; ++j )
            {
                size_t w = zFrom->to[ j ].u;
                assert( w < ndepth );
                TriangleRow* sliceAcc = &sliceActive.get()[ w ];

                assert( sliceAcc->remaining > 0 );
                --sliceAcc->remaining;

                if ( !sliceAcc->remaining )
                {
                    const Image* dest = mipChain.GetImage( level, 0, w );
                    XMVECTOR* pAccSrc = sliceAcc->scanline.get();
                    if ( !dest || !pAccSrc )
                        return E_POINTER;

                    uint8_t* pDest = dest->pixels;

                    for( size_t h = 0; h < nheight; ++h )
                    {
                        switch( dest->format )
                        {
                        case DXGI_FORMAT_R10G10B10A2_UNORM:
                        case DXGI_FORMAT_R10G10B10A2_UINT:
                            {
                                // Need to slightly bias results for floating-point error accumulation which can
                                // be visible with harshly quantized values
                                static const XMVECTORF32 Bias = { 0.f, 0.f, 0.f, 0.1f };
                       
                                XMVECTOR* ptr = pAccSrc;
                                for( size_t i=0; i < dest->width; ++i, ++ptr )
                                {
                                    *ptr = XMVectorAdd( *ptr, Bias );
                                }
                            }
                            break;
                        }

                        // This performs any required clamping
                        if ( !_StoreScanlineLinear( pDest, dest->rowPitch, dest->format, pAccSrc, dest->width, filter ) )
                            return E_FAIL;

                        pDest += dest->rowPitch;
                        pAccSrc += nwidth;
                    }

                    // Put slice on freelist to reuse it's allocated scanline
                    sliceAcc->next = sliceFree;
                    sliceFree = sliceAcc;
                }
            }

            zFrom = reinterpret_cast<FilterFrom*>( reinterpret_cast<uint8_t*>( zFrom ) + zFrom->sizeInBytes );
        }

        if ( height > 1 )
            height >>= 1;

        if ( width > 1 )
            width >>= 1;

        if ( depth > 1 )
            depth >>= 1;
    }

    return S_OK;
}


//=====================================================================================
// Entry-points
//=====================================================================================

//-------------------------------------------------------------------------------------
// Generate mipmap chain
//-------------------------------------------------------------------------------------
_Use_decl_annotations_
HRESULT GenerateMipMaps( const Image& baseImage, DWORD filter, size_t levels, ScratchImage& mipChain, bool allow1D )
{
    if ( !IsValid( baseImage.format ) )
        return E_INVALIDARG;

    if ( !baseImage.pixels )
        return E_POINTER;

    if ( !_CalculateMipLevels(baseImage.width, baseImage.height, levels) )
        return E_INVALIDARG;

    if ( IsCompressed(baseImage.format) || IsTypeless(baseImage.format) || IsPlanar(baseImage.format) || IsPalettized(baseImage.format) )
    {
        return HRESULT_FROM_WIN32( ERROR_NOT_SUPPORTED );
    }

    HRESULT hr;

    static_assert( TEX_FILTER_POINT == 0x100000, "TEX_FILTER_ flag values don't match TEX_FILTER_MASK" );

    if ( _UseWICFiltering( baseImage.format, filter ) )
    {
        //--- Use WIC filtering to generate mipmaps -----------------------------------
        switch(filter & TEX_FILTER_MASK)
        {
            case 0:
            case TEX_FILTER_POINT:
            case TEX_FILTER_FANT: // Equivalent to Box filter
            case TEX_FILTER_LINEAR:
            case TEX_FILTER_CUBIC:
                {
                    static_assert( TEX_FILTER_FANT == TEX_FILTER_BOX, "TEX_FILTER_ flag alias mismatch" );

                    WICPixelFormatGUID pfGUID;
                    if ( _DXGIToWIC( baseImage.format, pfGUID, true ) )
                    {
                        // Case 1: Base image format is supported by Windows Imaging Component
                        hr = (baseImage.height > 1 || !allow1D)
                             ? mipChain.Initialize2D( baseImage.format, baseImage.width, baseImage.height, 1, levels )
                             : mipChain.Initialize1D( baseImage.format, baseImage.width, 1, levels ); 
                        if ( FAILED(hr) )
                            return hr;

                        return _GenerateMipMapsUsingWIC( baseImage, filter, levels, pfGUID, mipChain, 0 );
                    }
                    else
                    {
                        // Case 2: Base image format is not supported by WIC, so we have to convert, generate, and convert back
                        assert( baseImage.format != DXGI_FORMAT_R32G32B32A32_FLOAT );
                        ScratchImage temp;
                        hr = _ConvertToR32G32B32A32( baseImage, temp );
                        if ( FAILED(hr) )
                            return hr;

                        const Image *timg = temp.GetImage( 0, 0, 0 );
                        if ( !timg )
                            return E_POINTER;

                        ScratchImage tMipChain;
                        hr = _GenerateMipMapsUsingWIC( *timg, filter, levels, GUID_WICPixelFormat128bppRGBAFloat, tMipChain, 0 );
                        if ( FAILED(hr) )
                            return hr;

                        temp.Release();

                        return _ConvertFromR32G32B32A32( tMipChain.GetImages(), tMipChain.GetImageCount(), tMipChain.GetMetadata(), baseImage.format, mipChain );
                    }
                }
                break;

            default:
                return HRESULT_FROM_WIN32( ERROR_NOT_SUPPORTED );
        }
    }
    else
    {
        //--- Use custom filters to generate mipmaps ----------------------------------
        TexMetadata mdata;
        memset( &mdata, 0, sizeof(mdata) );
        mdata.width = baseImage.width;
        if ( baseImage.height > 1 || !allow1D )
        {
            mdata.height =  baseImage.height;
            mdata.dimension = TEX_DIMENSION_TEXTURE2D;
        }
        else
        {
            mdata.height = 1;
            mdata.dimension= TEX_DIMENSION_TEXTURE1D;
        }
        mdata.depth = mdata.arraySize = 1;
        mdata.mipLevels = levels;
        mdata.format = baseImage.format;

        DWORD filter_select = ( filter & TEX_FILTER_MASK );
        if ( !filter_select )
        {
            // Default filter choice
            filter_select = ( ispow2(baseImage.width) && ispow2(baseImage.height) ) ? TEX_FILTER_BOX : TEX_FILTER_LINEAR;
        }

        switch( filter_select )
        {
            case TEX_FILTER_BOX:
                hr = _Setup2DMips( &baseImage, 1, mdata, mipChain );
                if ( FAILED(hr) )
                    return hr;

                hr = _Generate2DMipsBoxFilter( levels, filter, mipChain, 0 );
                if ( FAILED(hr) )
                    mipChain.Release();
                return hr;

            case TEX_FILTER_POINT:
                hr = _Setup2DMips( &baseImage, 1, mdata, mipChain );
                if ( FAILED(hr) )
                    return hr;

                hr = _Generate2DMipsPointFilter( levels, mipChain, 0 );
                if ( FAILED(hr) )
                    mipChain.Release();
                return hr;

            case TEX_FILTER_LINEAR:
                hr = _Setup2DMips( &baseImage, 1, mdata, mipChain );
                if ( FAILED(hr) )
                    return hr;

                hr = _Generate2DMipsLinearFilter( levels, filter, mipChain, 0 );
                if ( FAILED(hr) )
                    mipChain.Release();
                return hr;

            case TEX_FILTER_CUBIC:
                hr = _Setup2DMips( &baseImage, 1, mdata, mipChain );
                if ( FAILED(hr) )
                    return hr;

                hr = _Generate2DMipsCubicFilter( levels, filter, mipChain, 0 );
                if ( FAILED(hr) )
                    mipChain.Release();
                return hr;

            case TEX_FILTER_TRIANGLE:
                hr = _Setup2DMips( &baseImage, 1, mdata, mipChain );
                if ( FAILED(hr) )
                    return hr;

                hr = _Generate2DMipsTriangleFilter( levels, filter, mipChain, 0 );
                if ( FAILED(hr) )
                    mipChain.Release();
                return hr;

            default:
                return HRESULT_FROM_WIN32( ERROR_NOT_SUPPORTED );
        }
    }
}

_Use_decl_annotations_
HRESULT GenerateMipMaps( const Image* srcImages, size_t nimages, const TexMetadata& metadata,
                         DWORD filter, size_t levels, ScratchImage& mipChain )
{
    if ( !srcImages || !nimages || !IsValid(metadata.format) )
        return E_INVALIDARG;

    if ( metadata.IsVolumemap()
         || IsCompressed(metadata.format) || IsTypeless(metadata.format) || IsPlanar(metadata.format) || IsPalettized(metadata.format) )
        return HRESULT_FROM_WIN32( ERROR_NOT_SUPPORTED );

    if ( !_CalculateMipLevels(metadata.width, metadata.height, levels) )
        return E_INVALIDARG;

    std::vector<const Image> baseImages;
    baseImages.reserve( metadata.arraySize );
    for( size_t item=0; item < metadata.arraySize; ++item )
    {
        size_t index = metadata.ComputeIndex( 0, item, 0);
        if ( index >= nimages )
            return E_FAIL;

        const Image& src = srcImages[ index ];
        if ( !src.pixels )
            return E_POINTER;

        if ( src.format != metadata.format || src.width != metadata.width || src.height != metadata.height )
        {
            // All base images must be the same format, width, and height
            return E_FAIL;
        }

        baseImages.push_back( src );
    }

    assert( baseImages.size() == metadata.arraySize );

    HRESULT hr;

    static_assert( TEX_FILTER_POINT == 0x100000, "TEX_FILTER_ flag values don't match TEX_FILTER_MASK" );

    if ( _UseWICFiltering( metadata.format, filter ) )
    {
        //--- Use WIC filtering to generate mipmaps -----------------------------------
        switch(filter & TEX_FILTER_MASK)
        {
        case 0:
        case TEX_FILTER_POINT:
        case TEX_FILTER_FANT: // Equivalent to Box filter
        case TEX_FILTER_LINEAR:
        case TEX_FILTER_CUBIC:
            {
                static_assert( TEX_FILTER_FANT == TEX_FILTER_BOX, "TEX_FILTER_ flag alias mismatch" );

                WICPixelFormatGUID pfGUID;
                if ( _DXGIToWIC( metadata.format, pfGUID, true ) )
                {
                    // Case 1: Base image format is supported by Windows Imaging Component
                    TexMetadata mdata2 = metadata;
                    mdata2.mipLevels = levels;
                    hr = mipChain.Initialize( mdata2 ); 
                    if ( FAILED(hr) )
                        return hr;

                    for( size_t item = 0; item < metadata.arraySize; ++item )
                    {
                        hr = _GenerateMipMapsUsingWIC( baseImages[item], filter, levels, pfGUID, mipChain, item );
                        if ( FAILED(hr) )
                        {
                            mipChain.Release();
                            return hr;
                        }
                    }

                    return S_OK;
                }
                else
                {
                    // Case 2: Base image format is not supported by WIC, so we have to convert, generate, and convert back
                    assert( metadata.format != DXGI_FORMAT_R32G32B32A32_FLOAT );

                    TexMetadata mdata2 = metadata;
                    mdata2.mipLevels = levels;
                    mdata2.format = DXGI_FORMAT_R32G32B32A32_FLOAT;
                    ScratchImage tMipChain;
                    hr = tMipChain.Initialize( mdata2 ); 
                    if ( FAILED(hr) )
                        return hr;

                    for( size_t item = 0; item < metadata.arraySize; ++item )
                    {
                        ScratchImage temp;
                        hr = _ConvertToR32G32B32A32( baseImages[item], temp );
                        if ( FAILED(hr) )
                            return hr;

                        const Image *timg = temp.GetImage( 0, 0, 0 );
                        if ( !timg )
                            return E_POINTER;

                        hr = _GenerateMipMapsUsingWIC( *timg, filter, levels, GUID_WICPixelFormat128bppRGBAFloat, tMipChain, item );
                        if ( FAILED(hr) )
                            return hr;
                    }

                    return _ConvertFromR32G32B32A32( tMipChain.GetImages(), tMipChain.GetImageCount(), tMipChain.GetMetadata(), metadata.format, mipChain );
                }
            }
            break;

        default:
            return HRESULT_FROM_WIN32( ERROR_NOT_SUPPORTED );
        }
    }
    else
    {
        //--- Use custom filters to generate mipmaps ----------------------------------
        TexMetadata mdata2 = metadata;
        mdata2.mipLevels = levels;

        DWORD filter_select = ( filter & TEX_FILTER_MASK );
        if ( !filter_select )
        {
            // Default filter choice
            filter_select = ( ispow2(metadata.width) && ispow2(metadata.height) ) ? TEX_FILTER_BOX : TEX_FILTER_LINEAR;
        }

        switch( filter_select )
        {
            case TEX_FILTER_BOX:
                hr = _Setup2DMips( &baseImages[0], metadata.arraySize, mdata2, mipChain );
                if ( FAILED(hr) )
                    return hr;

                for( size_t item = 0; item < metadata.arraySize; ++item )
                {
                    hr = _Generate2DMipsBoxFilter( levels, filter, mipChain, item );
                    if ( FAILED(hr) )
                        mipChain.Release();
                }
                return hr;

            case TEX_FILTER_POINT:
                hr = _Setup2DMips( &baseImages[0], metadata.arraySize, mdata2, mipChain );
                if ( FAILED(hr) )
                    return hr;

                for( size_t item = 0; item < metadata.arraySize; ++item )
                {
                    hr = _Generate2DMipsPointFilter( levels, mipChain, item );
                    if ( FAILED(hr) )
                        mipChain.Release();
                }
                return hr;

            case TEX_FILTER_LINEAR:
                hr = _Setup2DMips( &baseImages[0], metadata.arraySize, mdata2, mipChain );
                if ( FAILED(hr) )
                    return hr;

                for( size_t item = 0; item < metadata.arraySize; ++item )
                {
                    hr = _Generate2DMipsLinearFilter( levels, filter, mipChain, item );
                    if ( FAILED(hr) )
                        mipChain.Release();
                }
                return hr;

            case TEX_FILTER_CUBIC:
                hr = _Setup2DMips( &baseImages[0], metadata.arraySize, mdata2, mipChain );
                if ( FAILED(hr) )
                    return hr;

                for( size_t item = 0; item < metadata.arraySize; ++item )
                {
                    hr = _Generate2DMipsCubicFilter( levels, filter, mipChain, item );
                    if ( FAILED(hr) )
                        mipChain.Release();
                }
                return hr;

            case TEX_FILTER_TRIANGLE:
                hr = _Setup2DMips( &baseImages[0], metadata.arraySize, mdata2, mipChain );
                if ( FAILED(hr) )
                    return hr;

                for( size_t item = 0; item < metadata.arraySize; ++item )
                {
                    hr = _Generate2DMipsTriangleFilter( levels, filter, mipChain, item );
                    if ( FAILED(hr) )
                        mipChain.Release();
                }
                return hr;

            default:
                return HRESULT_FROM_WIN32( ERROR_NOT_SUPPORTED );
        }
    }
}


//-------------------------------------------------------------------------------------
// Generate mipmap chain for volume texture
//-------------------------------------------------------------------------------------
_Use_decl_annotations_
HRESULT GenerateMipMaps3D( const Image* baseImages, size_t depth, DWORD filter, size_t levels, ScratchImage& mipChain )
{
    if ( !baseImages || !depth )
        return E_INVALIDARG;

    if ( filter & TEX_FILTER_FORCE_WIC )
        return HRESULT_FROM_WIN32( ERROR_NOT_SUPPORTED );

    DXGI_FORMAT format = baseImages[0].format;
    size_t width = baseImages[0].width;
    size_t height = baseImages[0].height;

    if ( !_CalculateMipLevels3D(width, height, depth, levels) )
        return E_INVALIDARG;

    for( size_t slice=0; slice < depth; ++slice )
    {
        if ( !baseImages[slice].pixels )
            return E_POINTER;

        if ( baseImages[slice].format != format || baseImages[slice].width != width || baseImages[slice].height != height )
        {
            // All base images must be the same format, width, and height
            return E_FAIL;
        }
    }

    if ( IsCompressed(format) || IsTypeless(format) || IsPlanar(format) || IsPalettized(format) )
        return HRESULT_FROM_WIN32( ERROR_NOT_SUPPORTED );

    static_assert( TEX_FILTER_POINT == 0x100000, "TEX_FILTER_ flag values don't match TEX_FILTER_MASK" );

    HRESULT hr;

    DWORD filter_select = ( filter & TEX_FILTER_MASK );
    if ( !filter_select )
    {
        // Default filter choice
        filter_select = ( ispow2(width) && ispow2(height) && ispow2(depth) ) ? TEX_FILTER_BOX : TEX_FILTER_TRIANGLE;
    }

    switch( filter_select )
    {
    case TEX_FILTER_BOX:
        hr = _Setup3DMips( baseImages, depth, levels, mipChain );
        if ( FAILED(hr) )
            return hr;

        hr = _Generate3DMipsBoxFilter( depth, levels, filter, mipChain );
        if ( FAILED(hr) )
            mipChain.Release();
        return hr;

    case TEX_FILTER_POINT:
        hr = _Setup3DMips( baseImages, depth, levels, mipChain );
        if ( FAILED(hr) )
            return hr;

        hr = _Generate3DMipsPointFilter( depth, levels, mipChain );
        if ( FAILED(hr) )
            mipChain.Release();
        return hr;

    case TEX_FILTER_LINEAR:
        hr = _Setup3DMips( baseImages, depth, levels, mipChain );
        if ( FAILED(hr) )
            return hr;

        hr = _Generate3DMipsLinearFilter( depth, levels, filter, mipChain );
        if ( FAILED(hr) )
            mipChain.Release();
        return hr;

    case TEX_FILTER_CUBIC:
        hr = _Setup3DMips( baseImages, depth, levels, mipChain );
        if ( FAILED(hr) )
            return hr;

        hr = _Generate3DMipsCubicFilter( depth, levels, filter, mipChain );
        if ( FAILED(hr) )
            mipChain.Release();
        return hr;

    case TEX_FILTER_TRIANGLE:
        hr = _Setup3DMips( baseImages, depth, levels, mipChain );
        if ( FAILED(hr) )
            return hr;

        hr = _Generate3DMipsTriangleFilter( depth, levels, filter, mipChain );
        if ( FAILED(hr) )
            mipChain.Release();
        return hr;

    default:
        return HRESULT_FROM_WIN32( ERROR_NOT_SUPPORTED );
    }
}

_Use_decl_annotations_
HRESULT GenerateMipMaps3D( const Image* srcImages, size_t nimages, const TexMetadata& metadata,
                           DWORD filter, size_t levels, ScratchImage& mipChain )
{
    if ( !srcImages || !nimages || !IsValid(metadata.format) )
        return E_INVALIDARG;

    if ( filter & TEX_FILTER_FORCE_WIC )
        return HRESULT_FROM_WIN32( ERROR_NOT_SUPPORTED );

    if ( !metadata.IsVolumemap()
         || IsCompressed(metadata.format) || IsTypeless(metadata.format) || IsPlanar(metadata.format) || IsPalettized(metadata.format) )
        return HRESULT_FROM_WIN32( ERROR_NOT_SUPPORTED );

    if ( !_CalculateMipLevels3D(metadata.width, metadata.height, metadata.depth, levels) )
        return E_INVALIDARG;

    std::vector<const Image> baseImages;
    baseImages.reserve( metadata.depth );
    for( size_t slice=0; slice < metadata.depth; ++slice )
    {
        size_t index = metadata.ComputeIndex( 0, 0, slice );
        if ( index >= nimages )
            return E_FAIL;

        const Image& src = srcImages[ index ];
        if ( !src.pixels )
            return E_POINTER;

        if ( src.format != metadata.format || src.width != metadata.width || src.height != metadata.height )
        {
            // All base images must be the same format, width, and height
            return E_FAIL;
        }

        baseImages.push_back( src );
    }

    assert( baseImages.size() == metadata.depth );

    HRESULT hr;

    static_assert( TEX_FILTER_POINT == 0x100000, "TEX_FILTER_ flag values don't match TEX_FILTER_MASK" );

    DWORD filter_select = ( filter & TEX_FILTER_MASK );
    if ( !filter_select )
    {
        // Default filter choice
        filter_select = ( ispow2(metadata.width) && ispow2(metadata.height) && ispow2(metadata.depth) ) ? TEX_FILTER_BOX : TEX_FILTER_TRIANGLE;
    }

    switch( filter_select )
    {
    case TEX_FILTER_BOX:
        hr = _Setup3DMips( &baseImages[0], metadata.depth, levels, mipChain );
        if ( FAILED(hr) )
            return hr;

        hr = _Generate3DMipsBoxFilter( metadata.depth, levels, filter, mipChain );
        if ( FAILED(hr) )
            mipChain.Release();
        return hr;

    case TEX_FILTER_POINT:
        hr = _Setup3DMips( &baseImages[0], metadata.depth, levels, mipChain );
        if ( FAILED(hr) )
            return hr;

        hr = _Generate3DMipsPointFilter( metadata.depth, levels, mipChain );
        if ( FAILED(hr) )
            mipChain.Release();
        return hr;

    case TEX_FILTER_LINEAR:
        hr = _Setup3DMips( &baseImages[0], metadata.depth, levels, mipChain );
        if ( FAILED(hr) )
            return hr;

        hr = _Generate3DMipsLinearFilter( metadata.depth, levels, filter, mipChain );
        if ( FAILED(hr) )
            mipChain.Release();
        return hr;

    case TEX_FILTER_CUBIC:
        hr = _Setup3DMips( &baseImages[0], metadata.depth, levels, mipChain );
        if ( FAILED(hr) )
            return hr;

        hr = _Generate3DMipsCubicFilter( metadata.depth, levels, filter, mipChain );
        if ( FAILED(hr) )
            mipChain.Release();
        return hr;

    case TEX_FILTER_TRIANGLE:
        hr = _Setup3DMips( &baseImages[0], metadata.depth, levels, mipChain );
        if ( FAILED(hr) )
            return hr;

        hr = _Generate3DMipsTriangleFilter( metadata.depth, levels, filter, mipChain );
        if ( FAILED(hr) )
            mipChain.Release();
        return hr;

    default:
        return HRESULT_FROM_WIN32( ERROR_NOT_SUPPORTED );
    }
}

}; // namespace
