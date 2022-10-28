import { GarminConnect } from "garmin-connect"
import { fileGarminPersistance, fileGooglePersistance } from "../repos"
import { FormatNoteService } from "./formatNoteService"
import { GarminClient } from "./garminClient"
import { GoogleClient } from "./googleClient"
import { GoogleSheets } from "./googleSheets"
import { SheetNavService } from "./sheetNavService"

export * from "./garminClient"
export * from "./types"
export * from "./googleSheets"
export * from "./sheetNavService"
export * from "./formatNoteService"

export const garminClient = new GarminClient({
  garminConnect: new GarminConnect(),
  sessionPersistance: fileGarminPersistance
})

export const googleClient = new GoogleClient({
  credentialsPersistance: fileGooglePersistance
})

export const googleSheets = new GoogleSheets({
  client: googleClient
}) 

export const sheetNavService = new SheetNavService({
  googleSheets
})

export const formatNoteService = new FormatNoteService()