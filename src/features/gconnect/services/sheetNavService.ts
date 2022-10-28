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
  
  async findDateCell(date: Date): Promise<[number, number]> {
    const weekRowMult = 2
    // const weekRowStep = 10
    const [monRowNumber,] = await this.props.googleSheets.findRowByValue(getMonthName(date))
    const monDay = getMonthDayNumber(date)

    let [dayRowNum, dayColNum] = await this.props.googleSheets.findRowByValue(`${monDay}`, {
      minRow: monRowNumber,
      maxRow: monRowNumber + (5 * weekRowMult)
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