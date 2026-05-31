import SwiftUI

struct CountdownView: View {
    let targetDate: Date
    let title: String

    @State private var remaining: DateComponents = .init()
    private let timer = Timer.publish(every: 1, on: .main, in: .common).autoconnect()

    var body: some View {
        TheaCard {
            VStack(spacing: 8) {
                HStack {
                    Image(systemName: "airplane.departure")
                        .foregroundStyle(Color.theaGold)
                    Text(title)
                        .font(.theaBody(13, weight: .semibold))
                        .foregroundStyle(Color.theaChampagne)
                    Spacer()
                    Text("Orlando 🇺🇸")
                        .font(.theaBody(12))
                        .foregroundStyle(Color.theaWhite.opacity(0.6))
                }

                HStack(spacing: 16) {
                    CountdownUnit(value: remaining.day ?? 0, label: "DAYS")
                    CountdownUnit(value: remaining.hour ?? 0, label: "HRS")
                    CountdownUnit(value: remaining.minute ?? 0, label: "MIN")
                    CountdownUnit(value: remaining.second ?? 0, label: "SEC")
                }
            }
            .padding(16)
        }
        .onReceive(timer) { _ in tick() }
        .onAppear { tick() }
    }

    private func tick() {
        remaining = Calendar.current.dateComponents(
            [.day, .hour, .minute, .second],
            from: .now,
            to: targetDate
        )
    }
}

private struct CountdownUnit: View {
    let value: Int
    let label: String

    var body: some View {
        VStack(spacing: 2) {
            Text(String(format: "%02d", max(0, value)))
                .font(.theaScore(28))
                .foregroundStyle(Color.theaGold)
                .monospacedDigit()
            Text(label)
                .font(.theaBody(9, weight: .semibold))
                .foregroundStyle(Color.theaWhite.opacity(0.5))
                .tracking(1.5)
        }
        .frame(minWidth: 52)
        .padding(.vertical, 8)
        .background(Color.theaNavy.opacity(0.5))
        .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
    }
}
