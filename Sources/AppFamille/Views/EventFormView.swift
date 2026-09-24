import SwiftUI
import SwiftData

struct EventFormView: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(\.modelContext) private var modelContext
    @Query private var members: [FamilyMember]

    @State private var title = ""
    @State private var startDate = Date()
    @State private var endDate = Date().addingTimeInterval(3600)
    @State private var isAllDay = false
    @State private var recurrence: RecurrenceRule = .none
    @State private var visibility: EventVisibility = .shared

    var body: some View {
        NavigationStack {
            Form {
                Section("Rendez-vous") {
                    TextField("Titre", text: $title)
                    Toggle("Journée entière", isOn: $isAllDay)
                    DatePicker("Début", selection: $startDate, displayedComponents: isAllDay ? [.date] : [.date, .hourAndMinute])
                    DatePicker("Fin", selection: $endDate, displayedComponents: isAllDay ? [.date] : [.date, .hourAndMinute])
                }

                Section("Récurrence") {
                    Picker("Se répète", selection: $recurrence) {
                        ForEach(RecurrenceRule.allCases) { rule in
                            Text(rule.label).tag(rule)
                        }
                    }
                }

                Section("Visibilité") {
                    Picker("Type", selection: $visibility) {
                        Text("Commun (toute la famille)").tag(EventVisibility.shared)
                        Text("Personnel (juste moi)").tag(EventVisibility.personal)
                    }
                    .pickerStyle(.segmented)
                }
            }
            .navigationTitle("Nouveau RDV")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Annuler") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Ajouter") { save() }
                        .disabled(title.trimmingCharacters(in: .whitespaces).isEmpty)
                }
            }
        }
    }

    private func save() {
        // MVP : le premier membre créé sert de "moi" en attendant l'écran
        // de connexion / sélection de profil (voir README, limitations connues).
        let ownerID = members.first?.id ?? UUID()

        let event = FamilyEvent(
            title: title,
            startDate: startDate,
            endDate: endDate,
            isAllDay: isAllDay,
            recurrence: recurrence,
            visibility: visibility,
            ownerID: ownerID
        )
        modelContext.insert(event)

        Task {
            await NotificationScheduler.scheduleEventReminder(
                eventID: event.id,
                title: event.title,
                at: event.startDate
            )
        }

        dismiss()
    }
}

#Preview {
    EventFormView()
        .modelContainer(for: [FamilyMember.self, FamilyEvent.self, FamilyTask.self], inMemory: true)
}
