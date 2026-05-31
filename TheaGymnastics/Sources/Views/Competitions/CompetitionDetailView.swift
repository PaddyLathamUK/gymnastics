import SwiftUI
import SwiftData

struct CompetitionDetailView: View {
    let competition: Competition
    let personalBests: [Apparatus: Double]

    @State private var selectedApparatus: Apparatus? = nil
    @State private var showVideoSheet = false

    var body: some View {
        ZStack {
            Color.navyPurpleGradient.ignoresSafeArea()

            ScrollView {
                VStack(spacing: 16) {
                    // Header card
                    TheaCard {
                        VStack(alignment: .leading, spacing: 10) {
                            HStack {
                                VStack(alignment: .leading, spacing: 4) {
                                    Text(competition.name)
                                        .font(.theaDisplay(20, weight: .bold))
                                        .foregroundStyle(Color.theaWhite)
                                    Text(competition.venue)
                                        .font(.theaBody(14))
                                        .foregroundStyle(Color.theaWhite.opacity(0.6))
                                    Text(competition.date.formatted(date: .long, time: .omitted))
                                        .font(.theaBody(13))
                                        .foregroundStyle(Color.theaWhite.opacity(0.4))
                                }
                                Spacer()
                                VStack(alignment: .trailing, spacing: 2) {
                                    Text(String(format: "%.2f", competition.allAroundScore))
                                        .font(.theaScore(30))
                                        .foregroundStyle(Color.theaGold)
                                    Text("All-Around")
                                        .font(.theaBody(12))
                                        .foregroundStyle(Color.theaWhite.opacity(0.5))
                                }
                            }

                            HStack(spacing: 8) {
                                Text(competition.organisationEnum.rawValue)
                                    .font(.theaBody(11, weight: .semibold))
                                    .foregroundStyle(Color.theaNavy)
                                    .padding(.horizontal, 8)
                                    .padding(.vertical, 3)
                                    .background(Color.theaGold)
                                    .clipShape(Capsule())

                                Text(competition.levelEnum.rawValue)
                                    .font(.theaBody(11))
                                    .foregroundStyle(Color.theaChampagne)
                                    .padding(.horizontal, 8)
                                    .padding(.vertical, 3)
                                    .background(Color.theaNavy.opacity(0.5))
                                    .clipShape(Capsule())
                            }
                        }
                        .padding(16)
                    }

                    // Results
                    TheaCard {
                        VStack(alignment: .leading, spacing: 14) {
                            Text("Results")
                                .font(.theaBody(14, weight: .semibold))
                                .foregroundStyle(Color.theaGold)

                            ForEach(Apparatus.allCases) { apparatus in
                                if let result = competition.result(for: apparatus) {
                                    VStack(spacing: 0) {
                                        ApparatusResultRow(
                                            apparatus: apparatus,
                                            score: result.score,
                                            position: result.position,
                                            isPersonalBest: result.score == personalBests[apparatus]
                                        )
                                        .contentShape(Rectangle())
                                        .onTapGesture {
                                            selectedApparatus = selectedApparatus == apparatus ? nil : apparatus
                                        }

                                        if selectedApparatus == apparatus {
                                            VStack(spacing: 8) {
                                                ApparatusProgressChart(
                                                    competitions: [], // passed via environment in production
                                                    apparatus: apparatus
                                                )
                                                if result.videoURL != nil {
                                                    Button {
                                                        showVideoSheet = true
                                                    } label: {
                                                        Label("Watch Performance", systemImage: "play.circle.fill")
                                                            .font(.theaBody(13, weight: .medium))
                                                            .foregroundStyle(Color.theaGold)
                                                    }
                                                    .frame(maxWidth: .infinity, alignment: .leading)
                                                }
                                            }
                                            .padding(.top, 8)
                                            .transition(.opacity.combined(with: .move(edge: .top)))
                                        }
                                    }
                                    .animation(.easeInOut(duration: 0.2), value: selectedApparatus)

                                    if apparatus != Apparatus.allCases.last {
                                        Divider().background(Color.theaGold.opacity(0.1))
                                    }
                                }
                            }
                        }
                        .padding(16)
                    }

                    // Notes
                    if !competition.notes.isEmpty {
                        TheaCard {
                            VStack(alignment: .leading, spacing: 8) {
                                Label("Notes", systemImage: "note.text")
                                    .font(.theaBody(13, weight: .semibold))
                                    .foregroundStyle(Color.theaGold)
                                Text(competition.notes)
                                    .font(.theaBody(14))
                                    .foregroundStyle(Color.theaWhite.opacity(0.8))
                            }
                            .padding(16)
                        }
                    }
                }
                .padding(16)
                .padding(.bottom, 32)
            }
        }
        .navigationTitle(competition.name)
        .navigationBarTitleDisplayMode(.inline)
        .toolbarColorScheme(.dark, for: .navigationBar)
    }
}
