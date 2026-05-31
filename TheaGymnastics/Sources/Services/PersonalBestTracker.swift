import Foundation
import SwiftData

/// Computes personal bests across all competitions and emits Achievement records when a new PB is set.
struct PersonalBestTracker {

    static func personalBests(from competitions: [Competition]) -> [Apparatus: Double] {
        var bests: [Apparatus: Double] = [:]
        for comp in competitions {
            for result in comp.results {
                let app = result.apparatusEnum
                if (bests[app] ?? 0) < result.score {
                    bests[app] = result.score
                }
            }
        }
        return bests
    }

    static func allAroundBest(from competitions: [Competition]) -> Double? {
        competitions.map(\.allAroundScore).max()
    }

    /// Checks whether a newly added result beats the existing personal best.
    static func checkForNewPB(
        result: ApparatusResult,
        competitions: [Competition],
        context: ModelContext
    ) {
        let bests = personalBests(from: competitions)
        let app = result.apparatusEnum
        guard result.score > (bests[app] ?? 0) else { return }

        let achievement = Achievement(
            kind: .personalBest,
            title: "New \(app.rawValue) PB!",
            detail: String(format: "%.2f", result.score),
            apparatus: app
        )
        context.insert(achievement)
    }
}
