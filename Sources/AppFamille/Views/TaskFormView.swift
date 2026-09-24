import SwiftUI
import SwiftData

struct TaskFormView: View {
    @Environment(\.dismiss) private var dismiss
    @Environment(\.modelContext) private var modelContext
    @Query private var members: [FamilyMember]

    @State private var title = ""
    @State private var hasDueDate = true
    @State private var dueDate = Date()
    @State private var recurrence: RecurrenceRule = .none
    @State private var assignedToID: UUID?

    var body: some View {
        NavigationStack {
            Form {
                Section("Tâche") {
                    TextField("Titre (ex: Sortir les poubelles)", text: $title)
                    Toggle("Date d'échéance", isOn: $hasDueDate)
                    if hasDueDate {
                        DatePicker("Échéance", selection: $dueDate)
                    }
                }

                Section("Récurrence") {
                    Picker("Se répète", selection: $recurrence) {
                        ForEach(RecurrenceRule.allCases) { rule in
                            Text(rule.label).tag(rule)
                        }
                    }
                }

                Section("Qui s'en occupe ?") {
                    Picker("Assigné à", selection: $assignedToID) {
                        Text("Non assigné").tag(UUID?.none)
                        ForEach(members) { member in
                            Text(member.name).tag(Optional(member.id))
                        }
                    }
                }
            }
            .navigationTitle("Nouvelle tâche")
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
        let createdByID = members.first?.id ?? UUID()
        let task = FamilyTask(
            title: title,
            dueDate: hasDueDate ? dueDate : nil,
            recurrence: recurrence,
            assignedToID: assignedToID,
            createdByID: createdByID
        )
        modelContext.insert(task)

        if let due = task.dueDate {
            Task {
                await NotificationScheduler.scheduleTaskReminder(taskID: task.id, title: task.title, dueDate: due)
            }
        }

        dismiss()
    }
}

#Preview {
    TaskFormView()
        .modelContainer(for: [FamilyMember.self, FamilyEvent.self, FamilyTask.self], inMemory: true)
}
