import { FileJSONPersistance } from "./filePersistance";

export const fileGarminPersistance = new FileJSONPersistance({ service: "garmin" })
export const fileGooglePersistance = new FileJSONPersistance({ service: "google" })
