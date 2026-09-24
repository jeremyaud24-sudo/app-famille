import SwiftUI
import SwiftData

@main
struct AppFamilleApp: App {
    /// Container SwiftData. Pour le MVP (phase 1), il tourne en local sur
    /// chaque téléphone. La synchro entre toi et ta femme via CloudKit est
    /// l'étape suivante (voir README, section "Prochaine étape : la synchro") —
    /// on la branche une fois que ce squelette compile et tourne chez toi.
    let modelContainer: ModelContainer = {
        let schema = Schema([
            FamilyMember.self,
            FamilyEvent.self,
            FamilyTask.self,
        ])
        let configuration = ModelConfiguration(schema: schema)
        do {
            return try ModelContainer(for: schema, configurations: [configuration])
        } catch {
            fatalError("Impossible de créer le ModelContainer : \(error)")
        }
    }()

    var body: some Scene {
        WindowGroup {
            RootTabView()
        }
        .modelContainer(modelContainer)
    }
}
