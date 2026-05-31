import SwiftUI

struct MainTabView: View {
    @State private var selectedTab = 0

    var body: some View {
        TabView(selection: $selectedTab) {
            NavigationStack {
                DashboardView()
            }
            .tabItem {
                Label("Home", systemImage: "house.fill")
            }
            .tag(0)

            NavigationStack {
                CompetitionListView()
            }
            .tabItem {
                Label("Competitions", systemImage: "list.star")
            }
            .tag(1)

            NavigationStack {
                TrainingView()
            }
            .tabItem {
                Label("Training", systemImage: "figure.gymnastics")
            }
            .tag(2)

            NavigationStack {
                WorldsView()
            }
            .tabItem {
                Label("Worlds", systemImage: "airplane")
            }
            .tag(3)

            NavigationStack {
                AchievementsView()
            }
            .tabItem {
                Label("Achievements", systemImage: "crown.fill")
            }
            .tag(4)
        }
        .tint(Color.theaGold)
        .onAppear { applyTabBarAppearance() }
    }

    private func applyTabBarAppearance() {
        let appearance = UITabBarAppearance()
        appearance.configureWithOpaqueBackground()
        appearance.backgroundColor = UIColor(Color.theaNavy)

        let normalAttrs: [NSAttributedString.Key: Any] = [
            .foregroundColor: UIColor(Color.theaWhite.opacity(0.4))
        ]
        let selectedAttrs: [NSAttributedString.Key: Any] = [
            .foregroundColor: UIColor(Color.theaGold)
        ]

        appearance.stackedLayoutAppearance.normal.titleTextAttributes    = normalAttrs
        appearance.stackedLayoutAppearance.selected.titleTextAttributes  = selectedAttrs
        appearance.stackedLayoutAppearance.normal.iconColor    = UIColor(Color.theaWhite.opacity(0.4))
        appearance.stackedLayoutAppearance.selected.iconColor  = UIColor(Color.theaGold)

        UITabBar.appearance().standardAppearance  = appearance
        UITabBar.appearance().scrollEdgeAppearance = appearance
    }
}
