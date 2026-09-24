import SwiftUI
import SwiftData

struct TaskListView: View {
    @Query(sort: \FamilyTask.dueDate) private var tasks: [FamilyTask]
    @Query private var members: [FamilyMember]
    @Environment(\.modelContext) private var modelContext
    @State private var isPresentingNewTask = false

    private var pendingTasks: [FamilyTask] {
        tasks.filter { !$0.isCompleted }
    }

    var body: some View {
        NavigationStack {
            List {
                if pendingTasks.isEmpty {
                    ContentUnavailableView(
                        "Aucune tâche",
                        systemImage: "checklist",
                        description: Text("Ajoute une corvée ou une tâche à faire avec le bouton +.")
                    )
                } else {
                    ForEach(pendingTasks) { task in
                        TaskRow(task: task, memberName: memberName(for: task.assignedToID)) {
                            toggleComplete(task)
                        }
                    }
                    .onDelete(perform: deleteTasks)
                }
            }
            .navigationTitle("Tâches")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        isPresentingNewTask = true
                    } label: {
                        Label("Ajouter une tâche", systemImage: "plus")
                    }
                }
            }
            .sheet(isPresented: $isPresentingNewTask) {
                TaskFormView()
            }
        }
    }

    private func memberName(for id: UUID?) -> String? {
        guard let id else { return nil }
        return members.first(where: { $0.id == id })?.name
    }

    private func toggleComplete(_ task: FamilyTask) {
        task.completeAndReschedule()
        if let due = task.dueDate, !task.isCompleted {
            Task {
                await NotificationScheduler.scheduleTaskReminder(taskID: task.id, title: task.title, dueDate: due)
            }
        } else {
            NotificationScheduler.cancelReminder(prefix: "task", id: task.id)
        }
    }

    private func deleteTasks(at offsets: IndexSet) {
        for index in offsets {
            let task = pendingTasks[index]
            NotificationScheduler.cancelReminder(prefix: "task", id: task.id)
            modelContext.delete(task)
        }
    }
}

private struct TaskRow: View {
    let task: FamilyTask
    let memberName: String?
    let onToggle: () -> Void

    var body: some View {
        HStack {
            Button(action: onToggle) {
                Image(systemName: task.isCompleted ? "checkmark.circle.fill" : "circle")
            }
            .buttonStyle(.plain)

            VStack(alignment: .leading, spacing: 2) {
                Text(task.title).font(.body)
                if let due = task.dueDate {
                    Text(Self.dateFormatter.string(from: due))
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }

            Spacer()

            if let memberName {
                Text(memberName)
                    .font(.caption)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(.thinMaterial, in: Capsule())
            }
        }
    }

    private static let dateFormatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        formatter.timeStyle = .none
        formatter.locale = Locale(identifier: "fr_FR")
        return formatter
    }()
}

#Preview {
    TaskListView()
        .modelContainer(for: [FamilyMember.self, FamilyEvent.self, FamilyTask.self], inMemory: true)
}
