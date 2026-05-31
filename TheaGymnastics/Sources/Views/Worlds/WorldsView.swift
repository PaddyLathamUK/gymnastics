import SwiftUI
import SwiftData

struct WorldsView: View {
    @Query(sort: \Competition.date, order: .reverse) private var allCompetitions: [Competition]
    @State private var upgradeAchieved: [Apparatus: Bool] = [:]
    @State private var showCelebration = false

    private let worldsDate = Calendar.current.date(
        from: DateComponents(year: 2026, month: 6, day: 27))!

    private var personalBests: [Apparatus: Double] {
        PersonalBestTracker.personalBests(from: allCompetitions)
    }

    var body: some View {
        ZStack {
            Color.navyPurpleGradient.ignoresSafeArea()

            ScrollView {
                VStack(spacing: 20) {
                    headerSection
                    CountdownView(targetDate: worldsDate, title: "USAIGC World Championships")
                    upgradeGoalsSection
                    liveResultsSection
                    if showCelebration { celebrationSection }
                }
                .padding(16)
                .padding(.bottom, 32)
            }
        }
        .navigationTitle("Worlds — Orlando 🇺🇸")
        .navigationBarTitleDisplayMode(.inline)
        .toolbarColorScheme(.dark, for: .navigationBar)
    }

    private var headerSection: some View {
        TheaCard {
            VStack(alignment: .leading, spacing: 10) {
                HStack {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("USAIGC World Championships")
                            .font(.theaDisplay(18, weight: .bold))
                            .foregroundStyle(Color.theaWhite)
                        Text("Orlando, Florida")
                            .font(.theaBody(14))
                            .foregroundStyle(Color.theaChampagne.opacity(0.8))
                        Text(worldsDate.formatted(date: .long, time: .omitted))
                            .font(.theaBody(13))
                            .foregroundStyle(Color.theaWhite.opacity(0.5))
                    }
                    Spacer()
                    Text("🏆")
                        .font(.system(size: 44))
                }

                Divider().background(Color.theaGold.opacity(0.2))

                VStack(alignment: .leading, spacing: 4) {
                    Text("Mission")
                        .font(.theaBody(11, weight: .semibold))
                        .foregroundStyle(Color.theaGold)
                        .tracking(1.5)
                    Text("Upgrade Vault & Beam to Copper 2")
                        .font(.theaBody(15, weight: .medium))
                        .foregroundStyle(Color.theaWhite)
                }
            }
            .padding(16)
        }
    }

    private var upgradeGoalsSection: some View {
        TheaCard {
            VStack(alignment: .leading, spacing: 14) {
                Label("Upgrade Targets", systemImage: "star.fill")
                    .font(.theaBody(13, weight: .semibold))
                    .foregroundStyle(Color.theaGold)

                ForEach([Apparatus.vault, Apparatus.beam]) { apparatus in
                    WorldsUpgradeRow(
                        apparatus: apparatus,
                        currentBest: personalBests[apparatus],
                        achieved: upgradeAchieved[apparatus] ?? false,
                        onToggle: {
                            let isNowAchieved = !(upgradeAchieved[apparatus] ?? false)
                            upgradeAchieved[apparatus] = isNowAchieved
                            if isNowAchieved {
                                HapticService.achievement()
                                withAnimation { showCelebration = true }
                            }
                        }
                    )
                }
            }
            .padding(16)
        }
    }

    private var liveResultsSection: some View {
        TheaCard {
            VStack(alignment: .leading, spacing: 12) {
                Label("Live Score Entry", systemImage: "pencil.circle.fill")
                    .font(.theaBody(13, weight: .semibold))
                    .foregroundStyle(Color.theaGold)

                Text("Add scores during the event — navigate to Competitions → Add Competition to log Worlds results in real time.")
                    .font(.theaBody(13))
                    .foregroundStyle(Color.theaWhite.opacity(0.7))

                NavigationLink(destination: AddCompetitionView()) {
                    Label("Enter Worlds Scores", systemImage: "plus.circle.fill")
                        .font(.theaBody(14, weight: .semibold))
                        .foregroundStyle(Color.theaNavy)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 12)
                        .background(Color.theaGold)
                        .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                }
            }
            .padding(16)
        }
    }

    private var celebrationSection: some View {
        TheaCard {
            ZStack {
                SparkleView()
                VStack(spacing: 8) {
                    Text("🌟 UPGRADE ACHIEVED! 🌟")
                        .font(.theaDisplay(20, weight: .bold))
                        .foregroundStyle(Color.theaGold)
                        .multilineTextAlignment(.center)
                    Text("Thea Latham — Copper 2")
                        .font(.theaBody(15))
                        .foregroundStyle(Color.theaChampagne)
                }
                .padding(32)
            }
        }
    }
}

private struct WorldsUpgradeRow: View {
    let apparatus: Apparatus
    let currentBest: Double?
    let achieved: Bool
    let onToggle: () -> Void

    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 3) {
                Text(apparatus.rawValue)
                    .font(.theaBody(15, weight: .semibold))
                    .foregroundStyle(achieved ? Color.theaGold : Color.theaWhite)
                HStack(spacing: 6) {
                    Text("Current PB:")
                        .font(.theaBody(12))
                        .foregroundStyle(Color.theaWhite.opacity(0.5))
                    if let best = currentBest {
                        Text(String(format: "%.2f", best))
                            .font(.theaScore(14))
                            .foregroundStyle(Color.theaGold)
                    } else {
                        Text("—")
                            .font(.theaScore(14))
                            .foregroundStyle(Color.theaWhite.opacity(0.3))
                    }
                }
            }
            Spacer()
            Button(action: onToggle) {
                ZStack {
                    Circle()
                        .fill(achieved ? Color.theaGold : Color.theaNavy.opacity(0.5))
                        .frame(width: 36, height: 36)
                        .overlay(Circle().strokeBorder(Color.theaGold.opacity(0.5), lineWidth: 1))
                    if achieved {
                        Image(systemName: "checkmark")
                            .font(.system(size: 16, weight: .bold))
                            .foregroundStyle(Color.theaNavy)
                    }
                }
            }
            .animation(.spring(response: 0.3), value: achieved)
        }
    }
}
