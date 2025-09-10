import { Job } from '@rlanz/bull-queue'
import { GoogleGenAI, Type } from '@google/genai'

interface RegisterStripeCustomerPayload {
  userId: string
  data: any
}

export default class RegisterStripeCustomer extends Job {
  static get $$filepath() {
    return import.meta.url
  }

  public async handle(payload: RegisterStripeCustomerPayload) {
    this.setPromptForModalGemini(payload)
    console.log('RegisterStripeCustomer job started with payload:', payload)
  }

  public async rescue(payload: RegisterStripeCustomerPayload, error: Error) {
    console.error('Failed to register Stripe customer for user:', payload.userId, 'Error:', error)
  }

  private async setPromptForModalGemini(payload: RegisterStripeCustomerPayload) {
    try {
      const ai = new GoogleGenAI({ apiKey: 'AIzaSyDLaS8vN5gFdStPgP31jWSUj5eLQ17kW8M' })
      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents:
          '(Tiếng việt): Tạo cho em 10 câu hỏi trắc nghiệm về toán lớp 8, mỗi câu có 4 đáp án, chỉ rõ đáp án đúng. Định dạng kết quả trả về là JSON theo cấu trúc: [{ "questions": [ { "title": "Câu hỏi?", "difficulty": "easy|medium|hard", "content": "Nội dung câu hỏi", "type": "single_choice|multiple_choice|true_false|fill_blank", "answers": [ { "text": "Đáp án 1", "isCorrect": true|false, "explanation": "Giải thích đáp án" }, ... ], "points": 10 }, ... ] }]',
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                questions: {
                  type: Type.ARRAY,
                  description: 'Danh sách 10 câu hỏi trắc nghiệm',
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      title: { type: Type.STRING },
                      difficulty: { type: Type.STRING, enum: ['easy', 'medium', 'hard'] },
                      content: { type: Type.STRING },
                      type: {
                        type: Type.STRING,
                        enum: ['single_choice', 'multiple_choice', 'true_false', 'fill_blank'],
                        description: 'Loại câu hỏi',
                      },
                      answers: {
                        type: Type.ARRAY,
                        items: {
                          type: Type.OBJECT,
                          properties: {
                            text: { type: Type.STRING },
                            isCorrect: { type: Type.BOOLEAN },
                            explanation: { type: Type.STRING },
                          },
                          required: ['text', 'isCorrect'],
                        },
                      },
                      points: { type: Type.NUMBER },
                    },
                    required: ['title', 'type', 'content', 'difficulty', 'answers', 'points'],
                  },
                },
              },
              propertyOrdering: ['questions'],
            },
          },
        },
      })
      console.log(response.text)
    } catch (error) {
      if ((error as any).code === 429) {
        console.error('Quota exceeded: too many requests. Thử lại sau hoặc check quota.')
      } else {
        console.error('Error generating quiz with AI:', error)
      }
      // Handle error (e.g., send a notification, retry, etc.)
    }
  }
}
