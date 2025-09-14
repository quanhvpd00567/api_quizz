import cron from 'node-cron'

// schedule chayj 1 phut 1 lan
cron.schedule('* * * * *', () => {
  console.log('running a task every minute')
})
