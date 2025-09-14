import type { HttpContext } from '@adonisjs/core/http'
import AiService from '#domains/Ai/Services/AiService'

export default class AiController {
  /**
   * Lấy danh sách tiến trình sinh đề bằng AI
   * GET /ai/generate-process
   */
  async list({ request, response, auth }: HttpContext) {
    try {
      const filters = request.qs()
      const user = auth?.user
      const result = await AiService.queryProcess(filters, user)
      return response.ok({
        status: 'success',
        data: result.data,
        pagination: result.pagination,
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      console.error('Get AI process list error:', error)
      return response.status(500).json({
        status: 'error',
        message: 'Failed to get AI process list',
        timestamp: new Date().toISOString(),
      })
    }
  }
}
