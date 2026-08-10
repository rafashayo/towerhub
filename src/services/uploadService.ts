import { apiUpload, apiUploadWithProgress } from '../lib/api'

export interface UploadedFile {
  url: string
  name: string
  sizeBytes: number
  type: string
}

/**
 * Uploads a real file to the backend (server/uploads/, served from
 * /api/uploads/files/…) — this leaves the browser and persists on the
 * server's disk, unlike the old base64-in-localStorage / in-memory
 * blobRegistry approach. See README.md for what a production swap to real
 * object storage (S3/R2/GCS) would change here (just these two functions).
 */
export const uploadService = {
  uploadImage(file: File): Promise<UploadedFile> {
    return apiUpload<UploadedFile>('/api/uploads/images', file)
  },

  uploadModFile(file: File, onProgress?: (percent: number) => void): Promise<UploadedFile> {
    return apiUploadWithProgress<UploadedFile>('/api/uploads/mods', file, onProgress)
  },
}
