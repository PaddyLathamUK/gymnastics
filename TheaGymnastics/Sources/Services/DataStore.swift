import Foundation
import SwiftData

@MainActor
final class DataStore: ObservableObject {
    static let shared = DataStore()

    let container: ModelContainer

    private init() {
        let schema = Schema([Competition.self, ApparatusResult.self, TrainingSession.self, Achievement.self])
        let config = ModelConfiguration(schema: schema, isStoredInMemoryOnly: false, cloudKitDatabase: .automatic)
        do {
            container = try ModelContainer(for: schema, configurations: [config])
            seedIfNeeded()
        } catch {
            fatalError("SwiftData container failed: \(error)")
        }
    }

    private func seedIfNeeded() {
        let ctx = container.mainContext
        let existing = (try? ctx.fetch(FetchDescriptor<Competition>())) ?? []
        guard existing.isEmpty else { return }

        for comp in Competition.seedData() {
            ctx.insert(comp)
        }
        try? ctx.save()
    }
}
