import Foundation
import SwiftData

/// Un événement partagé est visible par toute la famille (RDV commun).
/// Un événement personnel n'est visible que par son créateur (agenda perso),
/// mais reste dans le même magasin de données pour simplifier la synchro.
enum EventVisibility: String, Codable, CaseIterable {
    case shared
    case personal
}

@Model
final class FamilyEvent {
    @Attribute(.unique) var id: UUID
    var title: String
    var startDate: Date
    var endDate: Date
    var isAllDay: Bool
    var recurrenceRawValue: String
    var visibilityRawValue: String
    var notes: String?

    /// Référence à FamilyMember.id — pas de relation SwiftData directe pour
    /// rester léger à synchroniser via CloudKit (les relations complexes
    /// posent plus de contraintes avec NSPersistentCloudKitContainer).
    var ownerID: UUID
    var createdAt: Date

    var recurrence: RecurrenceRule {
        get { RecurrenceRule(rawValue: recurrenceRawValue) ?? .none }
        set { recurrenceRawValue = newValue.rawValue }
    }

    var visibility: EventVisibility {
        get { EventVisibility(rawValue: visibilityRawValue) ?? .shared }
        set { visibilityRawValue = newValue.rawValue }
    }

    init(
        id: UUID = UUID(),
        title: String,
        startDate: Date,
        endDate: Date,
        isAllDay: Bool = false,
        recurrence: RecurrenceRule = .none,
        visibility: EventVisibility = .shared,
        notes: String? = nil,
        ownerID: UUID
    ) {
        self.id = id
        self.title = title
        self.startDate = startDate
        self.endDate = endDate
        self.isAllDay = isAllDay
        self.recurrenceRawValue = recurrence.rawValue
        self.visibilityRawValue = visibility.rawValue
        self.notes = notes
        self.ownerID = ownerID
        self.createdAt = .now
    }
}
