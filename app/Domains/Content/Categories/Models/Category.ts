import mongoose, { Schema, Document, Model } from 'mongoose'

// Interface for SEO subdocument
export interface ICategorySEO {
  metaTitle?: string
  metaDescription?: string
}

// Interface for Category document
export interface ICategory extends Document {
  name: string
  slug: string
  description?: string
  parent?: mongoose.Types.ObjectId
  image?: string
  color?: string
  isActive: boolean
  sortOrder: number
  seo: ICategorySEO
  postCount: number
  createdAt: Date
  updatedAt: Date

  // Instance methods
  generateSlug(): string
  getAncestors(): Promise<ICategory[]>
  getChildren(): Promise<ICategory[]>
  getPath(): Promise<string>
  updatePostCount(): Promise<void>
}

// Interface for Category model with static methods
export interface ICategoryModel extends Model<ICategory> {
  findBySlug(slug: string): Promise<ICategory | null>
  findActive(): Promise<ICategory[]>
  findWithPosts(): Promise<ICategory[]>
  findByParent(parentId: mongoose.Types.ObjectId): Promise<ICategory[]>
  findRoots(): Promise<ICategory[]>;
}

// SEO Schema
const CategorySEOSchema = new Schema<ICategorySEO>({
  metaTitle: {
    type: String,
    maxlength: [60, 'Meta title cannot exceed 60 characters'],
  },
  metaDescription: {
    type: String,
    maxlength: [160, 'Meta description cannot exceed 160 characters'],
  },
})

// Category Schema
const CategorySchema = new Schema<ICategory>(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
      maxlength: [100, 'Category name cannot exceed 100 characters'],
    },
    slug: {
      type: String,
      required: [true, 'Slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'],
      maxlength: [100, 'Slug cannot exceed 100 characters'],
    },
    description: {
      type: String,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    parent: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
    },
    image: {
      type: String,
      validate: {
        validator: function (v: string) {
          return !v || /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)$/i.test(v)
        },
        message: 'Image must be a valid image URL',
      },
    },
    color: {
      type: String,
      validate: {
        validator: function (v: string) {
          return !v || /^#[0-9A-F]{6}$/i.test(v)
        },
        message: 'Color must be a valid hex color (e.g., #FF0000)',
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
    seo: {
      type: CategorySEOSchema,
      default: {},
    },
    postCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
)

// Indexes
// CategorySchema.index({ slug: 1 }, { unique: true })
CategorySchema.index({ parent: 1 })
CategorySchema.index({ isActive: 1, sortOrder: 1 })
CategorySchema.index({ name: 'text', description: 'text' })

// Virtual for children categories
CategorySchema.virtual('children', {
  ref: 'Category',
  localField: '_id',
  foreignField: 'parent',
})

// Virtual for posts in this category
CategorySchema.virtual('posts', {
  ref: 'Post',
  localField: '_id',
  foreignField: 'categories',
})

// Pre-save middleware
CategorySchema.pre('save', function (next) {
  // Generate slug from name if not provided
  if (!this.slug && this.name) {
    this.slug = this.generateSlug()
  }
  next()
})

// Pre-remove middleware to handle category deletion
CategorySchema.pre('deleteOne', { document: true, query: false }, async function (next) {
  // Move child categories to parent or make them root
  const children = await mongoose.model('Category').find({ parent: this._id })

  for (const child of children) {
    child.parent = this.parent || null
    await child.save()
  }

  // Remove this category from posts
  await mongoose
    .model('Post')
    .updateMany({ categories: this._id }, { $pull: { categories: this._id } })

  next()
})

// Instance Methods
CategorySchema.methods.generateSlug = function (): string {
  return this.name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

CategorySchema.methods.getAncestors = async function (): Promise<ICategory[]> {
  const ancestors: ICategory[] = []
  let current = this

  while (current.parent) {
    const parent = await mongoose.model('Category').findById(current.parent)
    if (parent) {
      ancestors.unshift(parent)
      current = parent
    } else {
      break
    }
  }

  return ancestors
}

CategorySchema.methods.getChildren = async function (): Promise<ICategory[]> {
  return mongoose
    .model('Category')
    .find({ parent: this._id, isActive: true })
    .sort({ sortOrder: 1, name: 1 })
}

CategorySchema.methods.getPath = async function (): Promise<string> {
  const ancestors = await this.getAncestors()
  const path = ancestors.map((ancestor: ICategory) => ancestor.name).concat(this.name)
  return path.join(' > ')
}

CategorySchema.methods.updatePostCount = async function (): Promise<void> {
  const count = await mongoose.model('Post').countDocuments({
    categories: this._id,
    status: 'published',
  })

  this.postCount = count
  await this.save()
}

// Static Methods
CategorySchema.statics.findBySlug = function (slug: string) {
  return this.findOne({ slug, isActive: true }).populate('parent')
}

CategorySchema.statics.findRootCategories = function () {
  return this.find({
    parent: null,
    isActive: true,
  }).sort({ sortOrder: 1, name: 1 })
}

CategorySchema.statics.findByParent = function (parentId: mongoose.Types.ObjectId) {
  return this.find({
    parent: parentId,
    isActive: true,
  }).sort({ sortOrder: 1, name: 1 })
}

CategorySchema.statics.getHierarchy = async function () {
  const Category = this
  const rootCategories = await Category.find({
    parent: null,
    isActive: true,
  })
    .sort({ sortOrder: 1, name: 1 })
    .populate({
      path: 'children',
      match: { isActive: true },
      options: { sort: { sortOrder: 1, name: 1 } },
      populate: {
        path: 'children',
        match: { isActive: true },
        options: { sort: { sortOrder: 1, name: 1 } },
      },
    })

  return rootCategories
}

CategorySchema.statics.createCategory = async function (categoryData: Partial<ICategory>) {
  // Validate parent exists if provided
  if (categoryData.parent) {
    const parentCategory = await this.findById(categoryData.parent)
    if (!parentCategory) {
      throw new Error('Parent category not found')
    }
  }

  const category = new this(categoryData)
  return category.save()
}

// Create and export the model
const Category = mongoose.model<ICategory, ICategoryModel>('Category', CategorySchema)
export default Category
