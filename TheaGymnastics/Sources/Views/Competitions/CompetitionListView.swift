import SwiftUI
import SwiftData

struct CompetitionListView: View {
    @Query(sort: \Competition.date, order: .reverse) private var competitions: [Competition]
    @State private var selectedOrg: Organisation? = nil
    @State private var selectedApparatus: Apparatus? = nil
    @State private var showAddSheet = false

    private var filtered: [Competition] {
        competitions.filter { comp in
            if let org = selectedOrg, comp.organisationEnum != org { return false }
            return true
        }
    }

    private var personalBests: [Apparatus: Double] {
        PersonalBestTracker.personalBests(from: competitions)
    }

    var body: some View {
        ZStack {
            Color.navyPurpleGradient.ignoresSafeArea()

            VStack(spacing: 0) {
                // Filter chips
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        FilterChip(label: "All", isSelected: selectedOrg == nil) {
                            selectedOrg = nil
                        }
                        ForEach(Organisation.allCases, id: \.rawValue) { org in
                            FilterChip(label: org.rawValue, isSelected: selectedOrg == org) {
                                selectedOrg = selectedOrg == org ? nil : org
                            }
                        }
                    }
                    .padding(.horizontal, 16)
                    .padding(.vertical, 12)
                }

                // Apparatus progress charts
                if let app = selectedApparatus {
                    TheaCard {
                        VStack(alignment: .leading, spacing: 8) {
                            HStack {
                                Text("\(app.rawValue) Progress")
                                    .font(.theaBody(14, weight: .semibold))
                                    .foregroundStyle(Color.theaWhite)
                                Spacer()
                                Button("Done") { selectedApparatus = nil }
                                    .font(.theaBody(13))
                                    .foregroundStyle(Color.theaGold)
                            }
                            ApparatusProgressChart(competitions: filtered, apparatus: app)
                        }
                        .padding(16)
                    }
                    .padding(.horizontal, 16)
                    .padding(.bottom, 8)
                }

                // Apparatus selector
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        ForEach(Apparatus.allCases) { app in
                            FilterChip(label: app.rawValue, isSelected: selectedApparatus == app) {
                                selectedApparatus = selectedApparatus == app ? nil : app
                            }
                        }
                    }
                    .padding(.horizontal, 16)
                    .padding(.bottom, 8)
                }

                // Competition cards
                ScrollView {
                    LazyVStack(spacing: 12) {
                        ForEach(filtered) { comp in
                            NavigationLink(destination: CompetitionDetailView(competition: comp, personalBests: personalBests)) {
                                CompetitionCard(competition: comp, personalBests: personalBests)
                            }
                            .buttonStyle(.plain)
                        }
                    }
                    .padding(.horizontal, 16)
                    .padding(.bottom, 32)
                }
            }
        }
        .navigationTitle("Competitions")
        .navigationBarTitleDisplayMode(.large)
        .toolbarColorScheme(.dark, for: .navigationBar)
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                Button {
                    showAddSheet = true
                } label: {
                    Image(systemName: "plus")
                        .foregroundStyle(Color.theaGold)
                }
            }
        }
        .sheet(isPresented: $showAddSheet) {
            AddCompetitionView()
        }
    }
}

// MARK: - Competition card

struct CompetitionCard: View {
    let competition: Competition
    let personalBests: [Apparatus: Double]

    var body: some View {
        TheaCard {
            VStack(alignment: .leading, spacing: 12) {
                HStack {
                    VStack(alignment: .leading, spacing: 3) {
                        Text(competition.name)
                            .font(.theaBody(16, weight: .semibold))
                            .foregroundStyle(Color.theaWhite)
                        Text(competition.venue)
                            .font(.theaBody(13))
                            .foregroundStyle(Color.theaWhite.opacity(0.5))
                        Text(competition.date.formatted(date: .long, time: .omitted))
                            .font(.theaBody(12))
                            .foregroundStyle(Color.theaWhite.opacity(0.4))
                    }
                    Spacer()
                    VStack(alignment: .trailing, spacing: 2) {
                        Text(String(format: "%.2f", competition.allAroundScore))
                            .font(.theaScore(24))
                            .foregroundStyle(Color.theaGold)
                        Text("AA")
                            .font(.theaBody(11))
                            .foregroundStyle(Color.theaWhite.opacity(0.4))
                    }
                }

                HStack(spacing: 8) {
                    Text(competition.organisationEnum.rawValue)
                        .font(.theaBody(10, weight: .semibold))
                        .foregroundStyle(Color.theaNavy)
                        .padding(.horizontal, 6)
                        .padding(.vertical, 2)
                        .background(Color.theaGold)
                        .clipShape(Capsule())

                    Text(competition.levelEnum.rawValue)
                        .font(.theaBody(10))
                        .foregroundStyle(Color.theaChampagne)
                        .padding(.horizontal, 6)
                        .padding(.vertical, 2)
                        .background(Color.theaNavy.opacity(0.5))
                        .clipShape(Capsule())

                    Spacer()

                    // Mini score row
                    HStack(spacing: 6) {
                        ForEach(Apparatus.allCases) { app in
                            if let r = competition.result(for: app) {
                                VStack(spacing: 1) {
                                    Text(app.rawValue.prefix(2))
                                        .font(.theaBody(8))
                                        .foregroundStyle(Color.theaWhite.opacity(0.4))
                                    Text(String(format: "%.1f", r.score))
                                        .font(.theaScore(12))
                                        .foregroundStyle(r.score == personalBests[app] ? Color.theaGold : Color.theaWhite)
                                }
                            }
                        }
                    }
                }
            }
            .padding(16)
        }
    }
}

// MARK: - Filter chip

struct FilterChip: View {
    let label: String
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(label)
                .font(.theaBody(13, weight: isSelected ? .semibold : .regular))
                .foregroundStyle(isSelected ? Color.theaNavy : Color.theaWhite)
                .padding(.horizontal, 14)
                .padding(.vertical, 7)
                .background(isSelected ? Color.theaGold : Color.theaCardBg)
                .clipShape(Capsule())
                .overlay(
                    Capsule()
                        .strokeBorder(Color.theaGold.opacity(isSelected ? 0 : 0.3), lineWidth: 1)
                )
        }
        .animation(.easeInOut(duration: 0.15), value: isSelected)
    }
}
