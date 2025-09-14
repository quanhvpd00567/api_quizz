import scheduler from 'adonisjs-scheduler/services/main'
import PurgeUsers from '#commands/PurgeUsers'

// scheduler.command('inspire').everyFiveSeconds()
scheduler.command(PurgeUsers).everyMinute().withoutOverlapping()
