/**
 * Rappels locaux, phase 1 (sans backend).
 *
 * Limitation importante à connaître : l'API Notification ne peut déclencher
 * une alerte à une date future que si l'app reste ouverte (ou l'onglet actif)
 * jusqu'à cette date-là — un iPhone qui verrouille l'écran ou ferme l'app
 * peut couper le minuteur. C'est suffisant pour tester le concept, mais ce
 * n'est PAS le "rappel fiable même en arrière-plan" qu'on vise pour de vrai :
 * ça demande un petit serveur de notifications push (Web Push / VAPID),
 * prévu en phase 2 (voir README).
 */

const pendingTimers = new Map<string, ReturnType<typeof setTimeout>>()

export async function requestNotificationPermission(): Promise<void> {
  if (!('Notification' in window)) return
  if (Notification.permission === 'default') {
    await Notification.requestPermission()
  }
}

function schedule(id: string, title: string, body: string, at: Date): void {
  cancel(id)

  const delay = at.getTime() - Date.now()
  if (delay <= 0) return

  // setTimeout est limité à ~24.8 jours (Int32) ; on ne planifie donc que ce
  // qui tient dans cette fenêtre pour rester correct plutôt que silencieux.
  const MAX_DELAY = 2_147_483_647
  if (delay > MAX_DELAY) return

  const timer = setTimeout(() => {
    pendingTimers.delete(id)
    if (Notification.permission === 'granted') {
      new Notification(title, { body })
    }
  }, delay)

  pendingTimers.set(id, timer)
}

function cancel(id: string): void {
  const existing = pendingTimers.get(id)
  if (existing) {
    clearTimeout(existing)
    pendingTimers.delete(id)
  }
}

export function scheduleEventReminder(eventId: string, title: string, startDate: Date): void {
  const time = startDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  schedule(`event-${eventId}`, title, `Rendez-vous à ${time}`, startDate)
}

export function cancelEventReminder(eventId: string): void {
  cancel(`event-${eventId}`)
}

export function scheduleTaskReminder(taskId: string, title: string, dueDate: Date): void {
  schedule(`task-${taskId}`, 'Tâche à faire', title, dueDate)
}

export function cancelTaskReminder(taskId: string): void {
  cancel(`task-${taskId}`)
}
