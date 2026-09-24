import Foundation
import UserNotifications

/// Centralise la planification des rappels locaux. Un rappel raté est un
/// échec produit pour cette app, donc on soigne ici :
/// - une notification par occurrence (pas juste "à l'heure H", mais aussi
///   un rappel la veille pour les RDV importants, activable plus tard),
/// - un identifiant stable par item pour pouvoir l'annuler/remplacer proprement
///   quand l'utilisateur modifie ou supprime l'événement/la tâche,
/// - le déclenchement par composants de calendrier (UNCalendarNotificationTrigger)
///   plutôt que par intervalle, pour rester correct après un changement de fuseau
///   horaire ou une heure d'été/hiver.
enum NotificationScheduler {
    static func requestAuthorizationIfNeeded() async {
        let center = UNUserNotificationCenter.current()
        let settings = await center.notificationSettings()
        guard settings.authorizationStatus == .notDetermined else { return }
        _ = try? await center.requestAuthorization(options: [.alert, .sound, .badge])
    }

    /// Planifie un rappel pour un événement à son heure de début.
    static func scheduleEventReminder(eventID: UUID, title: String, at date: Date) async {
        await schedule(
            identifier: identifier(prefix: "event", id: eventID),
            title: title,
            body: "Rendez-vous à \(Self.timeFormatter.string(from: date))",
            fireDate: date
        )
    }

    /// Planifie un rappel pour une tâche à sa date d'échéance (9h par défaut
    /// si seule la date, sans heure précise, a été renseignée).
    static func scheduleTaskReminder(taskID: UUID, title: String, dueDate: Date) async {
        await schedule(
            identifier: identifier(prefix: "task", id: taskID),
            title: "Tâche à faire",
            body: title,
            fireDate: dueDate
        )
    }

    static func cancelReminder(prefix: String, id: UUID) {
        let ids = [identifier(prefix: prefix, id: id)]
        UNUserNotificationCenter.current().removePendingNotificationRequests(withIdentifiers: ids)
    }

    // MARK: - Détail

    private static func schedule(identifier: String, title: String, body: String, fireDate: Date) async {
        guard fireDate > .now else { return }

        let content = UNMutableNotificationContent()
        content.title = title
        content.body = body
        content.sound = .default

        let components = Calendar.current.dateComponents(
            [.year, .month, .day, .hour, .minute],
            from: fireDate
        )
        let trigger = UNCalendarNotificationTrigger(dateMatching: components, repeats: false)
        let request = UNNotificationRequest(identifier: identifier, content: content, trigger: trigger)

        // On retire l'éventuel rappel précédent avant d'en poser un nouveau,
        // pour éviter les doublons quand une date est modifiée.
        UNUserNotificationCenter.current().removePendingNotificationRequests(withIdentifiers: [identifier])
        try? await UNUserNotificationCenter.current().add(request)
    }

    private static func identifier(prefix: String, id: UUID) -> String {
        "\(prefix)-\(id.uuidString)"
    }

    private static let timeFormatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.dateStyle = .none
        formatter.timeStyle = .short
        return formatter
    }()
}
