# Thea's Gymnastics App — Build Notes

## Opening in Xcode
1. Copy the `TheaGymnastics/` folder to your Mac
2. Open `TheaGymnastics.xcodeproj` in Xcode 15+
3. Set your Team in Signing & Capabilities
4. Build → iPhone 15 Pro simulator or physical device

## What's built

### Models (SwiftData + iCloud sync)
- `Apparatus` — Floor, Vault, Bars, Beam with upgrade-target flag
- `Competition` — results per apparatus, score, position, video URL, notes
- `TrainingSession` — date, duration, focus apparatus, upgrade flag
- `Achievement` — PBs, medals, upgrades; isNew flag drives haptic on first display

### Services
- `DataStore` — SwiftData container with CloudKit auto-sync; seeds two real competitions on first launch
- `PersonalBestTracker` — computes PBs across all competitions; emits Achievement when beaten
- `HapticService` — achievement / selection / impact haptics

### Views
- **Dashboard** — Thea's name, Worlds countdown, upgrade target tiles (Vault + Beam → Copper 2), latest results, PB grid
- **Competitions** — filterable list (org + apparatus), progress chart, detail view with per-apparatus tap-to-expand
- **Add Competition** — score + position entry per apparatus, auto PB check on save
- **Training** — session log, training stats, notification setup (Mon/Wed/Fri reminders)
- **Worlds** — dedicated Orlando page, countdown, upgrade toggle with sparkle celebration
- **Achievements** — all PBs and milestones, haptic on new achievement card appearance

### Design system
- Colours: `TheaNavy`, `TheaPurple`, `TheaGold`, `TheaChampagne`, `TheaWhite`, `TheaCardBg`
- Fonts: `.theaDisplay`, `.theaScore` (rounded), `.theaBody`
- `TheaCard`, `ScoreBadge`, `PositionPill`, `SparkleView`, `FilterChip`, `ApparatusResultRow`
- Live `CountdownView` with per-second tick
- `ApparatusProgressChart` using Swift Charts with gold area fill

## Pending / Phase 2
- Camera → scoresheet OCR via Anthropic Vision API
- Video upload per apparatus (iCloud / CloudKit assets)
- IGA UK Level 8 competition data entry
- Anthropic API video analysis (performance coaching notes)
- Face ID / Touch ID lock screen
- iPad split-view layout
- App icon artwork
- Worlds live results push notifications
