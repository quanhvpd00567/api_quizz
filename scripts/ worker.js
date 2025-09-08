// worker.mjs
import Queue from 'bull';
import axios from 'axios';
import fs from 'fs';

const myQueue = new Queue('quiz-generation-queue', {
  redis: { host: '127.0.0.1', port: 6379 }
});

myQueue.process(async (job) => {
  if (job.data.action === 'generateQuiz') {
    return await testAi(job.data.data);
  }
  return { status: 'done' };
});

// Xử lý lỗi
myQueue.on('failed', (job, err) => {
  console.error(`Job ${job.id} failed với lỗi: ${err.message}`);
});

// xử lý thành công
myQueue.on('completed', async (job, result) => {
  if (!result) return;
  if (job.data.action === 'generateQuiz') {
    console.log(`Job ${job.id} completed`);
    // call api to save result to database
    const config = {
      method: 'post',
      url: 'http://localhost:3333/api/v1/quizzes/ai-save',
      headers: {
        'Content-Type': 'application/json',
      },
      data: {
        questions: result,
        ...job.data.data
      },
    }

    try {
      // call api k cần response
      axios(config)
    } catch (error) {
      console.log(error)
    }
  };
});

// xử lý tiến trình
myQueue.on('progress', (job, progress) => {
  console.log(`Job ${job.id} tiến trình: ${progress}%`);
});

async function testAi(dataSettings) {
  let text = fs.readFileSync('app/Domains/Child/data.txt', 'utf8')
  text = text.replace('{chu_de}', dataSettings.subject)
  text = text.replace('{total_question}', dataSettings.totalQuestions)
  text = text.replace('{total_easy}', dataSettings.easyQuestions)
  text = text.replace('{total_medium}', dataSettings.mediumQuestions)
  text = text.replace('{total_hard}', dataSettings.hardQuestions)
  text = text.replace('{total_ports}', dataSettings.totalPoints)

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
    return JSON.parse(fixed)
  } catch (error) {
    console.log(error)
  }
}