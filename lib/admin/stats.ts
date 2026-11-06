import "server-only";

export type DailyTraffic = { date: string; visits: number; pageViews: number; sampleInterval: number };
export type TrafficGroup = { name: string; visits: number; pageViews: number };
export type TrafficStats = {
  daily: DailyTraffic[];
  topPages: TrafficGroup[];
  referers: TrafficGroup[];
  countries: TrafficGroup[];
  devices: TrafficGroup[];
  browsers: TrafficGroup[];
  createPageViews: number;
};
export type VisitStatsResult = { data: TrafficStats | null; reason: "config" | "query" | null };

type Group = { count?: number|string|null; sum?: { visits?: number|string|null }|null; avg?: { sampleInterval?: number|string|null }|null; dimensions?: Record<string,string|null>|null };
type Response = { data?: { viewer?: { accounts?: Array<Record<string,Group[]|undefined>> } }; errors?: Array<{ message?: string }> };
const CACHE_MS=5*60_000;
const cache=new Map<string,{expires:number;data:TrafficStats}>();

const number=(v:number|string|null|undefined)=>Number(v)||0;
function group(rows:Group[]|undefined, dimension:string):TrafficGroup[]{
  return (rows||[]).map(row=>({name:row.dimensions?.[dimension]||"",visits:number(row.sum?.visits),pageViews:number(row.count)}));
}

const QUERY=`query VisitStats($accountTag: string!, $siteTag: string!, $start: Time!, $end: Time!) {
  viewer { accounts(filter: { accountTag: $accountTag }) {
    daily: rumPageloadEventsAdaptiveGroups(filter: { siteTag: $siteTag, datetime_geq: $start, datetime_lt: $end }, limit: 500, orderBy: [date_ASC]) { count sum { visits } avg { sampleInterval } dimensions { date } }
    topPages: rumPageloadEventsAdaptiveGroups(filter: { siteTag: $siteTag, datetime_geq: $start, datetime_lt: $end }, limit: 10, orderBy: [count_DESC]) { count sum { visits } dimensions { requestPath } }
    referers: rumPageloadEventsAdaptiveGroups(filter: { siteTag: $siteTag, datetime_geq: $start, datetime_lt: $end }, limit: 10, orderBy: [count_DESC]) { count sum { visits } dimensions { refererHost } }
    countries: rumPageloadEventsAdaptiveGroups(filter: { siteTag: $siteTag, datetime_geq: $start, datetime_lt: $end }, limit: 10, orderBy: [count_DESC]) { count sum { visits } dimensions { countryName } }
    devices: rumPageloadEventsAdaptiveGroups(filter: { siteTag: $siteTag, datetime_geq: $start, datetime_lt: $end }, limit: 10, orderBy: [count_DESC]) { count sum { visits } dimensions { deviceType } }
    browsers: rumPageloadEventsAdaptiveGroups(filter: { siteTag: $siteTag, datetime_geq: $start, datetime_lt: $end }, limit: 10, orderBy: [count_DESC]) { count sum { visits } dimensions { userAgentBrowser } }
    createPage: rumPageloadEventsAdaptiveGroups(filter: { siteTag: $siteTag, requestPath: "/creer", datetime_geq: $start, datetime_lt: $end }, limit: 1000) { count }
  } }
}`;

async function fetchStats(days:number):Promise<TrafficStats>{
  const accountTag=process.env.CF_ACCOUNT_ID?.trim()||"";
  const siteTag=process.env.CF_WEB_ANALYTICS_SITE_TAG?.trim()||"";
  const token=process.env.CF_API_TOKEN?.trim()||"";
  if(!accountTag||!siteTag||!token)throw new Error("analytics_config_missing");
  const today=new Date();
  const start=new Date(Date.UTC(today.getUTCFullYear(),today.getUTCMonth(),today.getUTCDate()-(days-1)));
  const end=new Date(Date.UTC(today.getUTCFullYear(),today.getUTCMonth(),today.getUTCDate()+1));
  const key=`${accountTag}:${siteTag}:${days}`;
  const hit=cache.get(key);
  if(hit&&hit.expires>Date.now())return hit.data;
  const res=await fetch("https://api.cloudflare.com/client/v4/graphql",{
    method:"POST",
    headers:{authorization:`Bearer ${token}`,"content-type":"application/json"},
    body:JSON.stringify({query:QUERY,variables:{accountTag,siteTag,start:start.toISOString(),end:end.toISOString()}}),
    signal:AbortSignal.timeout(10_000),
  });
  if(!res.ok)throw new Error(`analytics_http_${res.status}`);
  const payload=await res.json() as Response;
  if(payload.errors?.length)throw new Error("analytics_graphql_error");
  const rows=payload.data?.viewer?.accounts?.[0];
  if(!rows)throw new Error("analytics_no_account");
  const dailyRows=rows.daily||[];
  const byDate=new Map(dailyRows.map(row=>[row.dimensions?.date||"",row]));
  const daily:DailyTraffic[]=[];
  for(let offset=0;offset<days;offset++){
    const date=new Date(start.getTime()+offset*86_400_000).toISOString().slice(0,10);
    const row=byDate.get(date);
    daily.push({date,visits:number(row?.sum?.visits),pageViews:number(row?.count),sampleInterval:number(row?.avg?.sampleInterval)||1});
  }
  const result:TrafficStats={
    daily,
    topPages:group(rows.topPages,"requestPath"),
    referers:group(rows.referers,"refererHost"),
    countries:group(rows.countries,"countryName"),
    devices:group(rows.devices,"deviceType"),
    browsers:group(rows.browsers,"userAgentBrowser"),
    createPageViews:(rows.createPage||[]).reduce((total,row)=>total+number(row.count),0),
  };
  cache.set(key,{data:result,expires:Date.now()+CACHE_MS});
  return result;
}

export async function getVisitStats(days:7|30):Promise<VisitStatsResult>{
  const ready=!!process.env.CF_ACCOUNT_ID?.trim()&&!!process.env.CF_WEB_ANALYTICS_SITE_TAG?.trim()&&!!process.env.CF_API_TOKEN?.trim();
  if(!ready)return {data:null,reason:"config"};
  try{return {data:await fetchStats(days),reason:null};}
  catch(error){console.error("admin.analytics",error instanceof Error?error.message:error);return {data:null,reason:"query"};}
}
