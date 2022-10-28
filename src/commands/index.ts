import { program } from "commander";
import { formatNoteService, garminClient, googleClient, googleSheets, sheetNavService } from "../features/gconnect/services";
import { formatDate, getEachDayOfInterval } from "../shared/utils";

export type UploadOpts = {
  url: string,
}

export type LoginOpts = {
  username: string,
  password: string
}

export type InfoOpts = {
  date: string;
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
    const startDate = new Date(2022, 9, 1)
    const endDate = new Date()
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
  .option("--date <letters>")
  .action(async (opts: LoginOpts & UploadOpts & InfoOpts) => {
    const date = opts?.date ? new Date(Date.parse(opts.date)) : new Date()
    await googleClient.login()
    googleSheets.useSheetFromUrl(opts.url)
    await sheetNavService.switchToDateSheet(date)
    const [rowNum, colNum] = await sheetNavService.findDateCell(date)
    await garminClient.login(opts)
    const info = await garminClient.getInfo(date)
    const note = formatNoteService.formatDailyNote(info)
    await googleSheets.addNote(rowNum, colNum, note)
  })
program.parseAsync()