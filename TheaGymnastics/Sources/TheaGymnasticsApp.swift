import SwiftUI
import SwiftData

@main
struct TheaGymnasticsApp: App {
    let dataStore = DataStore.shared

    var body: some Scene {
        WindowGroup {
            MainTabView()
                .modelContainer(dataStore.container)
                .preferredColorScheme(.dark)
        }
    }
}
