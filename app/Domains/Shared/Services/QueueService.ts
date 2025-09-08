import Queue, { Job, QueueOptions, ProcessCallbackFunction } from 'bull'

interface RedisConfig {
  host: string
  port: number
}

class QueueService<T = any> {
  private queue: Queue.Queue<T>

  constructor(
    private queueName: string,
    redisConfig: RedisConfig = { host: '127.0.0.1', port: 6379 }
  ) {
    this.queue = new Queue<T>(queueName, { redis: redisConfig })
  }

  async addJob(data: T, options: QueueOptions = {}): Promise<Job<T>> {
    try {
      const job = await this.queue.add(data, options)
      console.log(`Job added to queue "${this.queueName}"`, job.id)
      return job
    } catch (error) {
      console.error(`Failed to add job to queue "${this.queueName}"`, error)
      throw error
    }
  }

  processJob(concurrency: number, processor: ProcessCallbackFunction<T>): void {
    this.queue.process(concurrency, processor)
    console.log(`Queue "${this.queueName}" is processing jobs with concurrency: ${concurrency}`)
  }

  async closeQueue(): Promise<void> {
    try {
      await this.queue.close()
      console.log(`Queue "${this.queueName}" has been closed.`)
    } catch (error) {
      console.error(`Failed to close queue "${this.queueName}"`, error)
      throw error
    }
  }

  async cleanQueue(
    type: 'completed' | 'failed' = 'completed',
    grace: number = 5000
  ): Promise<void> {
    try {
      const jobs = await this.queue.clean(grace, type)
      console.log(`Cleaned ${jobs.length} ${type} jobs from queue "${this.queueName}".`)
    } catch (error) {
      console.error(`Failed to clean ${type} jobs from queue "${this.queueName}"`, error)
      throw error
    }
  }

  on(event: string, callback: (...args: any[]) => void): void {
    this.queue.on(event, callback)
  }
}

export default QueueService
