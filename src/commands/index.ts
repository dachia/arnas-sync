import { program } from "commander";
import { garminClient, googleClient, googleSheets, Split } from "../features/gconnect/services";
import { getCurrentMonthName, getCurrentYearName, getMonthDayNumber } from "../shared/utils";

export type UploadOpts = {
  url: string,
}

program
  .command("upload")
  .requiredOption("--url <letters>")
  .action(async (opts: UploadOpts) => {
    await googleClient.login()
    googleSheets.useSheetFromUrl(opts.url)
    await googleSheets.findSheetByName(getCurrentYearName())
    const weekRowMult = 2
    const weekRowStep = 10
    const [monRowNumber,] = await googleSheets.findRowByValue(getCurrentMonthName())
    const monDay = getMonthDayNumber()
    let [dayRowNum, dayColNum] = await googleSheets.findRowByValue(`${monDay}`, {
      minRow: monRowNumber,
      maxRow: monRowNumber + (5 * weekRowMult)
    })
    if (!dayRowNum) {
      [dayRowNum, dayColNum] = await googleSheets.findRowByValue(`${monDay}`, {
        minRow: monRowNumber - (1 * weekRowMult),
        maxRow: monRowNumber
      })
    }
    // console.log(dayRowNum, dayColNum)
    // const info = await garminClient.getTodaysInfo()

    await googleSheets.addNote(dayRowNum, dayColNum, "hi arnas")
  })

export type LoginOpts = {
  username: string,
  password: string
}

program
  .command("download")
  .requiredOption("-u, --username <letters>")
  .requiredOption("-p, --password <letters>")
  .action(async (opts: LoginOpts) => {
    await garminClient.login(opts)
    await garminClient.getTodaysInfo()
  })

program
  .command("sync")
  .requiredOption("-u, --username <letters>")
  .requiredOption("-p, --password <letters>")
  .requiredOption("--url <letters>")
  .action(async (opts: LoginOpts & UploadOpts) => {
    await googleClient.login()
    googleSheets.useSheetFromUrl(opts.url)
    await googleSheets.findSheetByName(getCurrentYearName())
    const weekRowMult = 2
    const weekRowStep = 10
    const [monRowNumber,] = await googleSheets.findRowByValue(getCurrentMonthName())
    const monDay = getMonthDayNumber()
    let [dayRowNum, dayColNum] = await googleSheets.findRowByValue(`${monDay}`, {
      minRow: monRowNumber,
      maxRow: monRowNumber + (5 * weekRowMult)
    })
    if (!dayRowNum) {
      [dayRowNum, dayColNum] = await googleSheets.findRowByValue(`${monDay}`, {
        minRow: monRowNumber - (1 * weekRowMult),
        maxRow: monRowNumber
      })
    }
    // console.log(dayRowNum, dayColNum)
    // const info = await garminClient.getTodaysInfo()
    await garminClient.login(opts)
    const info = await garminClient.getTodaysInfo()
    let splits = ``
    const splitToString = (split: Split) => `${split.distance} km, ${split?.pace} min/km ${split?.avgHr}bpm (avg), ${split?.maxHr}bpm (max)\n`
    await googleSheets.addNote(dayRowNum, dayColNum,
      splitToString(info.run) +
      `rhr: ${info?.health?.hr.restingHr}, miegas: ${info?.health?.sleep?.timeH}(deep: ${info?.health?.sleep?.deepH}, rem: ${info?.health?.sleep.remH})\n` +
      `splits:\n` +
      info?.run?.splits?.map(s => splitToString(s)).join("")
    )
  })
program.parseAsync()