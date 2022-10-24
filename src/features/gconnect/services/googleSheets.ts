import { GoogleClient } from "./googleClient"
import { google } from 'googleapis';
import { JsonType } from "./types";
import { textChangeRangeIsUnchanged } from "typescript";


export type FindRowByValueOpts = {
  minRow?: number
  maxRow?: number
}
export type GoogleSheetsProps = {
  client: GoogleClient
}
export type GoogleSheetsState = {
  spreadsheetId: string
  sheets: any
  sheet: JsonType;
}
export class GoogleSheets {
  props: GoogleSheetsProps
  state: GoogleSheetsState
  constructor(
    props: GoogleSheetsProps
  ) {
    this.props = props
    this.state = {
      sheets: null,
      spreadsheetId: null,
      sheet: null
    }
  }

  useSheetFromUrl(url: string): void {
    const parts = url?.split("/")
    this.state.spreadsheetId = parts[parts.length - 2]
    this.state.sheets = google.sheets({ version: "v4", auth: this.props.client.state.client })
  }

  async getInfo(): Promise<JsonType> {
    const res = await this.state.sheets.spreadsheets.get({ spreadsheetId: this.state.spreadsheetId });
    return res.data
  }
  async findSheetByName(value: string): Promise<JsonType> {
    const info = await this.getInfo()
    const sheet = info["sheets"]?.find(s => s["properties"]?.title === value)
    this.state.sheet = sheet
    return this.state.sheet
  }

  async addNote(row: number, col: number, comment: string): Promise<void> {
    const requestBody = {
      "requests": [
        {
          "repeatCell": {
            "range": {
              "sheetId": this.state.sheet["properties"]["sheetId"],
              "startRowIndex": row,
              "endRowIndex": row + 1,
              "startColumnIndex": col - 1,
              "endColumnIndex": col,
            },
            "cell": { "note": comment },
            "fields": "note",
          }
        }
      ]
    }
    const res = await this.state.sheets.spreadsheets.batchUpdate({
      spreadsheetId: this.state.spreadsheetId,
      requestBody
    })
    // console.info(JSON.stringify(res.data, null, 2))
  }

  async findRowByValue(value: string, opts?: FindRowByValueOpts): Promise<[number, number]> {
    const fromRow = opts?.minRow ?? 1
    const toRow = opts?.maxRow ?? this.state.sheet["properties"].gridProperties.rowCount
    const res = await this.state.sheets.spreadsheets.values.get({
      spreadsheetId: this.state.spreadsheetId,
      range: `${this.state.sheet["properties"].title}!1:${toRow}`
    })
    const data = res.data
    let colIdx: number = -1
    const rowIdx = data.values.findIndex((d: string[], idx_: number) => {
      if (idx_ < fromRow - 1) return false
      const idx = d.findIndex(v => v.toLowerCase() === value.toLowerCase())
      if (idx > -1) {
        colIdx = idx
        return true
      }
      return false
    })
    if (rowIdx > -1) {
      return [rowIdx + 1, colIdx + 1]
    }
  }
}