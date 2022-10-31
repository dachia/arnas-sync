import { GarminConnect } from "garmin-connect"
import { formatDate, getEndOfDay, getStartOfDay } from "../../../shared/utils"
import { misToMinKm, mToKm, secToH } from "../../../shared/utils/misc"
import { IJSONPersistance } from "../repos/filePersistance"

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

  // async getSplits(activityId: number): Promise<any> {
  //   if (activityId == null) return
  //   const splitUrl = `https://connect.garmin.com/modern/proxy/activity-service/activity/${activityId}/splits`
  //   return await this.props.garminConnect.get(splitUrl)
  // }

  async getActivitiesSummary(date: Date): Promise<any[]> {
    const acts = await this.props.garminConnect.getActivities(0, 10)
    const res = []
    for (const act of acts ?? []) {
      if (act.beginTimestamp >= getStartOfDay(date).getTime()
        && act.beginTimestamp <= getEndOfDay(date).getTime()
      ) {
        res.push(act)
      }
    }
    return res;
  }
  
  async getRHR(dateFrom:Date, dateTo:Date): Promise<any[]> {
    const rhrUrl = `https://connect.garmin.com/modern/proxy/usersummary-service/stats/heartRate/daily/${formatDate(dateFrom)}/${formatDate(dateTo)}`
    const rhrRes = await this.props.garminConnect.get(rhrUrl)
    return rhrRes
  }
  async getStress(dateFrom:Date, dateTo:Date): Promise<any[]> {
    const stressUrl = `https://connect.garmin.com/modern/proxy/usersummary-service/stats/stress/daily/${formatDate(dateFrom)}/${formatDate(dateTo)}`
    const stressRes = await this.props.garminConnect.get(stressUrl)
    return stressRes    
  }
  async getSleep(dateFrom:Date, dateTo:Date): Promise<any[]> {
    const sleepUrl = `https://connect.garmin.com/modern/proxy/wellness-service/stats/sleep/daily/${formatDate(dateFrom)}/${formatDate(dateTo)}`
    const sleepRes = await this.props.garminConnect.get(sleepUrl)
    return sleepRes    
  }

  async getInfo(date: Date): Promise<DayInfoSummary> {
    const acts = await this.getActivitiesSummary(date)
    const runs: ActivityInfo[] = []

    for (const act of acts) {
      const splits = []
      if (act.hasSplits) {
        // const splitsRes = await this.getSplits(act.activitId)
        const splitUrl = `https://connect.garmin.com/modern/proxy/activity-service/activity/${act.activityId}/splits`
        const splitsRes = await this.props.garminConnect.get(splitUrl)
        // console.log(splitsRes, act)
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
      runs.push({
        avgHr: act?.averageHR,
        maxHr: act?.maxHR,
        distance: mToKm(act?.distance),
        pace: misToMinKm(act?.averageSpeed),
        splits
      })
    }
    // activityId
    // activityName
    // distance (m)
    // averageSpeed (?) 
    // averageHr
    // maxHR

    // const actDetails = await this.props.garminConnect.getActivity({ activityId: act?.activityId })
    // ?_=1666709045281
    // await this.props.sessionPersistance.persist("activity", splits)
    // console.info(JSON.stringify(act, null, 2))
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
    const data: DayInfoSummary = {
      runs,
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

export type ActivityInfo = Split & {
  splits: Split[]
}

export type HealthInfo = {
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

export type DayInfoSummary = {
  runs?: ActivityInfo[]
  health: HealthInfo
}