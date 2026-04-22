export interface IQueueService {
  /**
   * Adds a job to a named queue.
   * @param queueName The name of the queue (e.g., 'default', 'emails')
   * @param jobName The name of the job/task (e.g., 'send-otp')
   * @param data The payload for the job
   */
  addJob(queueName: string, jobName: string, data: any): Promise<void>;
}
