import mongoose, { Schema, Document, Model } from 'mongoose'

// Interface for Comment subdocument
export interface IComment {
  _id?: mongoose.Types.ObjectId
  author: mongoose.Types.ObjectId
  content: string
  isApproved: boolean
  createdAt: Date
}

// Interface for SEO subdocument
export interface ISEO {
  metaTitle?: string
  metaDescription?: string
  focusKeyword?: string
  canonicalUrl?: string
}

// Interface for Post document
export interface IPost extends Document {
  title: string
  slug: string
  content: string
  excerpt?: string
  author: mongoose.Types.ObjectId
  categories: mongoose.Types.ObjectId[]
  tags: string[]
  featuredImage?: string
  status: 'draft' | 'published' | 'archived'
  visibility: 'public' | 'private' | 'password'
  password?: string
  publishedAt?: Date
  scheduledAt?: Date
  seo: ISEO
  readingTime: number
  views: number
  likes: number
  shares: number
  comments: IComment[]
  isCommentEnabled: boolean
  isFeatured: boolean
  createdAt: Date
  updatedAt: Date

  // Instance methods
  generateSlug(): string
  calculateReadingTime(): number
  publish(): Promise<void>
  unpublish(): Promise<void>
  addComment(authorId: mongoose.Types.ObjectId, content: string): Promise<void>
  approveComment(commentId: mongoose.Types.ObjectId): Promise<void>
  incrementViews(): Promise<void>
  addLike(): Promise<void>
  addShare(): Promise<void>
}

// Interface for Post model with static methods
export interface IPostModel extends Model<IPost> {
  findBySlug(slug: string): Promise<IPost | null>
  findPublished(): Promise<IPost[]>
  findByAuthor(authorId: mongoose.Types.ObjectId): Promise<IPost[]>
  findByCategory(categoryId: mongoose.Types.ObjectId): Promise<IPost[]>
  findFeatured(): Promise<IPost[]>
  search(query: string): Promise<IPost[]>
}

// Comment Schema
const CommentSchema = new Schema<IComment>(
  {
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: [true, 'Comment content is required'],
      maxlength: [1000, 'Comment cannot exceed 1000 characters'],
    },
    isApproved: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
)

// SEO Schema
const SEOSchema = new Schema<ISEO>({
  metaTitle: {
    type: String,
    maxlength: [60, 'Meta title cannot exceed 60 characters'],
  },
  metaDescription: {
    type: String,
    maxlength: [160, 'Meta description cannot exceed 160 characters'],
  },
  focusKeyword: {
    type: String,
    maxlength: [100, 'Focus keyword cannot exceed 100 characters'],
  },
  canonicalUrl: {
    type: String,
    validate: {
      validator: function (v: string) {
        return !v || /^https?:\/\/.+/.test(v)
      },
      message: 'Canonical URL must be a valid URL',
    },
  },
})

// Post Schema
const PostSchema = new Schema<IPost>(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    slug: {
      type: String,
      required: [true, 'Slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'],
      maxlength: [200, 'Slug cannot exceed 200 characters'],
    },
    content: {
      type: String,
      required: [true, 'Content is required'],
    },
    excerpt: {
      type: String,
      maxlength: [500, 'Excerpt cannot exceed 500 characters'],
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Author is required'],
    },
    categories: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Category',
      },
    ],
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
        maxlength: [50, 'Tag cannot exceed 50 characters'],
      },
    ],
    featuredImage: {
      type: String,
      validate: {
        validator: function (v: string) {
          return !v || /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(v)
        },
        message: 'Featured image must be a valid image URL',
      },
    },
    status: {
      type: String,
      enum: {
        values: ['draft', 'published', 'archived'],
        message: 'Status must be draft, published, or archived',
      },
      default: 'draft',
    },
    visibility: {
      type: String,
      enum: {
        values: ['public', 'private', 'password'],
        message: 'Visibility must be public, private, or password',
      },
      default: 'public',
    },
    publishedAt: Date,
    scheduledAt: Date,
    seo: {
      type: SEOSchema,
      default: {},
    },
    readingTime: {
      type: Number,
      default: 0,
    },
    views: {
      type: Number,
      default: 0,
    },
    likes: {
      type: Number,
      default: 0,
    },
    shares: {
      type: Number,
      default: 0,
    },
    comments: [CommentSchema],
    isCommentEnabled: {
      type: Boolean,
      default: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (_doc, ret) {
        if (ret.visibility === 'password') {
          delete ret.password
        }
        return ret
      },
    },
    toObject: { virtuals: true },
  }
)

// Indexes
PostSchema.index({ slug: 1 }, { unique: true })
PostSchema.index({ author: 1 })
PostSchema.index({ status: 1, publishedAt: -1 })
PostSchema.index({ categories: 1 })
PostSchema.index({ tags: 1 })
PostSchema.index({ isFeatured: 1, publishedAt: -1 })
PostSchema.index({ title: 'text', content: 'text', excerpt: 'text' })

// Virtual for comment count
PostSchema.virtual('commentCount').get(function () {
  return this.comments.filter((comment) => comment.isApproved).length
})

// Pre-save middleware
PostSchema.pre('save', function (next) {
  // Generate slug from title if not provided
  if (!this.slug && this.title) {
    this.slug = this.generateSlug()
  }

  // Calculate reading time
  this.readingTime = this.calculateReadingTime()

  // Generate excerpt if not provided
  if (!this.excerpt && this.content) {
    this.excerpt = this.content.substring(0, 160).replace(/<[^>]*>/g, '') + '...'
  }

  // Set published date when status changes to published
  if (this.isModified('status') && this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date()
  }

  next()
})

// Instance Methods
PostSchema.methods.generateSlug = function (): string {
  return this.title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

PostSchema.methods.calculateReadingTime = function (): number {
  const wordsPerMinute = 200
  const wordCount = this.content.replace(/<[^>]*>/g, '').split(/\s+/).length
  return Math.ceil(wordCount / wordsPerMinute)
}

PostSchema.methods.publish = async function (): Promise<void> {
  this.status = 'published'
  this.publishedAt = new Date()
  await this.save()
}

PostSchema.methods.unpublish = async function (): Promise<void> {
  this.status = 'draft'
  this.publishedAt = undefined
  await this.save()
}

PostSchema.methods.addComment = async function (
  authorId: mongoose.Types.ObjectId,
  content: string
): Promise<void> {
  if (!this.isCommentEnabled) {
    throw new Error('Comments are disabled for this post')
  }

  this.comments.push({
    author: authorId,
    content,
    isApproved: false,
    createdAt: new Date(),
  })

  await this.save()
}

PostSchema.methods.approveComment = async function (
  commentId: mongoose.Types.ObjectId
): Promise<void> {
  const comment = this.comments.id(commentId)
  if (comment) {
    comment.isApproved = true
    await this.save()
  }
}

PostSchema.methods.incrementViews = async function (): Promise<void> {
  await this.updateOne({ $inc: { views: 1 } })
}

PostSchema.methods.addLike = async function (): Promise<void> {
  await this.updateOne({ $inc: { likes: 1 } })
}

PostSchema.methods.addShare = async function (): Promise<void> {
  await this.updateOne({ $inc: { shares: 1 } })
}

// Static Methods
PostSchema.statics.findBySlug = function (slug: string) {
  return this.findOne({ slug }).populate('author categories')
}

PostSchema.statics.findPublished = function () {
  return this.find({
    status: 'published',
    $or: [{ scheduledAt: { $lte: new Date() } }, { scheduledAt: { $exists: false } }],
  })
    .populate('author categories')
    .sort({ publishedAt: -1 })
}

PostSchema.statics.findByAuthor = function (authorId: mongoose.Types.ObjectId) {
  return this.find({ author: authorId }).populate('categories').sort({ createdAt: -1 })
}

PostSchema.statics.findByCategory = function (categoryId: mongoose.Types.ObjectId) {
  return this.find({
    categories: categoryId,
    status: 'published',
  })
    .populate('author categories')
    .sort({ publishedAt: -1 })
}

PostSchema.statics.findFeatured = function () {
  return this.find({
    isFeatured: true,
    status: 'published',
  })
    .populate('author categories')
    .sort({ publishedAt: -1 })
}

PostSchema.statics.search = function (query: string) {
  return this.find(
    {
      $text: { $search: query },
      status: 'published',
    },
    { score: { $meta: 'textScore' } }
  )
    .populate('author categories')
    .sort({ score: { $meta: 'textScore' } })
}

// Create and export the model
const Post = mongoose.model<IPost, IPostModel>('Post', PostSchema)
export default Post
