import { program  } from "commander";
import { garminClient, googleClient, googleSheets } from "../features/gconnect/services";
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
    console.log(dayRowNum, dayColNum)
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
    await garminClient.getActivities()
  })
program.parseAsync()