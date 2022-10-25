import { GarminConnect } from "garmin-connect"
import { isMinusToken } from "typescript"
import { FileJSONPersistance, IJSONPersistance } from "../repos/filePersistance"

export type GarminClientState = {
  username: string
}

export type GarminClientProps = {
  sessionPersistance: IJSONPersistance
  garminConnect: GarminConnect
}

export type LoginArgs = {
  username: string
  password: string
}

export class GarminClient {
  state: GarminClientState
  props: GarminClientProps

  constructor(
    props: GarminClientProps
  ) {
    this.props = props
    this.state = {
      username: null
    }
    this.registerSyncSession()
  }

  private registerSyncSession(): void {
    this.props.garminConnect.on("sessionChange", async (session) => {
      await this.props.sessionPersistance.persist(this.state.username, session)
    })
  }

  async login(creds: LoginArgs): Promise<void> {
    this.state.username = creds.username
    const session = await this.props.sessionPersistance.load(this.state.username)
    if (session) {
      try {
        this.props.garminConnect.restore(session)
      } catch (e) {
        await this.props.garminConnect.login(creds.username, creds.password)
      }
    } else {
      await this.props.garminConnect.login(creds.username, creds.password)
      // console.log("no session, full login")
    }
  }

  async getTodaysInfo(): Promise<TodayInfo> {
    const acts = await this.props.garminConnect.getActivities(0, 1)
    const act = acts?.[0]
    // activityId
    // activityName
    // distance (m)
    // averageSpeed (?) 
    // averageHr
    // maxHR

    const misToMinKm = (val: number): string => {
      const kmh = ((val * 60 * 60) / 1000)
      const minKm = 60 / kmh
      const min = Math.floor(minKm)
      const sec = (minKm - Math.floor(minKm)) * 60
      return `${min.toFixed(0)}:${sec.toFixed(0)}`
    }
    const mToKm = (val: number): string => `${(val / 1000).toFixed(2)}`
    const secToH = (val: number): string => {
      if (!val) return ``
      const h = Math.floor(val / 3600)
      const sec = Math.floor((val % 3600) / 60)
      return `${h.toFixed(0)}:${sec.toFixed(0)}`
    }
    // const actDetails = await this.props.garminConnect.getActivity({ activityId: act?.activityId })
    // ?_=1666709045281
    const splitUrl = `https://connect.garmin.com/modern/proxy/activity-service/activity/${act?.activityId}/splits`
    let splits = []
    if (act?.activityId) {
      const splitsRes = await this.props.garminConnect.get(splitUrl)
      for (const split of splitsRes?.lapDTOs ?? []) {
        if (split.intensityType === "ACTIVE") {
          splits.push({
            avgHr: split?.averageHR,
            maxHr: split?.maxHR,
            distance: mToKm(split?.distance),
            pace: misToMinKm(split?.averageSpeed),
          })
        }
      }
    }

    // await this.props.sessionPersistance.persist("activity", splits)
    // console.info(JSON.stringify(act, null, 2))

    const date = new Date()
    const hr = await this.props.garminConnect.getHeartRate(date)
    // restingHeartRate
    // console.info(JSON.stringify(hr, null, 2))
    const sleep = await this.props.garminConnect.getSleep(date)
    // sleepTimeSeconds
    // deepSleepSeconds
    // remSleepSeconds
    // lightfSleepSeconds
    // averageRespirationValue
    // console.info(JSON.stringify(sleep, null, 2))
    const data: TodayInfo = {
      run: {
        avgHr: act?.averageHR,
        maxHr: act?.maxHR,
        distance: mToKm(act?.distance),
        pace: misToMinKm(act?.averageSpeed),
        splits
      },
      health: {
        hr: {
          restingHr: hr?.restingHeartRate
        },
        sleep: {
          timeH: secToH(sleep?.sleepTimeSeconds),
          deepH: secToH(sleep?.deepSleepSeconds),
          lightH: secToH(sleep?.lightfSleepSeconds),
          remH: secToH(sleep?.remSleepSeconds),
          avgRespiration: sleep?.averageRespirationValue,
        }
      },
    }
    // console.log(JSON.stringify(data, null, 2))
    return data
  }
}

export type Split = {
  avgHr: number
  maxHr: number
  distance: string
  pace: string
}

type ActivityInfo = Split & {
  splits: Split[]
}

type HealthInfo = {
  hr: {
    restingHr: number
  }
  sleep: {
    timeH: string
    deepH: string
    lightH: string
    remH: string
    avgRespiration: number
  }
}

type TodayInfo = {
  run?: ActivityInfo
  health: HealthInfo
}