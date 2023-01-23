import { program } from "commander";
import { formatNoteService, garminClient, googleClient, googleSheets, sheetNavService } from "../features/gconnect/services";
import { format, formatDate, getEachDayOfInterval, getEachWeekOfInterval, getStartOfWeek, getWeek, parseStringDate, subDays } from "../shared/utils";

export type UploadOpts = {
  url: string,
}

export type LoginOpts = {
  username: string,
  password: string
}

export type InfoOpts = {
  startDate: string;
  endDate: string;
}

program
  .command("download")
  .requiredOption("-u, --username <letters>")
  .requiredOption("-p, --password <letters>")
  .action(async (opts: LoginOpts) => {
    await garminClient.login(opts)
    await garminClient.getInfo(new Date())
  })

program.
  command("report")
  .requiredOption("-u, --username <letters>")
  .requiredOption("-p, --password <letters>")
  .requiredOption("--url <letters>")
  .action(async (opts: LoginOpts & UploadOpts & InfoOpts) => {
    await googleClient.login()
    googleSheets.useSheetFromUrl(opts.url)
    await googleSheets.findSheetByName("Health trends")
    await garminClient.login(opts)
    const endDate = new Date()
    const startDate = subDays(endDate, 27)
    const rhrRes = await garminClient.getRHR(startDate, endDate)
    const stressRes = await garminClient.getStress(startDate, endDate)
    const sleepRes = await garminClient.getSleep(startDate, endDate)
    const dates = getEachDayOfInterval({ start: startDate, end: endDate })
    const data = dates.map(dt => {
      const formatedDate = formatDate(dt)
      const rhr = rhrRes.find(r => r.calendarDate === formatedDate)
      const stress = stressRes.find(r => r.calendarDate === formatedDate)
      const sleep = sleepRes.find(r => r.calendarDate === formatedDate)
      return [
        formatedDate, rhr?.values?.restingHR, stress?.values?.overallStressLevel, Math.floor(sleep?.values?.totalSleepSeconds / 60)]
    }) ?? []
    // console.log(JSON.stringify(data, null, 2))
    await googleSheets.insert([
      ["Date", "RHR", "Stress", "Sleep min"],
      ...data
    ])

    // console.log(JSON.stringify(rhr, null, 2))
    // console.log(JSON.stringify(stress, null, 2))
    // console.log(JSON.stringify(sleep, null, 2))
    // await googleSheets.addNote(rowNum, colNum, note)
  })
program
  .command("sync")
  .requiredOption("-u, --username <letters>")
  .requiredOption("-p, --password <letters>")
  .requiredOption("--url <letters>")
  .option("--startDate <letters>")
  .option("--endDate <letters>")
  .action(async (opts: LoginOpts & UploadOpts & InfoOpts) => {
    const startDate = opts?.startDate ? new Date(Date.parse(opts.startDate)) : new Date()
    await googleClient.login()
    googleSheets.useSheetFromUrl(opts.url)
    const endDate = opts?.endDate ? parseStringDate(opts?.endDate) : new Date()
    const dates = getEachDayOfInterval({ start: startDate, end: endDate })
    const weeks = {}
    for (const date of dates) {
      await sheetNavService.switchToDateSheet(date)
      const [rowNum, colNum] = await sheetNavService.findDateCell(date)
      if (rowNum == null || colNum == null) throw new Error("row not found")
      await garminClient.login(opts)
      const info = await garminClient.getInfo(date)
      const weekNr = format(getStartOfWeek(date))
      if (!weeks[weekNr]) {
        weeks[weekNr] = {
          km: 0,
          time: 0
        }
      }
      const sumKm = info.runs.reduce((prev, cur) => {
        return prev + Number(cur.distance)
      }, 0)
      weeks[weekNr].km = weeks[weekNr].km + sumKm
      const note = formatNoteService.formatDailyNote(info)
      await googleSheets.addNote(rowNum, colNum, note)
    }
    for (const weekKey of Object.keys(weeks)) {
      const date = parseStringDate(weekKey)
      const [sumRow, sumCell] = await sheetNavService.findSummaryKMCell(date)
      // console.log(date)
      // console.log(sumRow, sumCell)
      const km = weeks[weekKey].km
      await googleSheets.addNote(sumRow, sumCell, `${km}`)
    }
  })
program.parseAsync()