import User from '#domains/Auth/Models/User'
import bcrypt from 'bcryptjs'
import StudentQuiz from '#domains/Quiz/Models/StudentQuiz'
import Quiz from '#domains/Quiz/Models/Quiz'
import StudentQuizHistory from '#domains/Quiz/Models/StudentQuizHistory'
import mongoose from 'mongoose'

class ChildService {
  public static async getChildrenByParentId(parentId: string): Promise<any[]> {
    try {
      return await User.find({ parent: parentId, role: 'student' }).select(
        'id email username lastName firstName isActive createdAt updatedAt'
      )
    } catch (error) {
      return []
    }
  }

  public static async findUserByEmailOrUsername(
    email: string,
    username: string
  ): Promise<any | null> {
    try {
      return await User.findOne({
        $or: [{ email }, { username }],
      })
    } catch (error) {
      throw new Error('Failed to find user')
    }
  }

  public static async createChild(data: {
    parentId: string
    email: string
    username: string
    firstName: string
    lastName: string
    password: string
  }): Promise<any> {
    try {
      console.log('Creating child user with data:', data) // Debug log
      const newChild = new User({
        parent: data.parentId,
        email: data.email,
        username: data.username,
        firstName: data.firstName,
        lastName: data.lastName,
        password: await bcrypt.hash(data.password, 12),
        role: 'student',
        isActive: true,
      })
      await newChild.save()
      return {
        id: newChild.id,
        email: newChild.email,
        username: newChild.username,
        firstName: newChild.firstName,
        lastName: newChild.lastName,
        isActive: newChild.isActive,
        createdAt: newChild.createdAt,
        updatedAt: newChild.updatedAt,
      }
    } catch (error) {
      console.error('Error creating child user:', error)
      throw new Error('Failed to create child user')
    }
  }

  public static async findUserByEmail(email: string): Promise<any | null> {
    try {
      return await User.findOne({ email })
    } catch (error) {
      throw new Error('Failed to find user')
    }
  }

  public static async updateChild(
    childId: string,
    parentId: string,
    updateData: {
      email?: string
      firstName?: string
      lastName?: string
      password?: string
      isActive?: boolean
    }
  ): Promise<any | null> {
    try {
      const child = await User.findOne({ _id: childId, parent: parentId, role: 'student' })
      if (!child) {
        throw new Error('Con của bạn không tồn tại')
      }

      if (updateData.email) child.email = updateData.email
      if (updateData.firstName) child.firstName = updateData.firstName
      if (updateData.lastName) child.lastName = updateData.lastName
      if (typeof updateData.isActive === 'boolean') child.isActive = updateData.isActive
      if (updateData.password) {
        child.password = await bcrypt.hash(updateData.password, 12)
      }

      await child.save()
      return {
        id: child.id,
        email: child.email,
        username: child.username,
        firstName: child.firstName,
        lastName: child.lastName,
        isActive: child.isActive,
        createdAt: child.createdAt,
        updatedAt: child.updatedAt,
      }
    } catch (error) {
      console.error('Error updating child:', error)
      throw new Error('Failed to update child')
    }
  }

  public static async getChildResults(
    childId: string,
    filters: { page: number; limit: number; search?: string }
  ): Promise<any> {
    try {
      const options = {
        sort: { createdAt: -1 },
        lean: true,
        limit: filters.limit || 10,
        page: filters.page || 1,
        populate: [
          { path: 'quizz', model: Quiz, select: 'title subject totalPoints' },
          { path: 'last_history', model: StudentQuizHistory },
        ],
      }

      const aggregate = StudentQuiz.aggregate([
        {
          $lookup: {
            from: 'quizzes',
            localField: 'quizz',
            foreignField: '_id',
            as: 'quizzInfo',
          },
        },
        { $unwind: '$quizzInfo' },
        {
          $lookup: {
            from: 'studentquizhistories',
            localField: 'last_history',
            foreignField: '_id',
            as: 'lastHistoryInfo',
          },
        },
        { $unwind: { path: '$lastHistoryInfo', preserveNullAndEmptyArrays: true } },
        {
          $match: {
            'student': new mongoose.Types.ObjectId(childId),
            'quizzInfo.title': { $regex: filters.search, $options: 'i' },
          },
        },
        {
          $project: {
            _id: 1,
            createdAt: 1,
            updatedAt: 1,
            status: 1,
            score: 1,
            totalPoints: 1,
            number_of_attempts: 1,
            student: 1,
            last_history: '$lastHistoryInfo',
            quizz: '$quizzInfo',
            title: '$quizzInfo.title',
          },
        },
      ])

      const paginatedResults = await (StudentQuiz as any).aggregatePaginate(aggregate, options)
      return {
        results: paginatedResults.docs,
        total: paginatedResults.totalDocs,
        limit: paginatedResults.limit,
        page: paginatedResults.page,
        totalPages: paginatedResults.totalPages,
        // xxxxx,
      }
    } catch (error) {
      return []
    }
  }

  public static async getChildByIdAndParentId(
    childId: string,
    parentId: string
  ): Promise<any | null> {
    try {
      return await User.findOne({ _id: childId, parent: parentId, role: 'student' }).select(
        'id email username lastName firstName isActive createdAt updatedAt'
      )
    } catch (error) {
      return null
    }
  }
}

export default ChildService
