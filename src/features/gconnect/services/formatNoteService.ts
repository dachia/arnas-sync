import { ActivityInfo, DayInfoSummary, Split } from "./garminClient";

export class FormatNoteService {
  formatDailyNote(summary: DayInfoSummary): string {
    const splitHeader = () => `km | avg min/km | avg bpm | max bpm`
    const splitToString = (split: Split) => `${split.distance} ${split?.pace} ${split?.avgHr} ${split?.maxHr}`
    const runToString = (activity: ActivityInfo) => {
      const summary = splitToString(activity)     
      const splits = activity?.splits?.map(s => splitToString(s)).join("\n")
      return splitHeader() + `\n` + `${summary}\n\n` + splits + `\n`
    }
    const health = `rhr: ${summary?.health?.hr.restingHr}, miegas: ${summary?.health?.sleep?.timeH}\n\n`
    const activities = summary?.runs?.length ? summary?.runs.map(runToString).join("\n") : ""
    return health + activities
  }
}