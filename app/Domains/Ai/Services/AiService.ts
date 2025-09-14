import GenerateQuizzHistory from '#domains/Quiz/Models/GenerateQuizzHistory'

export default class AiService {
  /**
   * Truy vấn danh sách tiến trình AI
   */
  static async queryProcess(filters: any, user: any): Promise<any> {
    const { page = 1, limit = 10, subject = '', status = '', model = '' } = filters
    const query: any = {}
    if (subject) query.subject = subject
    if (status) query.status = status
    if (model) query.model = model
    // filter by title
    if (filters.search) {
      query.title = { $regex: filters.search, $options: 'i' }
    }

    // if user is admin, show all
    // if user is teacher, show only their own

    if (user.role === 'parent') {
      query.user = user._id
    }

    const options = {
      page: Number(page),
      limit: Number(limit),
      sort: { createdAt: -1 },
      collation: {
        locale: 'en',
      },
    }

    const result = await GenerateQuizzHistory.paginate(query, options)

    return {
      data: result.docs,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.totalDocs,
        totalPages: result.totalPages,
      },
    }
  }
}
