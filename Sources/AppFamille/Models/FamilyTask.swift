import Foundation
import SwiftData

@Model
final class FamilyTask {
    @Attribute(.unique) var id: UUID
    var title: String
    var dueDate: Date?
    var recurrenceRawValue: String
    var isCompleted: Bool
    var notes: String?
    var createdAt: Date

    /// FamilyMember.id de la personne assignée. Nil = tâche non assignée,
    /// visible par tous en attente d'être prise en charge.
    var assignedToID: UUID?
    var createdByID: UUID

    var recurrence: RecurrenceRule {
        get { RecurrenceRule(rawValue: recurrenceRawValue) ?? .none }
        set { recurrenceRawValue = newValue.rawValue }
    }

    init(
        id: UUID = UUID(),
        title: String,
        dueDate: Date? = nil,
        recurrence: RecurrenceRule = .none,
        assignedToID: UUID? = nil,
        createdByID: UUID,
        notes: String? = nil
    ) {
        self.id = id
        self.title = title
        self.dueDate = dueDate
        self.recurrenceRawValue = recurrence.rawValue
        self.isCompleted = false
        self.notes = notes
        self.assignedToID = assignedToID
        self.createdByID = createdByID
        self.createdAt = .now
    }

    /// Quand une tâche récurrente est cochée, on la remet à zéro pour la
    /// prochaine échéance plutôt que de la marquer terminée définitivement —
    /// c'est ce qu'on attend d'une corvée qui revient chaque semaine.
    func completeAndReschedule(calendar: Calendar = .current) {
        guard let currentDue = dueDate, let next = recurrence.nextOccurrence(after: currentDue, calendar: calendar) else {
            isCompleted = true
            return
        }
        dueDate = next
        isCompleted = false
    }
}
