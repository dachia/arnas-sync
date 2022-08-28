import { GarminConnect } from "garmin-connect"
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
    }
  }

  async getActivities(): Promise<void> {
    const act = await this.props.garminConnect.getActivities(0, 1)
    console.info(JSON.stringify(act, null, 2))
    const date = new Date()
    const hr = await this.props.garminConnect.getHeartRate(date)
    console.info(JSON.stringify(hr, null, 2))
    const sleep = await this.props.garminConnect.getSleep(date)
    console.info(JSON.stringify(sleep, null, 2))
  }
}