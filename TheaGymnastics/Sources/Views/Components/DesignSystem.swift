import SwiftUI

// MARK: - Colour palette

extension Color {
    static let theaNavy      = Color("TheaNavy")        // Deep midnight navy  #0D1B3E
    static let theaPurple    = Color("TheaPurple")      // Rich midnight purple #1A0A3B
    static let theaGold      = Color("TheaGold")        // Championship gold   #C9A84C
    static let theaChampagne = Color("TheaChampagne")   // Champagne highlight  #E8D5A3
    static let theaWhite     = Color("TheaWhite")       // Pure readable white  #F8F8FF
    static let theaCardBg    = Color("TheaCardBg")      // Card surface        #162040

    // Gradients
    static var navyPurpleGradient: LinearGradient {
        LinearGradient(
            colors: [.theaNavy, .theaPurple],
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )
    }

    static var goldGradient: LinearGradient {
        LinearGradient(
            colors: [.theaGold, .theaChampagne, .theaGold],
            startPoint: .leading,
            endPoint: .trailing
        )
    }
}

// MARK: - Typography

extension Font {
    // Display — slightly elegant, used for headings and Thea's name
    static func theaDisplay(_ size: CGFloat, weight: Font.Weight = .bold) -> Font {
        .system(size: size, weight: weight, design: .default)
    }

    // Data — clean monospaced-feel for scores
    static func theaScore(_ size: CGFloat) -> Font {
        .system(size: size, weight: .semibold, design: .rounded)
    }

    // Body
    static func theaBody(_ size: CGFloat, weight: Font.Weight = .regular) -> Font {
        .system(size: size, weight: weight, design: .default)
    }
}

// MARK: - Reusable card container

struct TheaCard<Content: View>: View {
    let content: Content

    init(@ViewBuilder content: () -> Content) {
        self.content = content()
    }

    var body: some View {
        content
            .background(Color.theaCardBg)
            .clipShape(RoundedRectangle(cornerRadius: 16, style: .continuous))
            .overlay(
                RoundedRectangle(cornerRadius: 16, style: .continuous)
                    .strokeBorder(Color.theaGold.opacity(0.15), lineWidth: 1)
            )
    }
}

// MARK: - Score badge

struct ScoreBadge: View {
    let score: Double
    let isPersonalBest: Bool

    var body: some View {
        ZStack {
            if isPersonalBest {
                RoundedRectangle(cornerRadius: 8, style: .continuous)
                    .fill(Color.goldGradient)
            } else {
                RoundedRectangle(cornerRadius: 8, style: .continuous)
                    .fill(Color.theaCardBg)
                    .overlay(
                        RoundedRectangle(cornerRadius: 8, style: .continuous)
                            .strokeBorder(Color.theaGold.opacity(0.3), lineWidth: 1)
                    )
            }

            VStack(spacing: 1) {
                Text(String(format: "%.2f", score))
                    .font(.theaScore(18))
                    .foregroundStyle(isPersonalBest ? Color.theaNavy : Color.theaWhite)
                if isPersonalBest {
                    Text("PB ★")
                        .font(.theaBody(9, weight: .bold))
                        .foregroundStyle(Color.theaNavy)
                }
            }
            .padding(.horizontal, 10)
            .padding(.vertical, 6)
        }
        .fixedSize()
    }
}

// MARK: - Position pill

struct PositionPill: View {
    let position: Int

    var color: Color {
        switch position {
        case 1: return .theaGold
        case 2: return Color(white: 0.75)
        case 3: return Color(red: 0.8, green: 0.5, blue: 0.2)
        default: return Color.theaWhite.opacity(0.3)
        }
    }

    var label: String {
        switch position {
        case 1: return "1st"
        case 2: return "2nd"
        case 3: return "3rd"
        default: return "\(position)th"
        }
    }

    var body: some View {
        Text(label)
            .font(.theaBody(11, weight: .bold))
            .foregroundStyle(position <= 3 ? Color.theaNavy : Color.theaWhite)
            .padding(.horizontal, 8)
            .padding(.vertical, 3)
            .background(color)
            .clipShape(Capsule())
    }
}

// MARK: - Sparkle overlay (celebration moments only)

struct SparkleView: View {
    @State private var animate = false

    var body: some View {
        ZStack {
            ForEach(0..<12, id: \.self) { i in
                SparkleParticle(index: i, animate: animate)
            }
        }
        .onAppear { withAnimation(.easeOut(duration: 1.2)) { animate = true } }
    }
}

private struct SparkleParticle: View {
    let index: Int
    let animate: Bool

    private var angle: Double { Double(index) * 30.0 }
    private var distance: CGFloat { CGFloat.random(in: 40...90) }
    private var size: CGFloat { CGFloat.random(in: 4...10) }

    var body: some View {
        Text("✦")
            .font(.system(size: size))
            .foregroundStyle(index % 2 == 0 ? Color.theaGold : Color.theaChampagne)
            .offset(
                x: animate ? cos(angle * .pi / 180) * distance : 0,
                y: animate ? sin(angle * .pi / 180) * distance : 0
            )
            .opacity(animate ? 0 : 1)
    }
}

// MARK: - Apparatus row in results

struct ApparatusResultRow: View {
    let apparatus: Apparatus
    let score: Double
    let position: Int?
    let isPersonalBest: Bool

    var body: some View {
        HStack {
            Text(apparatus.rawValue)
                .font(.theaBody(15, weight: .medium))
                .foregroundStyle(Color.theaWhite)
                .frame(width: 52, alignment: .leading)

            if apparatus.isUpgradeTarget {
                Image(systemName: "star.fill")
                    .font(.system(size: 10))
                    .foregroundStyle(Color.theaGold)
            }

            Spacer()

            if let pos = position {
                PositionPill(position: pos)
            }

            ScoreBadge(score: score, isPersonalBest: isPersonalBest)
        }
    }
}
