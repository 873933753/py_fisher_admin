<script lang="ts" setup>
import type { Dayjs } from 'dayjs';

import type { EchartsUIType } from '@vben/plugins/echarts';

import type { DataStatsApi } from '#/api/core/dataStats';

import { computed, onMounted, ref, watch } from 'vue';

import { EchartsUI, useEcharts } from '@vben/plugins/echarts';

import { message, Radio, RangePicker, Spin } from 'ant-design-vue';
import dayjs from 'dayjs';

import {
  getCategoryTop10PieStatsApi,
  getDataOverviewStatApi,
  getSalesTrendsApi,
  getSysUvStatsApi,
} from '#/api/core/dataStats';

const CHART_THEME_COLORS = [
  '#7a73f4',
  '#8b5cf6',
  '#a78bfa',
  '#6d28d9',
  '#c4b5fd',
] as const;

/** 销售趋势三线：蓝 / 绿 / 橙红 */
const SALES_TREND_LINE_COLORS = ['#2563eb', '#16a34a', '#f97316'] as const;

const CHART_SALES_AREA_FILL = 'rgba(37, 99, 235, 0.12)';

const overviewLoading = ref(false);
const overviewData = ref<DataStatsApi.DataOverviewStat | null>(null);

function formatStatValue(value: null | number | string | undefined) {
  if (value === undefined || value === null || value === '') {
    return '—';
  }
  return String(value);
}

async function fetchOverview() {
  overviewLoading.value = true;
  try {
    overviewData.value = await getDataOverviewStatApi();
  } finally {
    overviewLoading.value = false;
  }
}

const trendRef = ref<EchartsUIType>();
const uvRef = ref<EchartsUIType>();
const categoryRef = ref<EchartsUIType>();

const { renderEcharts: renderTrendChart } = useEcharts(trendRef);
const { renderEcharts: renderUvChart } = useEcharts(uvRef);
const { renderEcharts: renderCategoryChart } = useEcharts(categoryRef);

function getDefaultDateRange(
  queryType: DataStatsApi.QueryType,
): [Dayjs, Dayjs] {
  const end = dayjs();
  if (queryType === 'MONTH') {
    return [dayjs().subtract(11, 'month').startOf('month'), end.endOf('month')];
  }
  return [dayjs().subtract(29, 'day'), end];
}

const trendLoading = ref(false);
const trendQueryType = ref<DataStatsApi.QueryType>('DAY');
const trendDateRange = ref<[Dayjs, Dayjs]>(getDefaultDateRange('DAY'));
const trendCalendarDates = ref<[Dayjs | null, Dayjs | null]>([null, null]);

function formatDateRangeLabel(
  queryType: DataStatsApi.QueryType,
  range: [Dayjs, Dayjs],
) {
  const [start, end] = range;
  if (queryType === 'MONTH') {
    return `${start.format('YYYY-MM')} ~ ${end.format('YYYY-MM')}`;
  }
  return `${start.format('YYYY-MM-DD')} ~ ${end.format('YYYY-MM-DD')}`;
}

const trendRangeLabel = computed(() =>
  formatDateRangeLabel(trendQueryType.value, trendDateRange.value),
);

function toTrendNumber(value: null | number | string | undefined) {
  const num = Number(value);
  return Number.isNaN(num) ? 0 : num;
}

function buildTrendChartOptions(items: DataStatsApi.SalesTrendItem[]) {
  const sorted = [...items].toSorted((a, b) =>
    a.timeKey.localeCompare(b.timeKey),
  );

  return {
    color: [...SALES_TREND_LINE_COLORS],
    grid: {
      bottom: 30,
      left: 35,
      right: 20,
      top: 36,
    },
    legend: {
      data: ['销售额', '订单量', '退款金额'],
      right: 12,
      top: 0,
    },
    tooltip: { trigger: 'axis' },
    xAxis: {
      axisLabel: { color: '#64748b' },
      axisLine: { lineStyle: { color: '#cbd5e1' } },
      boundaryGap: false,
      data: sorted.map((item) => item.timeKey),
      type: 'category',
    },
    yAxis: [
      {
        axisLabel: { color: '#64748b' },
        splitLine: { lineStyle: { color: '#e2e8f0', type: 'dashed' } },
        type: 'value',
      },
      {
        axisLabel: { color: '#64748b' },
        splitLine: { show: false },
        type: 'value',
      },
    ],
    series: [
      {
        areaStyle: {
          color: CHART_SALES_AREA_FILL,
        },
        data: sorted.map((item) => toTrendNumber(item.totalSales)),
        name: '销售额',
        smooth: true,
        type: 'line',
      },
      {
        data: sorted.map((item) => toTrendNumber(item.orderCount)),
        name: '订单量',
        smooth: true,
        type: 'line',
        yAxisIndex: 1,
      },
      {
        data: sorted.map((item) => toTrendNumber(item.refundAmount)),
        name: '退款金额',
        smooth: true,
        type: 'line',
        yAxisIndex: 0,
      },
    ],
  };
}

function getDateRangeApiParams(
  queryType: DataStatsApi.QueryType,
  range: [Dayjs, Dayjs],
): DataStatsApi.DateRangeQueryParams {
  const [start, end] = range;

  if (queryType === 'MONTH') {
    return {
      endTime: end.format('YYYY-MM'),
      queryType: 'MONTH',
      startTime: start.format('YYYY-MM'),
    };
  }

  return {
    endTime: end.format('YYYY-MM-DD'),
    queryType: 'DAY',
    startTime: start.format('YYYY-MM-DD'),
  };
}

function getTrendApiParams(): DataStatsApi.DateRangeQueryParams {
  return getDateRangeApiParams(trendQueryType.value, trendDateRange.value);
}

function validateDateRange(
  queryType: DataStatsApi.QueryType,
  start: Dayjs,
  end: Dayjs,
) {
  if (queryType === 'DAY') {
    const spanDays = end.endOf('day').diff(start.startOf('day'), 'day') + 1;
    if (spanDays > 30) {
      message.warning('按天查询最多选择 30 天');
      return false;
    }
    return true;
  }

  const spanMonths =
    end.endOf('month').diff(start.startOf('month'), 'month') + 1;
  if (spanMonths > 12) {
    message.warning('按月查询最多选择 12 个月');
    return false;
  }
  return true;
}

function validateTrendDateRange(start: Dayjs, end: Dayjs) {
  return validateDateRange(trendQueryType.value, start, end);
}

function createDisabledDate(
  queryType: DataStatsApi.QueryType,
  calendarDates: [Dayjs | null, Dayjs | null],
) {
  return (current: Dayjs) => {
    const [start, end] = calendarDates;
    const anchor = start && !end ? start : (end && !start ? end : null);

    if (!anchor) {
      return false;
    }

    if (queryType === 'DAY') {
      return (
        current.isBefore(anchor.subtract(29, 'day'), 'day') ||
        current.isAfter(anchor.add(29, 'day'), 'day')
      );
    }

    return (
      current.isBefore(anchor.subtract(11, 'month'), 'month') ||
      current.isAfter(anchor.add(11, 'month'), 'month')
    );
  };
}

function disabledTrendDate(current: Dayjs) {
  return createDisabledDate(
    trendQueryType.value,
    trendCalendarDates.value,
  )(current);
}

function handleTrendCalendarChange(
  dates: [Dayjs | null, Dayjs | null] | [string, string] | null,
) {
  if (!dates) {
    trendCalendarDates.value = [null, null];
    return;
  }

  trendCalendarDates.value = [
    dates[0] ? dayjs(dates[0]) : null,
    dates[1] ? dayjs(dates[1]) : null,
  ];
}

function handleTrendDateChange(
  dates: [Dayjs, Dayjs] | [string, string] | null,
) {
  trendCalendarDates.value = [null, null];

  if (!dates?.[0] || !dates[1]) {
    return;
  }

  const start = dayjs(dates[0]);
  const end = dayjs(dates[1]);

  if (!validateTrendDateRange(start, end)) {
    trendDateRange.value = getDefaultDateRange(trendQueryType.value);
    void fetchSalesTrend();
    return;
  }

  trendDateRange.value =
    trendQueryType.value === 'MONTH'
      ? [start.startOf('month'), end.endOf('month')]
      : [start, end];
  void fetchSalesTrend();
}

async function fetchSalesTrend() {
  trendLoading.value = true;
  try {
    const data = await getSalesTrendsApi(getTrendApiParams());
    await renderTrendChart(buildTrendChartOptions(data ?? []) as never);
  } finally {
    trendLoading.value = false;
  }
}

watch(trendQueryType, (queryType) => {
  trendDateRange.value = getDefaultDateRange(queryType);
  trendCalendarDates.value = [null, null];
  void fetchSalesTrend();
});

const uvLoading = ref(false);
const uvQueryType = ref<DataStatsApi.QueryType>('DAY');
const uvDateRange = ref<[Dayjs, Dayjs]>(getDefaultDateRange('DAY'));
const uvCalendarDates = ref<[Dayjs | null, Dayjs | null]>([null, null]);

const uvRangeLabel = computed(() =>
  formatDateRangeLabel(uvQueryType.value, uvDateRange.value),
);

function buildUvChartOptions(items: DataStatsApi.SysUvStatItem[]) {
  const sorted = [...items].toSorted((a, b) =>
    a.timeKey.localeCompare(b.timeKey),
  );

  return {
    color: [...CHART_THEME_COLORS],
    grid: {
      bottom: 20,
      left: 30,
      right: 10,
      top: 30,
    },
    tooltip: { trigger: 'axis' },
    xAxis: {
      axisLabel: { color: '#64748b' },
      axisLine: { lineStyle: { color: '#cbd5e1' } },
      data: sorted.map((item) => item.timeKey),
      type: 'category',
    },
    yAxis: {
      axisLabel: { color: '#64748b' },
      splitLine: { lineStyle: { color: '#e2e8f0', type: 'dashed' } },
      type: 'value',
    },
    series: [
      {
        barMaxWidth: 24,
        data: sorted.map((item) => toTrendNumber(item.uvCount)),
        itemStyle: {
          color: {
            colorStops: [
              { color: CHART_THEME_COLORS[0], offset: 0 },
              { color: CHART_THEME_COLORS[1], offset: 1 },
            ],
            type: 'linear',
            x: 0,
            x2: 0,
            y: 0,
            y2: 1,
          },
        },
        name: '浏览量',
        type: 'bar',
      },
    ],
  };
}

function getUvApiParams(): DataStatsApi.DateRangeQueryParams {
  return getDateRangeApiParams(uvQueryType.value, uvDateRange.value);
}

function validateUvDateRange(start: Dayjs, end: Dayjs) {
  return validateDateRange(uvQueryType.value, start, end);
}

function disabledUvDate(current: Dayjs) {
  return createDisabledDate(uvQueryType.value, uvCalendarDates.value)(current);
}

function handleUvCalendarChange(
  dates: [Dayjs | null, Dayjs | null] | [string, string] | null,
) {
  if (!dates) {
    uvCalendarDates.value = [null, null];
    return;
  }

  uvCalendarDates.value = [
    dates[0] ? dayjs(dates[0]) : null,
    dates[1] ? dayjs(dates[1]) : null,
  ];
}

function handleUvDateChange(dates: [Dayjs, Dayjs] | [string, string] | null) {
  uvCalendarDates.value = [null, null];

  if (!dates?.[0] || !dates[1]) {
    return;
  }

  const start = dayjs(dates[0]);
  const end = dayjs(dates[1]);

  if (!validateUvDateRange(start, end)) {
    uvDateRange.value = getDefaultDateRange(uvQueryType.value);
    void fetchUvStats();
    return;
  }

  uvDateRange.value =
    uvQueryType.value === 'MONTH'
      ? [start.startOf('month'), end.endOf('month')]
      : [start, end];
  void fetchUvStats();
}

async function fetchUvStats() {
  uvLoading.value = true;
  try {
    const data = await getSysUvStatsApi(getUvApiParams());
    await renderUvChart(buildUvChartOptions(data ?? []) as never);
  } finally {
    uvLoading.value = false;
  }
}

watch(uvQueryType, (queryType) => {
  uvDateRange.value = getDefaultDateRange(queryType);
  uvCalendarDates.value = [null, null];
  void fetchUvStats();
});

const categoryLoading = ref(false);

function buildCategoryChartOptions(items: DataStatsApi.CategoryPieItem[]) {
  return {
    color: [...CHART_THEME_COLORS],
    legend: {
      bottom: 0,
      icon: 'circle',
    },
    tooltip: { trigger: 'item' },
    series: [
      {
        center: ['50%', '44%'],
        data: items.map((item) => ({
          name: item.name,
          value: toTrendNumber(item.value),
        })),
        radius: ['42%', '68%'],
        type: 'pie',
      },
    ],
  };
}

async function fetchCategoryStats() {
  categoryLoading.value = true;
  try {
    const data = await getCategoryTop10PieStatsApi();
    await renderCategoryChart(buildCategoryChartOptions(data ?? []) as never);
  } finally {
    categoryLoading.value = false;
  }
}

onMounted(async () => {
  await Promise.all([
    fetchOverview(),
    fetchSalesTrend(),
    fetchCategoryStats(),
    fetchUvStats(),
  ]);
});
</script>

<template>
  <div class="min-h-full bg-slate-50 p-4 lg:p-6">
    <section
      class="rounded-2xl bg-white px-6 py-5 shadow-sm ring-1 ring-slate-100"
    >
      <h1 class="text-2xl font-semibold text-slate-900 lg:text-3xl">
        <!-- 欢迎回来，{{ userStore.userInfo?.realName || userStore.userInfo?.username || '管理员' }} -->
        数据总览
      </h1>
      <Spin :spinning="overviewLoading">
        <div class="mt-5 flex flex-wrap gap-3 lg:gap-4">
          <article class="min-w-[150px] flex-1 rounded-xl bg-violet-50 p-4">
            <p class="text-base text-violet-700">今日销售额</p>
            <p class="mt-1 text-2xl font-semibold text-violet-900">
              {{ formatStatValue(overviewData?.daySalesStat?.todaySales) }}
            </p>
            <p class="mt-1 text-xs text-violet-700">
              较昨日
              {{ formatStatValue(overviewData?.daySalesStat?.growthDisplay) }}
            </p>
          </article>
          <article class="min-w-[150px] flex-1 rounded-xl bg-violet-50 p-4">
            <p class="text-base text-violet-700">今日订单数</p>
            <p class="mt-1 text-2xl font-semibold text-violet-900">
              {{
                formatStatValue(
                  overviewData?.dayOrderConvRateStat?.todayPayOrder,
                )
              }}
            </p>
            <p class="mt-1 text-xs text-violet-700">
              支付转化率
              {{
                formatStatValue(overviewData?.dayOrderConvRateStat?.convRate)
              }}
            </p>
          </article>
          <article class="min-w-[150px] flex-1 rounded-xl bg-violet-50 p-4">
            <p class="text-base text-violet-700">待发货订单</p>
            <p class="mt-1 text-2xl font-semibold text-violet-900">
              {{ formatStatValue(overviewData?.waitShipStat?.waitShipCount) }}
            </p>
            <p class="mt-1 text-xs text-violet-700">
              平均发货时长
              {{ formatStatValue(overviewData?.waitShipStat?.avgHour) }}
            </p>
          </article>
          <article class="min-w-[150px] flex-1 rounded-xl bg-violet-50 p-4">
            <p class="text-base text-violet-700">新增用户</p>
            <p class="mt-1 text-2xl font-semibold text-violet-900">
              {{
                formatStatValue(
                  overviewData?.userTotalAndTodayStat?.todayUserCount,
                )
              }}
            </p>
            <p class="mt-1 text-xs text-violet-700">
              总用户
              {{
                formatStatValue(
                  overviewData?.userTotalAndTodayStat?.totalUserCount,
                )
              }}
            </p>
          </article>
          <article class="min-w-[150px] flex-1 rounded-xl bg-violet-50 p-4">
            <p class="text-base text-violet-700">待退款</p>
            <p class="mt-1 text-2xl font-semibold text-violet-900">
              {{ formatStatValue(overviewData?.waitRefundStat?.refundCount) }}
            </p>
            <p class="invisible mt-1 text-xs" aria-hidden="true">&nbsp;</p>
          </article>
          <article class="min-w-[150px] flex-1 rounded-xl bg-violet-50 p-4">
            <p class="text-base text-violet-700">未读工单</p>
            <p class="mt-1 text-2xl font-semibold text-violet-900">
              {{
                formatStatValue(
                  overviewData?.unreadTicketOrderStat?.unreadCount,
                )
              }}
            </p>
            <p class="invisible mt-1 text-xs" aria-hidden="true">&nbsp;</p>
          </article>
        </div>
      </Spin>
    </section>

    <section class="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
      <article
        class="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100 xl:col-span-2"
      >
        <div class="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 class="text-base font-semibold text-slate-900">销售趋势</h2>
            <p class="mt-1 text-xs text-slate-500">
              {{ trendRangeLabel }}
            </p>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <Radio.Group v-model:value="trendQueryType" size="small">
              <Radio.Button value="DAY">按天</Radio.Button>
              <Radio.Button value="MONTH">按月</Radio.Button>
            </Radio.Group>
            <RangePicker
              v-model:value="trendDateRange"
              :disabled-date="disabledTrendDate"
              :picker="trendQueryType === 'MONTH' ? 'month' : 'date'"
              @calendar-change="handleTrendCalendarChange"
              @change="handleTrendDateChange"
            />
          </div>
        </div>
        <Spin :spinning="trendLoading">
          <EchartsUI ref="trendRef" class="mt-4" height="320px" />
        </Spin>
      </article>

      <article class="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
        <h2 class="text-base font-semibold text-slate-900">商品分类占比</h2>
        <!-- <p class="mt-1 text-xs text-slate-500">当前订单来源结构</p> -->
        <Spin :spinning="categoryLoading">
          <EchartsUI ref="categoryRef" class="mt-4" height="320px" />
        </Spin>
      </article>
    </section>

    <section
      class="mt-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100"
    >
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 class="text-base font-semibold text-slate-900">浏览量</h2>
          <p class="mt-1 text-xs text-slate-500">
            {{ uvRangeLabel }}
          </p>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <Radio.Group v-model:value="uvQueryType" size="small">
            <Radio.Button value="DAY">按天</Radio.Button>
            <Radio.Button value="MONTH">按月</Radio.Button>
          </Radio.Group>
          <RangePicker
            v-model:value="uvDateRange"
            :disabled-date="disabledUvDate"
            :picker="uvQueryType === 'MONTH' ? 'month' : 'date'"
            @calendar-change="handleUvCalendarChange"
            @change="handleUvDateChange"
          />
        </div>
      </div>
      <Spin :spinning="uvLoading">
        <EchartsUI ref="uvRef" class="mt-4" height="300px" />
      </Spin>
    </section>
  </div>
</template>
