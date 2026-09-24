import SwiftUI
import SwiftData

struct RootTabView: View {
    @Query(sort: \FamilyMember.name) private var members: [FamilyMember]
    @Environment(\.modelContext) private var modelContext

    var body: some View {
        TabView {
            CalendarView()
                .tabItem { Label("Calendrier", systemImage: "calendar") }

            TaskListView()
                .tabItem { Label("Tâches", systemImage: "checklist") }

            MembersView()
                .tabItem { Label("Famille", systemImage: "person.2") }
        }
        .task {
            await NotificationScheduler.requestAuthorizationIfNeeded()
            seedDefaultMemberIfNeeded()
        }
    }

    /// Au tout premier lancement, on crée automatiquement un profil "Moi"
    /// pour que l'app soit utilisable en 10 secondes, sans écran de
    /// configuration à remplir avant de voir quoi que ce soit.
    private func seedDefaultMemberIfNeeded() {
        guard members.isEmpty else { return }
        let me = FamilyMember(name: "Moi", role: .parent, colorHex: "#4A90D9")
        modelContext.insert(me)
    }
}
