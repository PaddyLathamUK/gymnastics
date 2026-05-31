import Foundation
import SwiftData

enum Organisation: String, Codable, CaseIterable {
    case usaigc = "USAIGC"
    case igaUK  = "IGA UK"
}

enum Level: String, Codable {
    case copper1 = "Copper 1"
    case copper2 = "Copper 2"
    case level8  = "Level 8"
}

@Model
final class ApparatusResult: Identifiable {
    var id: UUID
    var apparatus: String      // Apparatus.rawValue — stored as String for SwiftData
    var score: Double
    var position: Int?
    var videoURL: URL?

    init(apparatus: Apparatus, score: Double, position: Int? = nil, videoURL: URL? = nil) {
        self.id         = UUID()
        self.apparatus  = apparatus.rawValue
        self.score      = score
        self.position   = position
        self.videoURL   = videoURL
    }

    var apparatusEnum: Apparatus { Apparatus(rawValue: apparatus) ?? .floor }
}

@Model
final class Competition: Identifiable {
    var id: UUID
    var name: String
    var venue: String
    var date: Date
    var organisation: String   // Organisation.rawValue
    var level: String          // Level.rawValue
    var results: [ApparatusResult]
    var notes: String
    var scoresheetImagePath: String?

    init(
        name: String,
        venue: String,
        date: Date,
        organisation: Organisation,
        level: Level,
        results: [ApparatusResult] = [],
        notes: String = ""
    ) {
        self.id           = UUID()
        self.name         = name
        self.venue        = venue
        self.date         = date
        self.organisation = organisation.rawValue
        self.level        = level.rawValue
        self.results      = results
        self.notes        = notes
    }

    var organisationEnum: Organisation { Organisation(rawValue: organisation) ?? .usaigc }
    var levelEnum: Level { Level(rawValue: level) ?? .copper1 }

    var allAroundScore: Double {
        results.reduce(0) { $0 + $1.score }
    }

    var allAroundPosition: Int? {
        // Lowest position number across apparatus if AA position not separately stored
        results.compactMap(\.position).min()
    }

    func result(for apparatus: Apparatus) -> ApparatusResult? {
        results.first { $0.apparatus == apparatus.rawValue }
    }
}

// MARK: - Seed data

extension Competition {
    static func seedData() -> [Competition] {
        let comp1 = Competition(
            name: "Competition 1",
            venue: "TBC",
            date: Calendar.current.date(from: DateComponents(year: 2026, month: 2, day: 15))!,
            organisation: .usaigc,
            level: .copper1,
            results: [
                ApparatusResult(apparatus: .floor, score: 9.00, position: 4),
                ApparatusResult(apparatus: .vault, score: 9.60, position: 1),
                ApparatusResult(apparatus: .bars,  score: 8.60, position: 7),
                ApparatusResult(apparatus: .beam,  score: 9.40, position: 1),
            ],
            notes: "AA 36.60 — 2nd overall"
        )

        let comp2 = Competition(
            name: "Competition 2",
            venue: "TBC",
            date: Calendar.current.date(from: DateComponents(year: 2026, month: 3, day: 22))!,
            organisation: .usaigc,
            level: .copper1,
            results: [
                ApparatusResult(apparatus: .floor, score: 8.90, position: 2),
                ApparatusResult(apparatus: .vault, score: 9.60, position: 2),
                ApparatusResult(apparatus: .bars,  score: 8.80, position: 3),
                ApparatusResult(apparatus: .beam,  score: 9.10, position: 2),
            ],
            notes: "AA 36.35 — 2nd overall"
        )

        return [comp1, comp2]
    }
}
