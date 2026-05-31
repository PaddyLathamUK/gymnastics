import SwiftUI
import Charts

struct ApparatusProgressChart: View {
    let competitions: [Competition]
    let apparatus: Apparatus

    private var dataPoints: [(date: Date, score: Double, name: String)] {
        competitions
            .sorted { $0.date < $1.date }
            .compactMap { comp in
                guard let result = comp.result(for: apparatus) else { return nil }
                return (comp.date, result.score, comp.name)
            }
    }

    var body: some View {
        if dataPoints.isEmpty {
            Text("No data yet")
                .font(.theaBody(13))
                .foregroundStyle(Color.theaWhite.opacity(0.4))
                .frame(maxWidth: .infinity, alignment: .center)
                .padding(.vertical, 24)
        } else {
            Chart(dataPoints, id: \.name) { point in
                LineMark(
                    x: .value("Competition", point.name),
                    y: .value("Score", point.score)
                )
                .foregroundStyle(Color.theaGold)
                .interpolationMethod(.catmullRom)

                PointMark(
                    x: .value("Competition", point.name),
                    y: .value("Score", point.score)
                )
                .foregroundStyle(Color.theaChampagne)
                .symbolSize(60)

                AreaMark(
                    x: .value("Competition", point.name),
                    yStart: .value("Base", minScore),
                    yEnd: .value("Score", point.score)
                )
                .foregroundStyle(
                    LinearGradient(
                        colors: [Color.theaGold.opacity(0.3), Color.theaGold.opacity(0.05)],
                        startPoint: .top,
                        endPoint: .bottom
                    )
                )
                .interpolationMethod(.catmullRom)
            }
            .chartYScale(domain: minScore...10.5)
            .chartXAxis {
                AxisMarks { _ in
                    AxisValueLabel()
                        .foregroundStyle(Color.theaWhite.opacity(0.6))
                }
            }
            .chartYAxis {
                AxisMarks(values: .stride(by: 0.5)) { value in
                    AxisGridLine().foregroundStyle(Color.theaWhite.opacity(0.08))
                    AxisValueLabel()
                        .foregroundStyle(Color.theaWhite.opacity(0.6))
                }
            }
            .frame(height: 160)
        }
    }

    private var minScore: Double {
        max(0, (dataPoints.map(\.score).min() ?? 8.0) - 0.5)
    }
}
