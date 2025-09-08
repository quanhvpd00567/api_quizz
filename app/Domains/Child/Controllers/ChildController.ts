import ChildService from '#domains/Child/Services/ChildService'
import type { HttpContext } from '@adonisjs/core/http'
import axios from 'axios'
import fs from 'node:fs'

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

  public async testAi() {
    const text = fs.readFileSync('app/Domains/Child/data.txt', 'utf8')
    const data = JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: text,
            },
          ],
        },
      ],
    })

    const config = {
      method: 'post',
      url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
      headers: {
        'Content-Type': 'application/json',
        'X-goog-api-key': 'AIzaSyDLaS8vN5gFdStPgP31jWSUj5eLQ17kW8M',
      },
      data: data,
    }

    try {
      const response = await axios(config)
      const result = response.data.candidates[0].content.parts[0].text
      let cleaned = result.replace(/^```json\s*/, '').replace(/```$/, '')
      let fixed = cleaned.replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":')

      console.log(JSON.parse(fixed))
    } catch (error) {
      console.log(error)
    }
  }
}
