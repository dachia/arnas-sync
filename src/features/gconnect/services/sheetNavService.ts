import { getMonthDayNumber, getMonthName, getYearName } from "../../../shared/utils"
import { GoogleSheets } from "./googleSheets"
import { JsonType } from "./types"

export type SheetNavServiceProps = {
  googleSheets: GoogleSheets
}
export class SheetNavService {
  props: SheetNavServiceProps
  constructor(
    props: SheetNavServiceProps
  ) {
    this.props = props
  }

  async switchToDateSheet(date: Date): Promise<JsonType> {
    return await this.props.googleSheets.findSheetByName(getYearName(date))
  }

  async findSummaryTimeCell(date: Date): Promise<[number, number]> {
    const [row, _] = await this.findDateCell(date)
    return [row, 9]
  }
  
  async findSummaryKMCell(date: Date): Promise<[number, number]> {
    const [row, _] = await this.findDateCell(date)
    return [row, 8]
  }

  async findDateCell(date: Date): Promise<[number, number]> {
    const weekRowMult = 2
    // const weekRowStep = 10
    const [monRowNumber,] = await this.props.googleSheets.findRowByValue(getMonthName(date))
    const monDay = getMonthDayNumber(date)
    // console.log(monRowNumber, monRowNumber + (5 * weekRowMult))

    let [dayRowNum, dayColNum] = await this.props.googleSheets.findRowByValue(`${monDay}`, {
      minRow: monRowNumber,
      maxRow: monRowNumber + (6 * weekRowMult) // empty row after month end, therefore not 5 but 6 weeks
    })
    if (!dayRowNum) {
      [dayRowNum, dayColNum] = await this.props.googleSheets.findRowByValue(`${monDay}`, {
        minRow: monRowNumber - (1 * weekRowMult),
        maxRow: monRowNumber
      })
    }
    return [dayRowNum, dayColNum]
  }
}