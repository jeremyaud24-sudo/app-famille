import SwiftUI
import SwiftData

struct CalendarView: View {
    @Query(sort: \FamilyEvent.startDate) private var events: [FamilyEvent]
    @Environment(\.modelContext) private var modelContext
    @State private var isPresentingNewEvent = false

    private var upcomingEvents: [FamilyEvent] {
        events.filter { $0.endDate >= .now }
    }

    var body: some View {
        NavigationStack {
            List {
                if upcomingEvents.isEmpty {
                    ContentUnavailableView(
                        "Aucun rendez-vous",
                        systemImage: "calendar",
                        description: Text("Ajoute votre premier RDV commun avec le bouton +.")
                    )
                } else {
                    ForEach(upcomingEvents) { event in
                        EventRow(event: event)
                    }
                    .onDelete(perform: deleteEvents)
                }
            }
            .navigationTitle("Calendrier")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        isPresentingNewEvent = true
                    } label: {
                        Label("Ajouter un RDV", systemImage: "plus")
                    }
                }
            }
            .sheet(isPresented: $isPresentingNewEvent) {
                EventFormView()
            }
        }
    }

    private func deleteEvents(at offsets: IndexSet) {
        for index in offsets {
            let event = upcomingEvents[index]
            NotificationScheduler.cancelReminder(prefix: "event", id: event.id)
            modelContext.delete(event)
        }
    }
}

private struct EventRow: View {
    let event: FamilyEvent

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack {
                Text(event.title).font(.headline)
                Spacer()
                if event.visibility == .personal {
                    Image(systemName: "lock.fill")
                        .foregroundStyle(.secondary)
                        .help("Événement personnel")
                }
            }
            Text(Self.dateFormatter.string(from: event.startDate))
                .font(.subheadline)
                .foregroundStyle(.secondary)
        }
    }

    private static let dateFormatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        formatter.timeStyle = .short
        formatter.locale = Locale(identifier: "fr_FR")
        return formatter
    }()
}

#Preview {
    CalendarView()
        .modelContainer(for: [FamilyMember.self, FamilyEvent.self, FamilyTask.self], inMemory: true)
}
