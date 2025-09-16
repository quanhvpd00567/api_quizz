import ChildService from '#domains/Child/Services/ChildService'
import type { HttpContext } from '@adonisjs/core/http'

export default class ChildController {
  async getChildren({ response, auth }: HttpContext) {
    try {
      const parentId = auth && auth.user.id
      const children = await ChildService.getChildrenByParentId(parentId)
      return response.ok({
        status: 'success',
        data: { children },
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      return response.status(500).json({
        success: false,
        message: 'Failed to fetch children',
      })
    }
  }

  async addChild({ request, response, auth }: HttpContext) {
    try {
      const parentId = auth && auth.user.id
      const { email, username, firstName, lastName, password } = request.only([
        'email',
        'username',
        'firstName',
        'lastName',
        'password',
      ])

      // Kiểm tra nếu email hoặc username đã tồn tại
      const existingUser = await ChildService.findUserByEmailOrUsername(email, username)
      if (existingUser) {
        return response.status(400).json({
          success: false,
          message: 'Email hoặc username đã tồn tại',
        })
      }
      const newChild = await ChildService.createChild({
        parentId,
        email,
        username,
        firstName,
        lastName,
        password,
      })
      return response.created({
        status: 'success',
        data: { child: newChild },
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      console.error('Error adding child:', error)
      return response.status(500).json({
        success: false,
        message: 'Đã xảy ra lỗi khi thêm trẻ em',
      })
    }
  }

  async updateChild({ params, request, response, auth }: HttpContext) {
    try {
      const parentId = auth && auth.user.id
      const childId = params.id
      const { email, firstName, lastName, password, isActive } = request.only([
        'email',
        'firstName',
        'lastName',
        'password',
        'isActive',
      ])

      // Kiểm tra nếu email đã tồn tại cho người dùng khác
      const existingUser = await ChildService.findUserByEmail(email)
      if (existingUser && existingUser.id !== childId) {
        return response.status(400).json({
          success: false,
          message: 'Email đã tồn tại',
        })
      }

      const updatedChild = await ChildService.updateChild(childId, parentId, {
        email,
        firstName,
        lastName,
        password,
        isActive,
      })

      if (!updatedChild) {
        return response.status(404).json({
          success: false,
          message: 'Trẻ em không tồn tại hoặc bạn không có quyền cập nhật',
        })
      }

      return response.ok({
        status: 'success',
        data: { child: updatedChild },
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      console.error('Error updating child:', error)
      return response.status(500).json({
        success: false,
        message: 'Đã xảy ra lỗi khi cập nhật trẻ em',
      })
    }
  }

  async getChildResults({ params, request, response, auth }: HttpContext) {
    try {
      const parentId = auth && auth.user.id
      const childId = params.id
      const { page, limit, search } = request.qs()

      const filters = {
        page: page ? Number.parseInt(page, 10) : 1,
        limit: limit ? Number.parseInt(limit, 10) : 10,
        search: search || '',
      }

      // Verify that the child belongs to the authenticated parent
      const child = await ChildService.getChildByIdAndParentId(childId, parentId)
      if (!child) {
        return response.status(404).json({
          success: false,
          message: 'Trẻ em không tồn tại hoặc bạn không có quyền truy cập',
        })
      }

      const results = await ChildService.getChildResults(childId, filters)
      return response.ok({
        status: 'success',
        data: { ...results, childName: `${child.firstName} ${child.lastName}` },
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      console.error('Error fetching child results:', error)
      return response.status(500).json({
        success: false,
        message: 'Đã xảy ra lỗi khi lấy kết quả của trẻ em',
      })
    }
  }
}
