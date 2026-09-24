import SwiftUI
import SwiftData

struct MembersView: View {
    @Query(sort: \FamilyMember.name) private var members: [FamilyMember]
    @Environment(\.modelContext) private var modelContext
    @State private var isPresentingNewMember = false

    var body: some View {
        NavigationStack {
            List {
                ForEach(members) { member in
                    HStack {
                        Circle()
                            .fill(Color(hex: member.colorHex))
                            .frame(width: 14, height: 14)
                        Text(member.name)
                        Spacer()
                        Text(member.role.label)
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }
                .onDelete(perform: deleteMembers)
            }
            .navigationTitle("Famille")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        isPresentingNewMember = true
                    } label: {
                        Label("Ajouter un membre", systemImage: "plus")
                    }
                }
            }
            .sheet(isPresented: $isPresentingNewMember) {
                NewMemberView()
            }
        }
    }

    private func deleteMembers(at offsets: IndexSet) {
        for index in offsets {
            modelContext.delete(members[index])
        }
    }
}

private struct NewMemberView: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(\.modelContext) private var modelContext

    @State private var name = ""
    @State private var role: FamilyRole = .enfant

    private static let palette = ["#4A90D9", "#E27D60", "#85C1A5", "#C38DD9", "#E8B84B"]

    var body: some View {
        NavigationStack {
            Form {
                TextField("Prénom", text: $name)
                Picker("Rôle", selection: $role) {
                    ForEach(FamilyRole.allCases) { role in
                        Text(role.label).tag(role)
                    }
                }
            }
            .navigationTitle("Nouveau membre")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Annuler") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Ajouter") {
                        let color = Self.palette.randomElement() ?? "#4A90D9"
                        modelContext.insert(FamilyMember(name: name, role: role, colorHex: color))
                        dismiss()
                    }
                    .disabled(name.trimmingCharacters(in: .whitespaces).isEmpty)
                }
            }
        }
    }
}

private extension Color {
    /// Convertit "#RRGGBB" en Color. Retombe sur .accentColor si le format
    /// est invalide, pour ne jamais planter l'affichage sur une donnée
    /// mal formée (ex: venue d'une future synchro CloudKit imparfaite).
    init(hex: String) {
        var sanitized = hex.trimmingCharacters(in: .whitespacesAndNewlines)
        sanitized.removeAll { $0 == "#" }

        guard sanitized.count == 6, let value = UInt64(sanitized, radix: 16) else {
            self = .accentColor
            return
        }

        let r = Double((value >> 16) & 0xFF) / 255
        let g = Double((value >> 8) & 0xFF) / 255
        let b = Double(value & 0xFF) / 255
        self = Color(red: r, green: g, blue: b)
    }
}

#Preview {
    MembersView()
        .modelContainer(for: [FamilyMember.self, FamilyEvent.self, FamilyTask.self], inMemory: true)
}
