import User from '#domains/Auth/Models/User'

class ChildService {
  public static async getChildrenByParentId(parentId: string): Promise<any[]> {
    try {
      return await User.find({ parent: parentId, role: 'student' }).select(
        'id email username lastName firstName isActive createdAt updatedAt'
      )
    } catch (error) {
      console.error('Error fetching children by parent ID:', error)
      throw new Error('Failed to fetch children')
    }
  }
}

export default ChildService
