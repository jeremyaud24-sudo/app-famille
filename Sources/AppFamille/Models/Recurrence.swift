import Foundation

/// Règle de récurrence simple pour le MVP. On couvre les cas les plus fréquents
/// d'une famille (poubelles chaque semaine, loyer chaque mois...) sans viser
/// la complexité complète de RFC 5545 — on pourra l'étendre plus tard si besoin.
enum RecurrenceRule: String, Codable, CaseIterable, Identifiable {
    case none
    case daily
    case weekly
    case monthly
    case yearly

    var id: String { rawValue }

    var label: String {
        switch self {
        case .none: return "Ne se répète pas"
        case .daily: return "Tous les jours"
        case .weekly: return "Toutes les semaines"
        case .monthly: return "Tous les mois"
        case .yearly: return "Tous les ans"
        }
    }

    /// Calcule la prochaine occurrence après `date`, ou nil si la règle est `.none`.
    func nextOccurrence(after date: Date, calendar: Calendar = .current) -> Date? {
        switch self {
        case .none:
            return nil
        case .daily:
            return calendar.date(byAdding: .day, value: 1, to: date)
        case .weekly:
            return calendar.date(byAdding: .weekOfYear, value: 1, to: date)
        case .monthly:
            return calendar.date(byAdding: .month, value: 1, to: date)
        case .yearly:
            return calendar.date(byAdding: .year, value: 1, to: date)
        }
    }
}
