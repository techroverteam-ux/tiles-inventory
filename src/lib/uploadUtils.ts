const compressImage = (file: File, maxWidthPx = 1200, quality = 0.75): Promise<File> => {
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const canvas = document.createElement('canvas')
      let { width, height } = img
      if (width > maxWidthPx) {
        height = Math.round((height * maxWidthPx) / width)
        width = maxWidthPx
      }
      canvas.width = width
      canvas.height = height
      canvas.getContext('2d')!.drawImage(img, 0, 0, width, height)
      canvas.toBlob(
        (blob) => {
          if (!blob) { resolve(file); return }
          resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' }))
        },
        'image/jpeg',
        quality
      )
    }
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file) }
    img.src = url
  })
}

export const uploadImage = async (file: File): Promise<string> => {
  try {
    if (!file) throw new Error('No file provided')
    if (!file.type.startsWith('image/')) throw new Error('Only image files are allowed.')

    const compressed = await compressImage(file)
    const filename = `${Date.now()}-${encodeURIComponent(compressed.name)}`

    const response = await fetch(`/api/upload?filename=${filename}`, {
      method: 'POST',
      body: compressed,
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.details || errorData.error || 'Upload failed')
    }

    const { url } = await response.json()
    return url
  } catch (error) {
    console.error('Upload error:', error)
    throw error
  }
}