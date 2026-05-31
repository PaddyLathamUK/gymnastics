import SwiftUI
import SwiftData

struct DashboardView: View {
    @Query(sort: \Competition.date, order: .reverse) private var competitions: [Competition]

    // USAIGC Worlds — end of June 2026
    private let worldsDate = Calendar.current.date(
        from: DateComponents(year: 2026, month: 6, day: 27))!

    private var personalBests: [Apparatus: Double] {
        PersonalBestTracker.personalBests(from: competitions)
    }

    private var latestCompetition: Competition? { competitions.first }

    var body: some View {
        ZStack {
            Color.navyPurpleGradient.ignoresSafeArea()

            ScrollView {
                VStack(spacing: 20) {
                    headerSection
                    CountdownView(targetDate: worldsDate, title: "USAIGC Worlds, Orlando")
                    upgradeTargetsSection
                    if let latest = latestCompetition {
                        latestResultsSection(latest)
                    }
                    personalBestsSection
                }
                .padding(.horizontal, 16)
                .padding(.top, 8)
                .padding(.bottom, 32)
            }
        }
        .navigationBarHidden(true)
    }

    // MARK: - Sections

    private var headerSection: some View {
        HStack(alignment: .top) {
            VStack(alignment: .leading, spacing: 4) {
                Text("Thea Latham")
                    .font(.theaDisplay(28, weight: .bold))
                    .foregroundStyle(Color.theaWhite)
                Text("Star-Tastic Gymnastics · Leatherhead")
                    .font(.theaBody(13))
                    .foregroundStyle(Color.theaChampagne.opacity(0.8))
                Text("USAIGC Copper 1 · IGA UK Level 8")
                    .font(.theaBody(12))
                    .foregroundStyle(Color.theaGold.opacity(0.8))
            }
            Spacer()
            Image(systemName: "star.circle.fill")
                .font(.system(size: 40))
                .foregroundStyle(Color.theaGold)
        }
        .padding(.top, 8)
    }

    private var upgradeTargetsSection: some View {
        TheaCard {
            VStack(alignment: .leading, spacing: 12) {
                Label("Worlds Upgrade Targets", systemImage: "trophy.fill")
                    .font(.theaBody(13, weight: .semibold))
                    .foregroundStyle(Color.theaGold)

                HStack(spacing: 12) {
                    UpgradeTargetTile(apparatus: .vault, targetLevel: "Copper 2", currentBest: personalBests[.vault])
                    UpgradeTargetTile(apparatus: .beam,  targetLevel: "Copper 2", currentBest: personalBests[.beam])
                }
            }
            .padding(16)
        }
    }

    private func latestResultsSection(_ comp: Competition) -> some View {
        TheaCard {
            VStack(alignment: .leading, spacing: 12) {
                HStack {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(comp.name)
                            .font(.theaBody(15, weight: .semibold))
                            .foregroundStyle(Color.theaWhite)
                        Text(comp.date.formatted(date: .abbreviated, time: .omitted))
                            .font(.theaBody(12))
                            .foregroundStyle(Color.theaWhite.opacity(0.5))
                    }
                    Spacer()
                    VStack(alignment: .trailing, spacing: 2) {
                        Text(String(format: "%.2f", comp.allAroundScore))
                            .font(.theaScore(22))
                            .foregroundStyle(Color.theaGold)
                        Text("All-Around")
                            .font(.theaBody(11))
                            .foregroundStyle(Color.theaWhite.opacity(0.5))
                    }
                }

                Divider().background(Color.theaGold.opacity(0.2))

                ForEach(Apparatus.allCases) { apparatus in
                    if let result = comp.result(for: apparatus) {
                        ApparatusResultRow(
                            apparatus: apparatus,
                            score: result.score,
                            position: result.position,
                            isPersonalBest: result.score == personalBests[apparatus]
                        )
                    }
                }
            }
            .padding(16)
        }
    }

    private var personalBestsSection: some View {
        TheaCard {
            VStack(alignment: .leading, spacing: 12) {
                Label("Personal Bests", systemImage: "crown.fill")
                    .font(.theaBody(13, weight: .semibold))
                    .foregroundStyle(Color.theaGold)

                LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                    ForEach(Apparatus.allCases) { apparatus in
                        PBTile(apparatus: apparatus, score: personalBests[apparatus])
                    }
                }
            }
            .padding(16)
        }
    }
}

// MARK: - Sub-tiles

private struct UpgradeTargetTile: View {
    let apparatus: Apparatus
    let targetLevel: String
    let currentBest: Double?

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack {
                Text(apparatus.rawValue)
                    .font(.theaBody(13, weight: .semibold))
                    .foregroundStyle(Color.theaWhite)
                Spacer()
                Image(systemName: "star.fill")
                    .font(.system(size: 10))
                    .foregroundStyle(Color.theaGold)
            }
            Text("→ \(targetLevel)")
                .font(.theaBody(11))
                .foregroundStyle(Color.theaChampagne.opacity(0.7))
            if let best = currentBest {
                Text(String(format: "Current PB: %.2f", best))
                    .font(.theaScore(16))
                    .foregroundStyle(Color.theaGold)
            } else {
                Text("No data yet")
                    .font(.theaBody(12))
                    .foregroundStyle(Color.theaWhite.opacity(0.4))
            }
        }
        .padding(12)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Color.theaNavy.opacity(0.6))
        .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 12, style: .continuous)
                .strokeBorder(Color.theaGold.opacity(0.25), lineWidth: 1)
        )
    }
}

private struct PBTile: View {
    let apparatus: Apparatus
    let score: Double?

    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 2) {
                Text(apparatus.rawValue)
                    .font(.theaBody(12, weight: .medium))
                    .foregroundStyle(Color.theaWhite.opacity(0.7))
                if let s = score {
                    Text(String(format: "%.2f", s))
                        .font(.theaScore(20))
                        .foregroundStyle(Color.theaGold)
                } else {
                    Text("—")
                        .font(.theaScore(20))
                        .foregroundStyle(Color.theaWhite.opacity(0.3))
                }
            }
            Spacer()
            if apparatus.isUpgradeTarget {
                Image(systemName: "star.fill")
                    .font(.system(size: 10))
                    .foregroundStyle(Color.theaGold.opacity(0.6))
            }
        }
        .padding(12)
        .background(Color.theaNavy.opacity(0.4))
        .clipShape(RoundedRectangle(cornerRadius: 10, style: .continuous))
    }
}
