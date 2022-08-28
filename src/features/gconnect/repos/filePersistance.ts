import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { cwd } from 'node:process';
import { SessionType } from "../services/types";

export interface IJSONPersistance {
  load(sessionId: string): Promise<SessionType>
  persist(sessionId: string, session: SessionType): Promise<void>
}
export type FilePersistanceProps = {
  service: string
}
export class FileJSONPersistance implements IJSONPersistance {
  props: FilePersistanceProps
  constructor(
    props: FilePersistanceProps
  ) {
    this.props = props
  }
  getPath(id: string): string {
    return path.join(cwd(), this.getFilename(id))
  };
  
  getFilename(id: string): string {
   return `${this.props.service}-${id}.json` 
  }
  async load(sessionId: string): Promise<SessionType> {
    let data: string
    try {
      data = await fs.readFile(this.getPath(sessionId), { encoding: "utf-8" })
    } catch (e) {
      if (e.code === "ENOENT") {
        return null
      }
      throw e
    }
    if (data) return JSON.parse(data)
    return null
  }
  async persist(sessionId: string, session: SessionType): Promise<void> {
    await fs.writeFile(this.getPath(sessionId), JSON.stringify(session))
  }
}