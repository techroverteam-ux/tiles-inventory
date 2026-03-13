export const uploadImage = async (file: File): Promise<string> => {
  try {
    // Validate file
    if (!file) {
      throw new Error('No file provided');
    }

    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('File size too large. Maximum 5MB allowed.');
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      throw new Error('Only image files are allowed.');
    }

    const filename = `${Date.now()}-${encodeURIComponent(file.name)}`;
    
    const response = await fetch(`/api/upload?filename=${filename}`, {
      method: 'POST',
      body: file,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.details || errorData.error || 'Upload failed');
    }

    const { url } = await response.json();
    return url;
  } catch (error) {
    console.error('Upload error:', error);
    throw error; // Re-throw to let the caller handle it
  }
};