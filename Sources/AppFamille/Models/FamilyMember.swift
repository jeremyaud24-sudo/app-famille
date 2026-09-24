import Foundation
import SwiftData

/// Le rôle détermine ce qu'un membre peut faire dans l'app.
/// - parent: peut créer/modifier tout événement ou tâche, gérer les membres.
/// - enfant: peut voir tout, cocher ses propres tâches, mais pas modifier l'agenda des autres.
/// - invite: accès en lecture seule (ex: baby-sitter, grand-parent de passage).
enum FamilyRole: String, Codable, CaseIterable, Identifiable {
    case parent
    case enfant
    case invite

    var id: String { rawValue }

    var label: String {
        switch self {
        case .parent: return "Parent"
        case .enfant: return "Enfant"
        case .invite: return "Invité"
        }
    }

    var canEditSharedItems: Bool {
        self == .parent
    }
}

@Model
final class FamilyMember {
    /// Identifiant stable, utilisé aussi comme référence CloudKit (recordName).
    @Attribute(.unique) var id: UUID
    var name: String
    var roleRawValue: String
    /// Couleur d'affichage (hex, ex: "#4A90D9") pour distinguer chaque membre dans le calendrier.
    var colorHex: String

    var role: FamilyRole {
        get { FamilyRole(rawValue: roleRawValue) ?? .invite }
        set { roleRawValue = newValue.rawValue }
    }

    init(id: UUID = UUID(), name: String, role: FamilyRole, colorHex: String = "#4A90D9") {
        self.id = id
        self.name = name
        self.roleRawValue = role.rawValue
        self.colorHex = colorHex
    }
}
