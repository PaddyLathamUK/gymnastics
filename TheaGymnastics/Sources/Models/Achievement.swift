import Foundation
import SwiftData

enum AchievementKind: String, Codable {
    case personalBest   = "Personal Best"
    case upgradeTarget  = "Upgrade Target"
    case medal          = "Medal"
    case podium         = "Podium"
    case milestone      = "Milestone"
}

@Model
final class Achievement: Identifiable {
    var id: UUID
    var kind: String       // AchievementKind.rawValue
    var title: String
    var detail: String
    var date: Date
    var apparatus: String? // Apparatus.rawValue — nil for AA achievements
    var isNew: Bool        // drives haptic + animation on first display

    init(
        kind: AchievementKind,
        title: String,
        detail: String,
        date: Date = .now,
        apparatus: Apparatus? = nil
    ) {
        self.id         = UUID()
        self.kind       = kind.rawValue
        self.title      = title
        self.detail     = detail
        self.date       = date
        self.apparatus  = apparatus?.rawValue
        self.isNew      = true
    }

    var kindEnum: AchievementKind { AchievementKind(rawValue: kind) ?? .milestone }
    var apparatusEnum: Apparatus? { apparatus.flatMap { Apparatus(rawValue: $0) } }
}
