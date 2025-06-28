import * as dotenv from 'dotenv';
dotenv.config();

export type ConfigType = {
  API_PORT: number;
  DB_URL: string;
  BOT_TOKEN: string;
};

export const config: ConfigType = {
  API_PORT: Number(process.env.API_PORT),
  DB_URL: String(process.env.DB_URL),
  BOT_TOKEN: String(process.env.BOT_TOKEN),
};
