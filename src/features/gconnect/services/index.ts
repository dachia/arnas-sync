import { GarminConnect } from "garmin-connect"
import { fileGarminPersistance, fileGooglePersistance } from "../repos"
import { GarminClient } from "./garminClient"
import { GoogleClient } from "./googleClient"
import { GoogleSheets } from "./googleSheets"

export * from "./garminClient"
export * from "./types"
export * from "./googleSheets"

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