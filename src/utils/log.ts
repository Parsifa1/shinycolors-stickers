import axios from "axios";
import config from "../config.json";

interface LogResponse {
  key?: string;
  [key: string]: unknown;
}

async function log(id: string, name: string, type: string): Promise<LogResponse | undefined> {
  const key = localStorage.getItem("x-key");
  try {
    const response = await axios.post<LogResponse>(
      `${config.apiUrl}/log`,
      {
        id: id,
        name: name,
        type: type,
      },
      {
        headers: {
          "x-key": key,
        },
      },
    );
    if (response.data.key) {
      localStorage.setItem("x-key", response.data.key);
    }
    return response.data;
  } catch (error) {
    console.log(error);
  }
}

export default log;
