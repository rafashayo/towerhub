import { Router } from 'express'
import multer from 'multer'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { requireAuth } from '../middleware/auth.js'
import { uid } from '../lib/ids.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
export const UPLOADS_DIR = path.join(__dirname, '..', '..', 'uploads')

const IMAGES_DIR = path.join(UPLOADS_DIR, 'images')
const MODS_DIR = path.join(UPLOADS_DIR, 'mods')
fs.mkdirSync(IMAGES_DIR, { recursive: true })
fs.mkdirSync(MODS_DIR, { recursive: true })

const MAX_IMAGE_BYTES = 20 * 1024 * 1024 // 20MB per screenshot
const MAX_MOD_FILE_BYTES = 2 * 1024 * 1024 * 1024 // 2GB — real disk storage, not browser memory

function safeExt(originalName) {
  const ext = path.extname(originalName).toLowerCase()
  return /^\.[a-z0-9]{1,10}$/.test(ext) ? ext : ''
}

const imageStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, IMAGES_DIR),
  filename: (_req, file, cb) => cb(null, `${uid('img')}${safeExt(file.originalname)}`),
})

const modFileStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, MODS_DIR),
  filename: (_req, file, cb) => cb(null, `${uid('modfile')}${safeExt(file.originalname)}`),
})

const uploadImage = multer({
  storage: imageStorage,
  limits: { fileSize: MAX_IMAGE_BYTES },
  fileFilter: (_req, file, cb) => cb(null, file.mimetype.startsWith('image/')),
})

const uploadModFile = multer({
  storage: modFileStorage,
  limits: { fileSize: MAX_MOD_FILE_BYTES },
})

export const uploadsRouter = Router()
uploadsRouter.use(requireAuth)

function handleMulterErrors(err, _req, res, next) {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ message: 'File is too large.' })
    }
    return res.status(400).json({ message: err.message })
  }
  if (err) return res.status(400).json({ message: 'Upload failed.' })
  next()
}

uploadsRouter.post('/images', (req, res, next) => {
  uploadImage.single('file')(req, res, (err) => {
    if (err) return handleMulterErrors(err, req, res, next)
    if (!req.file) return res.status(400).json({ message: 'No image received, or it was not an image file.' })
    res.status(201).json({
      url: `/api/files/images/${req.file.filename}`,
      name: req.file.originalname,
      sizeBytes: req.file.size,
      type: req.file.mimetype,
    })
  })
})

uploadsRouter.post('/mods', (req, res, next) => {
  uploadModFile.single('file')(req, res, (err) => {
    if (err) return handleMulterErrors(err, req, res, next)
    if (!req.file) return res.status(400).json({ message: 'No file received.' })
    res.status(201).json({
      url: `/api/files/mods/${req.file.filename}`,
      name: req.file.originalname,
      sizeBytes: req.file.size,
      type: req.file.mimetype || 'application/octet-stream',
    })
  })
})
