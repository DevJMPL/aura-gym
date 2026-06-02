import { supabase } from './client'

export const storageService = {
  /**
   * Uploads a base64 image or File to the avatars bucket
   * @param file The file or base64 string to upload
   * @param path The path where it should be stored (e.g. 'members/123-uuid.jpg')
   * @returns The public URL of the uploaded image
   */
  async uploadAvatar(file: string | File | Blob, path: string): Promise<string> {
    try {
      let fileBody: File | Blob | string = file
      let contentType = 'image/jpeg'

      // If it's a base64 data URL from a canvas
      if (typeof file === 'string' && file.startsWith('data:image')) {
        const fetchResponse = await fetch(file)
        fileBody = await fetchResponse.blob()
        contentType = fileBody.type
      }

      const { error } = await supabase.storage.from('avatars').upload(path, fileBody, {
        upsert: true,
        contentType,
      })

      if (error) throw error

      const { data } = supabase.storage.from('avatars').getPublicUrl(path)
      return data.publicUrl
    } catch (error) {
      console.error('Error uploading avatar:', error)
      throw error
    }
  },

  /**
   * Deletes an avatar from the bucket
   */
  async deleteAvatar(path: string): Promise<void> {
    const { error } = await supabase.storage.from('avatars').remove([path])
    if (error) throw error
  },

  async uploadProductImage(file: File | Blob, path: string): Promise<string> {
    const contentType = file.type || 'image/jpeg'

    const { error } = await supabase.storage.from('product-images').upload(path, file, {
      upsert: true,
      contentType,
    })

    if (error) throw error

    const { data } = supabase.storage.from('product-images').getPublicUrl(path)
    return data.publicUrl
  },
}
