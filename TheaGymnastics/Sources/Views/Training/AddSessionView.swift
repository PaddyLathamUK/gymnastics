import SwiftUI
import SwiftData

struct AddSessionView: View {
    @Environment(\.modelContext) private var context
    @Environment(\.dismiss) private var dismiss

    @State private var date = Date()
    @State private var durationHours = 3
    @State private var durationMinutes = 0
    @State private var selectedApparatus: Set<Apparatus> = []
    @State private var notes = ""
    @State private var flaggedForUpgrade = false

    var body: some View {
        NavigationStack {
            ZStack {
                Color.navyPurpleGradient.ignoresSafeArea()

                Form {
                    Section("Session") {
                        DatePicker("Date", selection: $date, displayedComponents: .date)
                        Stepper("Duration: \(durationHours)h \(durationMinutes)m", onIncrement: {
                            if durationMinutes < 45 { durationMinutes += 15 } else { durationMinutes = 0; durationHours += 1 }
                        }, onDecrement: {
                            if durationMinutes > 0 { durationMinutes -= 15 } else if durationHours > 0 { durationHours -= 1; durationMinutes = 45 }
                        })
                    }

                    Section("Focus Apparatus") {
                        ForEach(Apparatus.allCases) { app in
                            HStack {
                                if app.isUpgradeTarget {
                                    Image(systemName: "star.fill")
                                        .font(.system(size: 11))
                                        .foregroundStyle(Color.theaGold)
                                }
                                Text(app.rawValue)
                                Spacer()
                                if selectedApparatus.contains(app) {
                                    Image(systemName: "checkmark")
                                        .foregroundStyle(Color.theaGold)
                                }
                            }
                            .contentShape(Rectangle())
                            .onTapGesture {
                                if selectedApparatus.contains(app) {
                                    selectedApparatus.remove(app)
                                } else {
                                    selectedApparatus.insert(app)
                                }
                            }
                        }
                        Toggle("Flag for Upgrade Work", isOn: $flaggedForUpgrade)
                            .tint(Color.theaGold)
                    }

                    Section("Notes") {
                        TextField("Session notes...", text: $notes, axis: .vertical)
                            .lineLimit(3...6)
                    }
                }
                .scrollContentBackground(.hidden)
            }
            .navigationTitle("Log Session")
            .navigationBarTitleDisplayMode(.inline)
            .toolbarColorScheme(.dark, for: .navigationBar)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") { save() }
                        .foregroundStyle(Color.theaGold)
                }
            }
        }
    }

    private func save() {
        let session = TrainingSession(
            date: date,
            durationMinutes: durationHours * 60 + durationMinutes,
            focusApparatus: Array(selectedApparatus),
            notes: notes,
            flaggedForUpgrade: flaggedForUpgrade
        )
        context.insert(session)
        try? context.save()
        HapticService.selection()
        dismiss()
    }
}
