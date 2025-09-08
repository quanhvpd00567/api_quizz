# MongoDB Database Schema Design

## Phase 1.2: Database Schema & Models Implementation

### Database Architecture Overview

Our Learning Management System uses MongoDB with Mongoose ODM for flexible document-based storage. The schema follows Portal architecture principles with domain-specific collections.

---

## 🔐 Authentication Domain Collections

### 1. Users Collection

```javascript
{
  _id: ObjectId,
  email: String (unique, required),
  username: String (unique, required),
  password: String (hashed with bcrypt),
  firstName: String (required),
  lastName: String (required),
  avatar: String (URL),
  bio: String,
  roles: [ObjectId] (ref: 'Role'),
  isActive: Boolean (default: true),
  isEmailVerified: Boolean (default: false),
  emailVerificationToken: String,
  passwordResetToken: String,
  passwordResetExpires: Date,
  lastLoginAt: Date,
  loginAttempts: Number (default: 0),
  lockUntil: Date,
  preferences: {
    language: String (default: 'en'),
    timezone: String (default: 'UTC'),
    emailNotifications: Boolean (default: true),
    theme: String (default: 'light')
  },
  metadata: {
    registrationIP: String,
    userAgent: String,
    source: String (web, mobile, api)
  },
  createdAt: Date,
  updatedAt: Date
}
```

### 2. Roles Collection

```javascript
{
  _id: ObjectId,
  name: String (unique, required), // admin, instructor, student
  displayName: String (required),
  description: String,
  permissions: [ObjectId] (ref: 'Permission'),
  isDefault: Boolean (default: false),
  isActive: Boolean (default: true),
  createdAt: Date,
  updatedAt: Date
}
```

### 3. Permissions Collection

```javascript
{
  _id: ObjectId,
  name: String (unique, required), // posts.create, quiz.manage
  resource: String (required), // posts, quiz, users
  action: String (required), // create, read, update, delete, manage
  description: String,
  createdAt: Date,
  updatedAt: Date
}
```

---

## 📝 Content Domain Collections

### 4. Posts Collection

```javascript
{
  _id: ObjectId,
  title: String (required),
  slug: String (unique, required),
  content: String (required),
  excerpt: String,
  author: ObjectId (ref: 'User', required),
  categories: [ObjectId] (ref: 'Category'),
  tags: [String],
  featuredImage: String (URL),
  status: String (enum: ['draft', 'published', 'archived'], default: 'draft'),
  visibility: String (enum: ['public', 'private', 'password'], default: 'public'),
  password: String (for password-protected posts),
  publishedAt: Date,
  scheduledAt: Date,
  seo: {
    metaTitle: String,
    metaDescription: String,
    focusKeyword: String,
    canonicalUrl: String
  },
  readingTime: Number (estimated minutes),
  views: Number (default: 0),
  likes: Number (default: 0),
  shares: Number (default: 0),
  comments: [{
    author: ObjectId (ref: 'User'),
    content: String,
    isApproved: Boolean (default: false),
    createdAt: Date
  }],
  isCommentEnabled: Boolean (default: true),
  isFeatured: Boolean (default: false),
  createdAt: Date,
  updatedAt: Date
}
```

### 5. Categories Collection

```javascript
{
  _id: ObjectId,
  name: String (required),
  slug: String (unique, required),
  description: String,
  parent: ObjectId (ref: 'Category'), // for hierarchical categories
  image: String (URL),
  color: String (hex color),
  isActive: Boolean (default: true),
  sortOrder: Number (default: 0),
  seo: {
    metaTitle: String,
    metaDescription: String
  },
  postCount: Number (default: 0), // cached count
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🎯 Quiz Domain Collections

### 6. Quizzes Collection

```javascript
{
  _id: ObjectId,
  title: String (required),
  description: String,
  instructor: ObjectId (ref: 'User', required),
  category: ObjectId (ref: 'Category'),
  difficulty: String (enum: ['beginner', 'intermediate', 'advanced']),
  estimatedTime: Number (minutes),
  passingScore: Number (percentage, default: 70),
  maxAttempts: Number (default: 3),
  isActive: Boolean (default: true),
  isPublic: Boolean (default: true),
  allowReview: Boolean (default: true),
  shuffleQuestions: Boolean (default: false),
  showCorrectAnswers: Boolean (default: true),
  timeLimit: Number (minutes, null for unlimited),
  instructions: String,
  questions: [ObjectId] (ref: 'Question'),
  tags: [String],
  totalQuestions: Number,
  totalAttempts: Number (default: 0),
  averageScore: Number (default: 0),
  createdAt: Date,
  updatedAt: Date
}
```

### 7. Questions Collection

```javascript
{
  _id: ObjectId,
  quiz: ObjectId (ref: 'Quiz', required),
  type: String (enum: ['multiple-choice', 'true-false', 'short-answer', 'essay'], required),
  question: String (required),
  explanation: String,
  points: Number (default: 1),
  order: Number (required),
  options: [{
    text: String,
    isCorrect: Boolean,
    explanation: String
  }], // for multiple-choice questions
  correctAnswer: String, // for true-false and short-answer
  keywords: [String], // for grading short-answer questions
  media: {
    image: String (URL),
    video: String (URL),
    audio: String (URL)
  },
  difficulty: String (enum: ['easy', 'medium', 'hard']),
  timeLimit: Number (seconds),
  isActive: Boolean (default: true),
  createdAt: Date,
  updatedAt: Date
}
```

### 8. QuizAttempts Collection

```javascript
{
  _id: ObjectId,
  quiz: ObjectId (ref: 'Quiz', required),
  student: ObjectId (ref: 'User', required),
  attemptNumber: Number (required),
  answers: [{
    question: ObjectId (ref: 'Question'),
    answer: String, // selected option or text answer
    isCorrect: Boolean,
    points: Number,
    timeSpent: Number (seconds)
  }],
  score: Number (percentage),
  totalPoints: Number,
  earnedPoints: Number,
  timeSpent: Number (total seconds),
  startedAt: Date,
  submittedAt: Date,
  status: String (enum: ['in-progress', 'completed', 'abandoned'], default: 'in-progress'),
  createdAt: Date,
  updatedAt: Date
}
```

---

## 📸 Media Domain Collections

### 9. MediaFiles Collection

```javascript
{
  _id: ObjectId,
  originalName: String (required),
  fileName: String (required),
  mimeType: String (required),
  size: Number (bytes, required),
  path: String (file path, required),
  url: String (public URL, required),
  uploadedBy: ObjectId (ref: 'User', required),
  fileType: String (enum: ['image', 'video', 'audio', 'document', 'other']),
  dimensions: {
    width: Number,
    height: Number
  }, // for images and videos
  duration: Number, // for audio and video (seconds)
  thumbnails: [{
    size: String, // small, medium, large
    url: String,
    width: Number,
    height: Number
  }], // for images and videos
  metadata: {
    exif: Object, // EXIF data for images
    encoding: String, // for videos
    bitrate: Number, // for audio/video
    fps: Number // for videos
  },
  tags: [String],
  description: String,
  altText: String, // for accessibility
  isPublic: Boolean (default: false),
  usageCount: Number (default: 0),
  createdAt: Date,
  updatedAt: Date
}
```

---

## 📊 Analytics Domain Collections

### 10. UserActivity Collection

```javascript
{
  _id: ObjectId,
  user: ObjectId (ref: 'User', required),
  action: String (required), // login, logout, view_post, take_quiz, etc.
  resource: String, // posts, quiz, users
  resourceId: ObjectId,
  details: Object, // additional context data
  ipAddress: String,
  userAgent: String,
  sessionId: String,
  timestamp: Date (required),
  createdAt: Date
}
```

### 11. ContentAnalytics Collection

```javascript
{
  _id: ObjectId,
  contentType: String (required), // post, quiz, category
  contentId: ObjectId (required),
  date: Date (required), // daily aggregation
  views: Number (default: 0),
  uniqueViews: Number (default: 0),
  likes: Number (default: 0),
  shares: Number (default: 0),
  comments: Number (default: 0),
  timeSpent: Number (total seconds),
  bounceRate: Number (percentage),
  referrers: [{
    source: String,
    count: Number
  }],
  devices: [{
    type: String, // desktop, mobile, tablet
    count: Number
  }],
  countries: [{
    code: String,
    count: Number
  }],
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🔄 Relationships & Indexes

### Key Relationships:

- **Users** ↔ **Roles** (Many-to-Many)
- **Roles** ↔ **Permissions** (Many-to-Many)
- **Posts** ↔ **Categories** (Many-to-Many)
- **Posts** → **Users** (Many-to-One: author)
- **Quizzes** → **Users** (Many-to-One: instructor)
- **Questions** → **Quizzes** (Many-to-One)
- **QuizAttempts** → **Users** & **Quizzes** (Many-to-One each)
- **MediaFiles** → **Users** (Many-to-One: uploader)

### Database Indexes:

```javascript
// Users
db.users.createIndex({ email: 1 }, { unique: true })
db.users.createIndex({ username: 1 }, { unique: true })
db.users.createIndex({ isActive: 1 })

// Posts
db.posts.createIndex({ slug: 1 }, { unique: true })
db.posts.createIndex({ author: 1 })
db.posts.createIndex({ status: 1, publishedAt: -1 })
db.posts.createIndex({ categories: 1 })

// Categories
db.categories.createIndex({ slug: 1 }, { unique: true })
db.categories.createIndex({ parent: 1 })

// Quizzes
db.quizzes.createIndex({ instructor: 1 })
db.quizzes.createIndex({ isActive: 1, isPublic: 1 })

// Quiz Attempts
db.quizattempts.createIndex({ quiz: 1, student: 1 })
db.quizattempts.createIndex({ student: 1, createdAt: -1 })

// Media Files
db.mediafiles.createIndex({ uploadedBy: 1 })
db.mediafiles.createIndex({ fileType: 1 })

// Analytics
db.useractivity.createIndex({ user: 1, timestamp: -1 })
db.contentanalytics.createIndex({ contentType: 1, contentId: 1, date: -1 })
```

---

## 🚀 Next Steps

1. **Create Mongoose Models** - Implement all schemas with validation
2. **Add Model Methods** - Instance and static methods for common operations
3. **Set up Relationships** - Configure populate paths and virtual fields
4. **Create Seeders** - Initial data for roles, permissions, and sample content
5. **Add Validators** - Request validation schemas for all endpoints
