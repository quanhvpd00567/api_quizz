import mongoose, { Schema, Document, Model } from 'mongoose'

// Interface for Thumbnail subdocument
export interface IThumbnail {
  size: string
  url: string
  width: number
  height: number
}

// Interface for Dimensions subdocument
export interface IDimensions {
  width: number
  height: number
}

// Interface for Metadata subdocument
export interface IMetadata {
  exif?: any
  encoding?: string
  bitrate?: number
  fps?: number
}

// Interface for MediaFile document
export interface IMediaFile extends Document {
  originalName: string
  fileName: string
  mimeType: string
  size: number
  path: string
  url: string
  uploadedBy: mongoose.Types.ObjectId
  fileType: 'image' | 'video' | 'audio' | 'document' | 'other'
  dimensions?: IDimensions
  duration?: number
  thumbnails: IThumbnail[]
  metadata: IMetadata
  tags: string[]
  description?: string
  altText?: string
  isPublic: boolean
  usageCount: number
  createdAt: Date
  updatedAt: Date

  // Instance methods
  generateThumbnails(): Promise<void>
  incrementUsage(): Promise<void>
  getFileTypeFromMime(): string
  isImage(): boolean
  isVideo(): boolean
  isAudio(): boolean
  isDocument(): boolean
}

// Interface for MediaFile model with static methods
export interface IMediaFileModel extends Model<IMediaFile> {
  findByUser(userId: mongoose.Types.ObjectId): Promise<IMediaFile[]>
  findByType(fileType: string): Promise<IMediaFile[]>
  findPublic(): Promise<IMediaFile[]>
  search(query: string): Promise<IMediaFile[]>
  getTotalStorageUsed(userId?: mongoose.Types.ObjectId): Promise<number>
}

// Thumbnail Schema
const ThumbnailSchema = new Schema<IThumbnail>({
  size: {
    type: String,
    required: true,
    enum: ['small', 'medium', 'large'],
  },
  url: {
    type: String,
    required: true,
  },
  width: {
    type: Number,
    required: true,
  },
  height: {
    type: Number,
    required: true,
  },
})

// Dimensions Schema
const DimensionsSchema = new Schema<IDimensions>({
  width: {
    type: Number,
    required: true,
    min: 1,
  },
  height: {
    type: Number,
    required: true,
    min: 1,
  },
})

// Metadata Schema
const MetadataSchema = new Schema<IMetadata>({
  exif: Schema.Types.Mixed,
  encoding: String,
  bitrate: {
    type: Number,
    min: 0,
  },
  fps: {
    type: Number,
    min: 0,
  },
})

// MediaFile Schema
const MediaFileSchema = new Schema<IMediaFile>(
  {
    originalName: {
      type: String,
      required: [true, 'Original file name is required'],
      trim: true,
      maxlength: [255, 'Original name cannot exceed 255 characters'],
    },
    fileName: {
      type: String,
      required: [true, 'File name is required'],
      trim: true,
      maxlength: [255, 'File name cannot exceed 255 characters'],
    },
    mimeType: {
      type: String,
      required: [true, 'MIME type is required'],
      lowercase: true,
    },
    size: {
      type: Number,
      required: [true, 'File size is required'],
      min: [1, 'File size must be greater than 0'],
    },
    path: {
      type: String,
      required: [true, 'File path is required'],
    },
    url: {
      type: String,
      required: [true, 'File URL is required'],
      validate: {
        validator: function (v: string) {
          return /^https?:\/\/.+/.test(v)
        },
        message: 'URL must be a valid HTTP/HTTPS URL',
      },
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Uploader is required'],
    },
    fileType: {
      type: String,
      enum: {
        values: ['image', 'video', 'audio', 'document', 'other'],
        message: 'File type must be image, video, audio, document, or other',
      },
      required: true,
    },
    dimensions: {
      type: DimensionsSchema,
      required: function (this: IMediaFile) {
        return this.fileType === 'image' || this.fileType === 'video'
      },
    },
    duration: {
      type: Number,
      min: 0,
      required: function (this: IMediaFile) {
        return this.fileType === 'audio' || this.fileType === 'video'
      },
    },
    thumbnails: [ThumbnailSchema],
    metadata: {
      type: MetadataSchema,
      default: {},
    },
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
        maxlength: [50, 'Tag cannot exceed 50 characters'],
      },
    ],
    description: {
      type: String,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    altText: {
      type: String,
      maxlength: [200, 'Alt text cannot exceed 200 characters'],
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
    usageCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
)

// Indexes
MediaFileSchema.index({ uploadedBy: 1 })
MediaFileSchema.index({ fileType: 1 })
MediaFileSchema.index({ isPublic: 1 })
MediaFileSchema.index({ tags: 1 })
MediaFileSchema.index({ createdAt: -1 })
MediaFileSchema.index({ originalName: 'text', description: 'text', tags: 'text' })

// Virtual for file size in human readable format
MediaFileSchema.virtual('formattedSize').get(function () {
  const bytes = this.size
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  if (bytes === 0) return '0 Bytes'
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i]
})

// Pre-save middleware
MediaFileSchema.pre('save', function (next) {
  // Determine file type from MIME type if not set
  // if (!this.fileType) {
  //   this.fileType = this.getFileTypeFromMime()
  // }
  next()
})

// Instance Methods
MediaFileSchema.methods.getFileTypeFromMime = function (): string {
  const mimeType = this.mimeType.toLowerCase()

  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType.startsWith('video/')) return 'video'
  if (mimeType.startsWith('audio/')) return 'audio'
  if (
    mimeType.includes('pdf') ||
    mimeType.includes('document') ||
    mimeType.includes('text') ||
    mimeType.includes('msword') ||
    mimeType.includes('sheet') ||
    mimeType.includes('presentation')
  )
    return 'document'

  return 'other'
}

MediaFileSchema.methods.isImage = function (): boolean {
  return this.fileType === 'image'
}

MediaFileSchema.methods.isVideo = function (): boolean {
  return this.fileType === 'video'
}

MediaFileSchema.methods.isAudio = function (): boolean {
  return this.fileType === 'audio'
}

MediaFileSchema.methods.isDocument = function (): boolean {
  return this.fileType === 'document'
}

MediaFileSchema.methods.generateThumbnails = async function (): Promise<void> {
  if (!this.isImage() && !this.isVideo()) {
    return
  }

  // This would integrate with image processing library like Sharp or FFmpeg
  // For now, just a placeholder implementation
  const baseThumbnailUrl = this.url.replace(/\.[^/.]+$/, '')

  this.thumbnails = [
    {
      size: 'small',
      url: `${baseThumbnailUrl}_small.jpg`,
      width: 150,
      height: 150,
    },
    {
      size: 'medium',
      url: `${baseThumbnailUrl}_medium.jpg`,
      width: 300,
      height: 300,
    },
    {
      size: 'large',
      url: `${baseThumbnailUrl}_large.jpg`,
      width: 600,
      height: 600,
    },
  ]

  await this.save()
}

MediaFileSchema.methods.incrementUsage = async function (): Promise<void> {
  await this.updateOne({ $inc: { usageCount: 1 } })
}

// Static Methods
MediaFileSchema.statics.findByUser = function (userId: mongoose.Types.ObjectId) {
  return this.find({ uploadedBy: userId }).populate('uploadedBy').sort({ createdAt: -1 })
}

MediaFileSchema.statics.findByType = function (fileType: string) {
  return this.find({ fileType }).populate('uploadedBy').sort({ createdAt: -1 })
}

MediaFileSchema.statics.findPublic = function () {
  return this.find({ isPublic: true }).populate('uploadedBy').sort({ createdAt: -1 })
}

MediaFileSchema.statics.search = function (query: string) {
  return this.find({ $text: { $search: query } }, { score: { $meta: 'textScore' } })
    .populate('uploadedBy')
    .sort({ score: { $meta: 'textScore' } })
}

MediaFileSchema.statics.getTotalStorageUsed = async function (userId?: mongoose.Types.ObjectId) {
  const match = userId ? { uploadedBy: userId } : {}

  const result = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        totalSize: { $sum: '$size' },
      },
    },
  ])

  return result.length > 0 ? result[0].totalSize : 0
}

// Create and export the model
const MediaFile = mongoose.model<IMediaFile, IMediaFileModel>('MediaFile', MediaFileSchema)
export default MediaFile
