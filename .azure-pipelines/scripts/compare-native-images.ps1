param(
    [Parameter(Mandatory = $true)][string]$First,
    [Parameter(Mandatory = $true)][string]$Second
)

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing
$firstImage = [System.Drawing.Bitmap]::new($First)
try {
    $secondImage = [System.Drawing.Bitmap]::new($Second)
    try {
        if ($firstImage.Width -ne $secondImage.Width -or $firstImage.Height -ne $secondImage.Height) {
            exit 1
        }

        $rectangle = [System.Drawing.Rectangle]::new(0, 0, $firstImage.Width, $firstImage.Height)
        $format = [System.Drawing.Imaging.PixelFormat]::Format32bppArgb
        $mode = [System.Drawing.Imaging.ImageLockMode]::ReadOnly
        $firstData = $firstImage.LockBits($rectangle, $mode, $format)
        try {
            $secondData = $secondImage.LockBits($rectangle, $mode, $format)
            try {
                $firstRow = [byte[]]::new($firstImage.Width * 4)
                $secondRow = [byte[]]::new($firstImage.Width * 4)
                for ($y = 0; $y -lt $firstImage.Height; $y++) {
                    [System.Runtime.InteropServices.Marshal]::Copy([IntPtr]::Add($firstData.Scan0, $y * $firstData.Stride), $firstRow, 0, $firstRow.Length)
                    [System.Runtime.InteropServices.Marshal]::Copy([IntPtr]::Add($secondData.Scan0, $y * $secondData.Stride), $secondRow, 0, $secondRow.Length)
                    if (-not [System.Collections.StructuralComparisons]::StructuralEqualityComparer.Equals($firstRow, $secondRow)) {
                        exit 1
                    }
                }
            } finally {
                $secondImage.UnlockBits($secondData)
            }
        } finally {
            $firstImage.UnlockBits($firstData)
        }
    } finally {
        $secondImage.Dispose()
    }
} finally {
    $firstImage.Dispose()
}
