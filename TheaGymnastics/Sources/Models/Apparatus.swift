import Foundation

enum Apparatus: String, CaseIterable, Codable, Identifiable {
    case floor = "Floor"
    case vault = "Vault"
    case bars  = "Bars"
    case beam  = "Beam"

    var id: String { rawValue }

    var emoji: String {
        switch self {
        case .floor: return "🟦"
        case .vault: return "🏃"
        case .bars:  return "🤸"
        case .beam:  return "⚖️"
        }
    }

    var systemImage: String {
        switch self {
        case .floor: return "square.fill"
        case .vault: return "arrow.up.right"
        case .bars:  return "figure.gymnastics"
        case .beam:  return "minus"
        }
    }

    /// Whether this apparatus is an upgrade target for Worlds
    var isUpgradeTarget: Bool {
        self == .vault || self == .beam
    }
}
