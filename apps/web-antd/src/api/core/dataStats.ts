import { requestClient } from '#/api/request';

export namespace DataStatsApi {
  export type QueryType = 'DAY' | 'MONTH';

  export interface DateRangeQueryParams {
    endTime: string;
    queryType: QueryType;
    startTime: string;
  }

  export interface DayOrderConvRateStat {
    convRate: string;
    todayLoginUser: number | string;
    todayPayOrder: number | string;
    [property: string]: unknown;
  }

  export interface DaySalesStat {
    growthDisplay: string;
    todaySales: number;
    yesterdaySales: number | string;
    [property: string]: unknown;
  }

  export interface UnreadTicketOrderStat {
    orderIds: string;
    unreadCount: number | string;
    [property: string]: unknown;
  }

  export interface UserTotalAndTodayStat {
    todayUserCount: number | string;
    totalUserCount: number | string;
    [property: string]: unknown;
  }

  export interface WaitRefundStat {
    orderIds: string;
    refundCount: number;
    [property: string]: unknown;
  }

  export interface WaitShipStat {
    avgHour: string;
    waitShipCount: number | string;
    [property: string]: unknown;
  }

  export interface DataOverviewStat {
    dayOrderConvRateStat: DayOrderConvRateStat;
    daySalesStat: DaySalesStat;
    unreadTicketOrderStat: UnreadTicketOrderStat;
    userTotalAndTodayStat: UserTotalAndTodayStat;
    waitRefundStat: WaitRefundStat;
    waitShipStat: WaitShipStat;
    [property: string]: unknown;
  }

  export interface SalesTrendItem {
    orderCount: number | string;
    refundAmount: number | string;
    timeKey: string;
    totalSales: number | string;
    [property: string]: unknown;
  }

  export interface CategoryPieItem {
    name: string;
    value: number;
    [property: string]: unknown;
  }

  export interface SysUvStatItem {
    timeKey: string;
    uvCount: number | string;
    [property: string]: unknown;
  }
}

/** 数据总览统计 */
export function getDataOverviewStatApi() {
  return requestClient.get<DataStatsApi.DataOverviewStat>(
    '/dataStats/dataOverviewStat',
  );
}

/** 销售趋势 */
export function getSalesTrendsApi(data: DataStatsApi.DateRangeQueryParams) {
  return requestClient.post<DataStatsApi.SalesTrendItem[]>(
    '/dataStats/salesTrends',
    data,
  );
}

/** 商品分类占比 Top10 */
export function getCategoryTop10PieStatsApi() {
  return requestClient.get<DataStatsApi.CategoryPieItem[]>(
    '/dataStats/categoryTop10PieStats',
  );
}

/** 浏览量统计 */
export function getSysUvStatsApi(data: DataStatsApi.DateRangeQueryParams) {
  return requestClient.post<DataStatsApi.SysUvStatItem[]>(
    '/dataStats/findSysUvStats',
    data,
  );
}
