import SwiftUI
import SwiftData
import UserNotifications

struct TrainingView: View {
    @Query(sort: \TrainingSession.date, order: .reverse) private var sessions: [TrainingSession]
    @Environment(\.modelContext) private var context
    @State private var showAddSession = false

    var body: some View {
        ZStack {
            Color.navyPurpleGradient.ignoresSafeArea()

            ScrollView {
                VStack(spacing: 16) {
                    trainingStatsCard
                    notificationSetupCard

                    ForEach(sessions) { session in
                        TrainingSessionCard(session: session)
                    }

                    if sessions.isEmpty {
                        Text("No sessions logged yet")
                            .font(.theaBody(14))
                            .foregroundStyle(Color.theaWhite.opacity(0.4))
                            .padding(.top, 40)
                    }
                }
                .padding(16)
                .padding(.bottom, 32)
            }
        }
        .navigationTitle("Training Log")
        .navigationBarTitleDisplayMode(.large)
        .toolbarColorScheme(.dark, for: .navigationBar)
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                Button {
                    showAddSession = true
                } label: {
                    Image(systemName: "plus")
                        .foregroundStyle(Color.theaGold)
                }
            }
        }
        .sheet(isPresented: $showAddSession) {
            AddSessionView()
        }
    }

    private var trainingStatsCard: some View {
        TheaCard {
            VStack(alignment: .leading, spacing: 12) {
                Label("Star-Tastic, Leatherhead", systemImage: "building.2.fill")
                    .font(.theaBody(13, weight: .semibold))
                    .foregroundStyle(Color.theaGold)

                HStack(spacing: 16) {
                    StatPill(label: "3×/week", detail: "Sessions")
                    StatPill(label: "3 hrs", detail: "Per session")
                    StatPill(label: "\(sessions.count)", detail: "Logged")
                }

                let upgradeCount = sessions.filter(\.isUpgradeSession).count
                if upgradeCount > 0 {
                    Label("\(upgradeCount) upgrade-focus sessions this season", systemImage: "star.fill")
                        .font(.theaBody(12))
                        .foregroundStyle(Color.theaChampagne)
                }
            }
            .padding(16)
        }
    }

    private var notificationSetupCard: some View {
        TheaCard {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Label("Training Reminders", systemImage: "bell.badge.fill")
                        .font(.theaBody(13, weight: .semibold))
                        .foregroundStyle(Color.theaGold)
                    Text("Get notified before each training session")
                        .font(.theaBody(12))
                        .foregroundStyle(Color.theaWhite.opacity(0.6))
                }
                Spacer()
                Button("Set Up") {
                    requestNotificationPermission()
                }
                .font(.theaBody(13, weight: .semibold))
                .foregroundStyle(Color.theaNavy)
                .padding(.horizontal, 14)
                .padding(.vertical, 6)
                .background(Color.theaGold)
                .clipShape(Capsule())
            }
            .padding(16)
        }
    }

    private func requestNotificationPermission() {
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound, .badge]) { granted, _ in
            guard granted else { return }
            scheduleTrainingReminders()
        }
    }

    private func scheduleTrainingReminders() {
        let center = UNUserNotificationCenter.current()
        center.removeAllPendingNotificationRequests()

        // Mon, Wed, Fri at 15:30 — adjust to actual training times
        let days: [(weekday: Int, hour: Int, minute: Int)] = [
            (2, 15, 30),  // Monday
            (4, 15, 30),  // Wednesday
            (6, 15, 30),  // Friday
        ]

        for day in days {
            var components = DateComponents()
            components.weekday = day.weekday
            components.hour    = day.hour
            components.minute  = day.minute

            let content = UNMutableNotificationContent()
            content.title = "Training today, Thea! 🌟"
            content.body  = "Star-Tastic in Leatherhead — 3 hours. Focus on vault and beam."
            content.sound = .default

            let trigger = UNCalendarNotificationTrigger(dateMatching: components, repeats: true)
            let request = UNNotificationRequest(identifier: "training-\(day.weekday)", content: content, trigger: trigger)
            center.add(request)
        }
    }
}

// MARK: - Session card

struct TrainingSessionCard: View {
    let session: TrainingSession

    var body: some View {
        TheaCard {
            HStack(alignment: .top, spacing: 12) {
                VStack(spacing: 4) {
                    Text(session.date.formatted(.dateTime.day()))
                        .font(.theaScore(22))
                        .foregroundStyle(Color.theaGold)
                    Text(session.date.formatted(.dateTime.month(.abbreviated)))
                        .font(.theaBody(11))
                        .foregroundStyle(Color.theaWhite.opacity(0.5))
                }
                .frame(width: 44)

                VStack(alignment: .leading, spacing: 6) {
                    HStack {
                        Text(session.date.formatted(.dateTime.weekday(.wide)))
                            .font(.theaBody(14, weight: .semibold))
                            .foregroundStyle(Color.theaWhite)
                        Spacer()
                        Text("\(session.durationMinutes / 60)h \(session.durationMinutes % 60)m")
                            .font(.theaBody(12))
                            .foregroundStyle(Color.theaWhite.opacity(0.5))
                    }

                    if !session.focusApparatusEnums.isEmpty {
                        HStack(spacing: 6) {
                            ForEach(session.focusApparatusEnums) { app in
                                Text(app.rawValue)
                                    .font(.theaBody(11, weight: .medium))
                                    .foregroundStyle(app.isUpgradeTarget ? Color.theaNavy : Color.theaWhite)
                                    .padding(.horizontal, 8)
                                    .padding(.vertical, 3)
                                    .background(app.isUpgradeTarget ? Color.theaGold : Color.theaNavy.opacity(0.6))
                                    .clipShape(Capsule())
                            }
                        }
                    }

                    if !session.notes.isEmpty {
                        Text(session.notes)
                            .font(.theaBody(13))
                            .foregroundStyle(Color.theaWhite.opacity(0.7))
                            .lineLimit(2)
                    }
                }
            }
            .padding(14)
        }
    }
}

private struct StatPill: View {
    let label: String
    let detail: String

    var body: some View {
        VStack(spacing: 2) {
            Text(label)
                .font(.theaScore(16))
                .foregroundStyle(Color.theaGold)
            Text(detail)
                .font(.theaBody(10))
                .foregroundStyle(Color.theaWhite.opacity(0.5))
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 8)
        .background(Color.theaNavy.opacity(0.4))
        .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
    }
}
