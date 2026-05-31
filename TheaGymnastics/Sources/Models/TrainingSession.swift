import Foundation
import SwiftData

@Model
final class TrainingSession: Identifiable {
    var id: UUID
    var date: Date
    var durationMinutes: Int
    var focusApparatus: [String]   // [Apparatus.rawValue]
    var notes: String
    var flaggedForUpgrade: Bool

    init(
        date: Date = .now,
        durationMinutes: Int = 180,
        focusApparatus: [Apparatus] = [],
        notes: String = "",
        flaggedForUpgrade: Bool = false
    ) {
        self.id                = UUID()
        self.date              = date
        self.durationMinutes   = durationMinutes
        self.focusApparatus    = focusApparatus.map(\.rawValue)
        self.notes             = notes
        self.flaggedForUpgrade = flaggedForUpgrade
    }

    var focusApparatusEnums: [Apparatus] {
        focusApparatus.compactMap { Apparatus(rawValue: $0) }
    }

    var isUpgradeSession: Bool {
        flaggedForUpgrade || focusApparatusEnums.contains(where: \.isUpgradeTarget)
    }
}
