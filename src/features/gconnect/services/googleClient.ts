import { FileJSONPersistance, IJSONPersistance } from "../repos/filePersistance";
import { authenticate  } from "@google-cloud/local-auth";
import { google, GoogleApis  } from "googleapis";
import { JSONClient } from "google-auth-library/build/src/auth/googleauth";
import { JWTInput } from "google-auth-library";

export type GoogleClientProps = {
  credentialsPersistance: FileJSONPersistance
}
export type GoogleClientState = {
  client: JSONClient
}

export class GoogleClient {
  props: GoogleClientProps
  state: GoogleClientState

  static SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
  static SESSION_KEY = 'session'
  static CREDENTIALS_KEY = 'credentials'

  constructor(
    props: GoogleClientProps
  ) {
    this.props = props
    this.state = {
      client: null
    }
  }

  private async loadSession(): Promise<void> {
    const session = await this.props.credentialsPersistance.load(GoogleClient.SESSION_KEY)
    if (session) {
      this.state.client = google.auth.fromJSON(session as JWTInput);
    }
  }

  private async saveSession(): Promise<void> {
    const creds = await this.props.credentialsPersistance.load(GoogleClient.CREDENTIALS_KEY)
    const key = creds["installed"] || creds["web"];
    const payload = {
      type: 'authorized_user',
      client_id: key.client_id,
      client_secret: key.client_secret,
      refresh_token: this.state.client.credentials.refresh_token,
    }
    await this.props.credentialsPersistance.persist(GoogleClient.SESSION_KEY, payload)
  }
  
  async login(): Promise<void> {
    await this.loadSession();
    if (this.state.client) {
      return
    }
    this.state.client = await authenticate({
      scopes: GoogleClient.SCOPES,
      keyfilePath: this.props.credentialsPersistance.getPath(GoogleClient.CREDENTIALS_KEY),
    }) as JSONClient;
    if (this.state.client.credentials) {
      await this.saveSession();
    }
  }
}