import SwiftUI
import SwiftData

struct AddCompetitionView: View {
    @Environment(\.modelContext) private var context
    @Environment(\.dismiss) private var dismiss

    @State private var name = ""
    @State private var venue = ""
    @State private var date = Date()
    @State private var organisation: Organisation = .usaigc
    @State private var level: Level = .copper1
    @State private var notes = ""

    // Per-apparatus score & position
    @State private var scores: [Apparatus: String] = [:]
    @State private var positions: [Apparatus: String] = [:]

    var body: some View {
        NavigationStack {
            ZStack {
                Color.navyPurpleGradient.ignoresSafeArea()

                Form {
                    Section("Competition Details") {
                        TextField("Name", text: $name)
                        TextField("Venue", text: $venue)
                        DatePicker("Date", selection: $date, displayedComponents: .date)
                        Picker("Organisation", selection: $organisation) {
                            ForEach(Organisation.allCases, id: \.rawValue) {
                                Text($0.rawValue).tag($0)
                            }
                        }
                        Picker("Level", selection: $level) {
                            ForEach(Level.allCases, id: \.rawValue) {
                                Text($0.rawValue).tag($0)
                            }
                        }
                    }

                    Section("Scores") {
                        ForEach(Apparatus.allCases) { apparatus in
                            HStack {
                                Text(apparatus.rawValue)
                                    .frame(width: 60, alignment: .leading)
                                if apparatus.isUpgradeTarget {
                                    Image(systemName: "star.fill")
                                        .font(.system(size: 10))
                                        .foregroundStyle(Color.theaGold)
                                }
                                Spacer()
                                TextField("Score", text: binding(for: apparatus, dict: $scores))
                                    .keyboardType(.decimalPad)
                                    .multilineTextAlignment(.trailing)
                                    .frame(width: 70)
                                Text("/")
                                    .foregroundStyle(.secondary)
                                TextField("Pos", text: binding(for: apparatus, dict: $positions))
                                    .keyboardType(.numberPad)
                                    .multilineTextAlignment(.trailing)
                                    .frame(width: 40)
                            }
                        }
                    }

                    Section("Notes") {
                        TextField("Optional notes...", text: $notes, axis: .vertical)
                            .lineLimit(3...6)
                    }
                }
                .scrollContentBackground(.hidden)
            }
            .navigationTitle("Add Competition")
            .navigationBarTitleDisplayMode(.inline)
            .toolbarColorScheme(.dark, for: .navigationBar)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") { save() }
                        .disabled(name.isEmpty)
                        .foregroundStyle(Color.theaGold)
                }
            }
        }
    }

    private func binding(for apparatus: Apparatus, dict: Binding<[Apparatus: String]>) -> Binding<String> {
        Binding(
            get: { dict.wrappedValue[apparatus] ?? "" },
            set: { dict.wrappedValue[apparatus] = $0 }
        )
    }

    private func save() {
        var results: [ApparatusResult] = []
        for apparatus in Apparatus.allCases {
            guard let scoreStr = scores[apparatus], let score = Double(scoreStr) else { continue }
            let position = positions[apparatus].flatMap { Int($0) }
            results.append(ApparatusResult(apparatus: apparatus, score: score, position: position))
        }

        let comp = Competition(
            name: name,
            venue: venue,
            date: date,
            organisation: organisation,
            level: level,
            results: results,
            notes: notes
        )
        context.insert(comp)

        // Check for new PBs
        let allComps = (try? context.fetch(FetchDescriptor<Competition>())) ?? []
        for result in results {
            PersonalBestTracker.checkForNewPB(result: result, competitions: allComps, context: context)
        }

        try? context.save()
        HapticService.achievement()
        dismiss()
    }
}

// Level needs CaseIterable for the picker
extension Level: CaseIterable {
    static var allCases: [Level] { [.copper1, .copper2, .level8] }
}
