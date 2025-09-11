import { Job } from '@rlanz/bull-queue'
import { GoogleGenAI, Type } from '@google/genai'
import QuizService from '#domains/Quiz/Services/QuizService'
import GenerateQuizHistory from '#domains/Quiz/Models/GenerateQuizzHistory'

interface RegisterStripeCustomerPayload {
  userId: string
  data: any
}

export default class RegisterStripeCustomer extends Job {
  static get $$filepath() {
    return import.meta.url
  }

  public async handle(payload: RegisterStripeCustomerPayload) {
    await this.setPromptForModalGemini(payload)
  }

  public async rescue(payload: RegisterStripeCustomerPayload, error: Error) {
    console.error('Failed to register Stripe customer for user:', payload.userId, 'Error:', error)
  }

  private async setPromptForModalGemini(payload: RegisterStripeCustomerPayload) {
    let dataDb = null;
    try {
      const ai = new GoogleGenAI({ apiKey: 'AIzaSyDLaS8vN5gFdStPgP31jWSUj5eLQ17kW8M' })
      const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents:
          `
          Mỗi lần tạo phải sinh ra các câu hỏi KHÁC NHAU, Hãy tạo cho tôi một bộ câu hỏi trắc nghiệm theo các yêu cầu sau:  
          - Chủ đề: ${payload.data.subject}  
          - Tổng số câu hỏi: ${payload.data.totalQuestions}  
          - Số câu dễ: ${payload.data.easyQuestions}, số câu trung bình: ${payload.data.mediumQuestions}, số câu khó: ${payload.data.hardQuestions}  
          - Tổng số điểm: ${payload.data.totalPoints} (tổng điểm của tất cả câu hỏi phải chính xác bằng ${payload.data.totalPoints})  
          - Điểm số phân bổ theo độ khó (ví dụ easy = 5, medium = 7, hard = 10), nhưng phải cộng lại đúng ${payload.data.totalPoints}.  
          Quy tắc bắt buộc: 
          1 Độ khó bao gồm: 'easy', 'medium', 'hard'.  
          2 Loại câu hỏi bao gồm: 'single_choice', 'multiple_choice', 'true_false', 'fill_blank'.  
          3 Tổng điểm tối đa: ${payload.data.totalPoints}, điểm của mỗi câu phụ thuộc độ khó.  
          4 Nội dung câu hỏi và đáp án phải rõ ràng, dễ hiểu, không được quá ngắn hay quá dài.  
          5 Câu hỏi có thể bao gồm hình ảnh (dạng base64 hoặc link), công thức toán học, biểu đồ, sơ đồ... nếu cần thiết.  
          6 Đáp án phải cụ thể, rõ ràng, không được quá ngắn hay quá dài.  
          7 Câu hỏi loại 'multiple_choice' phải có ít nhất 2 đáp án đúng.  
          8 Câu hỏi loại 'true_false' chỉ có 2 đáp án là True và False.
          9 Mỗi câu có ít nhất 2 đáp án và có ít nhất 1 đáp đúng, cần chỉ rõ đáp án đúng.
          10 Định dạng kết quả trả về là JSON theo cấu trúc: [{ "questions": [ { "title": "Câu hỏi?", "difficulty": "easy|medium|hard", "content": "Nội dung câu hỏi", "type": "single_choice|multiple_choice|true_false|fill_blank", "answers": [ { "text": "Đáp án 1", "isCorrect": true|false, "explanation": "Giải thích đáp án" }, ... ], "points": 10 }, ... ] }]
          11 Chỉ trả về đúng định dạng JSON, không thêm bất kỳ chú thích hay văn bản nào khác ngoài JSON.`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                points: { type: Type.NUMBER, description: 'Tổng điểm của các câu hỏi' },
                questions: {
                  type: Type.ARRAY,
                  description: `Danh sách ${payload.data.totalQuestions} câu hỏi trắc nghiệm`,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      title: { type: Type.STRING, description: 'Trong trường title chỉ (ngắn gọn, súc tich) KHÔNG quá 80 ký tự, KHÔNG thêm số thứ tự hay chữ ‘Câu ...’. Số thứ tự sẽ được quản lý riêng.”' },
                      difficulty: { type: Type.STRING, enum: ['easy', 'medium', 'hard'] },
                      content: { type: Type.STRING, description: 'Nội dung câu hỏi là ở trường này, có thể bao gồm hình ảnh (base64 hoặc link), công thức toán học, biểu đồ, sơ đồ...' },
                      type: {
                        type: Type.STRING,
                        enum: ['single_choice', 'multiple_choice', 'true_false', 'fill_blank'],
                        description: 'Loại câu hỏi, loại câu hỏi multiple_choice thì phải có nhiều đáp án đúng có ít nhất là 2 đáp án đúng',
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
                      points: { type: Type.NUMBER, description: `Điểm của câu hỏi, phụ thuộc vào độ khó, Tổng điểm của các câu hỏi phải bằng ${payload.data.totalPoints}.` },
                    },
                    required: ['title', 'type', 'content', 'difficulty', 'answers', 'points'],
                  },
                },
              },
              propertyOrdering: ['questions', 'points'],
            },
          },
        },
      })

      if (!response.text) {
        return;
      }

      dataDb = response.text;

      const dataRequestSave = {
        ...payload.data,
        questions: JSON.parse(response.text)[0].questions,
      }

      await QuizService.saveAiGeneratedQuiz(dataRequestSave)
      // save log
      await GenerateQuizHistory.updateOne(
        { _id: payload.data.historyId },
        {
          $set: {
            status: 'completed',
            data_ai: response.text,
            updatedAt: new Date(),
          },
        }
      ).exec()

      console.log('AI generated quiz saved successfully.') // Debug log;
    } catch (error) {
      await GenerateQuizHistory.updateOne(
        { _id: payload.data.historyId },
        {
          $set: {
            status: 'failed',
            data_ai: dataDb,
            data_error: JSON.stringify(error),
            updatedAt: new Date(),
          },
        }
      ).exec()
      if ((error as any).code === 429) {
        console.error('Quota exceeded: too many requests. Thử lại sau hoặc check quota.')
      } else {
        console.error('Error generating quiz with AI:', error)
      }
    }
  }
}
