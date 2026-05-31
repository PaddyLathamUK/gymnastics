import SwiftUI
import SwiftData

struct AchievementsView: View {
    @Query(sort: \Achievement.date, order: .reverse) private var achievements: [Achievement]
    @Environment(\.modelContext) private var context

    var body: some View {
        ZStack {
            Color.navyPurpleGradient.ignoresSafeArea()

            ScrollView {
                VStack(spacing: 16) {
                    if achievements.isEmpty {
                        emptyState
                    } else {
                        ForEach(achievements) { achievement in
                            AchievementCard(achievement: achievement)
                                .onAppear {
                                    if achievement.isNew {
                                        HapticService.achievement()
                                        markSeen(achievement)
                                    }
                                }
                        }
                    }
                }
                .padding(16)
                .padding(.bottom, 32)
            }
        }
        .navigationTitle("Achievements")
        .navigationBarTitleDisplayMode(.large)
        .toolbarColorScheme(.dark, for: .navigationBar)
    }

    private var emptyState: some View {
        VStack(spacing: 12) {
            Text("✦")
                .font(.system(size: 48))
                .foregroundStyle(Color.theaGold.opacity(0.4))
            Text("Achievements will appear here")
                .font(.theaBody(15))
                .foregroundStyle(Color.theaWhite.opacity(0.4))
            Text("Set new personal bests or earn medals to get started")
                .font(.theaBody(13))
                .foregroundStyle(Color.theaWhite.opacity(0.3))
                .multilineTextAlignment(.center)
        }
        .padding(.top, 60)
    }

    private func markSeen(_ achievement: Achievement) {
        achievement.isNew = false
        try? context.save()
    }
}

// MARK: - Achievement card

struct AchievementCard: View {
    let achievement: Achievement
    @State private var sparkle = false

    var icon: String {
        switch achievement.kindEnum {
        case .personalBest:  return "crown.fill"
        case .upgradeTarget: return "star.fill"
        case .medal:         return "medal.fill"
        case .podium:        return "trophy.fill"
        case .milestone:     return "flag.checkered.fill"
        }
    }

    var iconColor: Color {
        switch achievement.kindEnum {
        case .personalBest:  return .theaGold
        case .upgradeTarget: return .theaChampagne
        case .medal:         return .theaGold
        case .podium:        return .theaChampagne
        case .milestone:     return .theaGold
        }
    }

    var body: some View {
        TheaCard {
            HStack(spacing: 14) {
                ZStack {
                    Circle()
                        .fill(iconColor.opacity(0.15))
                        .frame(width: 52, height: 52)
                    Image(systemName: icon)
                        .font(.system(size: 22))
                        .foregroundStyle(iconColor)

                    if achievement.isNew {
                        SparkleView()
                    }
                }

                VStack(alignment: .leading, spacing: 4) {
                    HStack {
                        Text(achievement.title)
                            .font(.theaBody(15, weight: .semibold))
                            .foregroundStyle(Color.theaWhite)
                        if achievement.isNew {
                            Text("NEW")
                                .font(.theaBody(9, weight: .bold))
                                .foregroundStyle(Color.theaNavy)
                                .padding(.horizontal, 6)
                                .padding(.vertical, 2)
                                .background(Color.theaGold)
                                .clipShape(Capsule())
                        }
                    }
                    Text(achievement.detail)
                        .font(.theaScore(20))
                        .foregroundStyle(iconColor)
                    HStack(spacing: 6) {
                        Text(achievement.kindEnum.rawValue)
                            .font(.theaBody(11))
                            .foregroundStyle(Color.theaWhite.opacity(0.4))
                        Text("·")
                            .foregroundStyle(Color.theaWhite.opacity(0.3))
                        Text(achievement.date.formatted(date: .abbreviated, time: .omitted))
                            .font(.theaBody(11))
                            .foregroundStyle(Color.theaWhite.opacity(0.4))
                    }
                }
                Spacer()
            }
            .padding(14)
        }
    }
}
