<script lang="ts" setup>
import type { TableColumnsType } from 'ant-design-vue';

import type { CouponTemplateApi } from '#/api/core/couponTemplate';

import { Button, Radio, Table } from 'ant-design-vue';

import { MallListTableCard } from '#/components/mall-list';

import { formatDiscountPercentage } from '../constants';

defineProps<{
  dataSource: CouponTemplateApi.CouponTemplateRecord[];
  defaultCouponId: string;
  loading: boolean;
  settingDefaultId: null | string;
}>();

const emit = defineEmits<{
  add: [];
  defaultChange: [id: string];
  delete: [row: CouponTemplateApi.CouponTemplateRecord];
  edit: [row: CouponTemplateApi.CouponTemplateRecord];
}>();

const columns: TableColumnsType<CouponTemplateApi.CouponTemplateRecord> = [
  {
    title: '序号',
    key: 'index',
    width: 70,
    align: 'center',
  },
  {
    title: '优惠券Id',
    dataIndex: 'id',
    key: 'id',
    width: 220,
    ellipsis: true,
    align: 'center',
  },
  {
    title: '优惠券名称',
    dataIndex: 'title',
    key: 'title',
    ellipsis: true,
    align: 'center',
  },
  {
    title: '折扣比例',
    key: 'discountPercentage',
    width: 160,
    align: 'center',
  },
  {
    title: '默认券',
    key: 'isDefault',
    width: 160,
    align: 'center',
  },
  { title: '操作', key: 'action', width: 180, fixed: 'right', align: 'center' },
];
</script>

<template>
  <MallListTableCard>
    <template #header>
      <div class="text-base font-medium text-foreground">优惠券列表</div>
      <Button type="primary" @click="emit('add')">新增</Button>
    </template>
    <Table
      :columns="columns"
      :data-source="dataSource"
      :loading="loading"
      :pagination="false"
      row-key="id"
      :scroll="{ x: 800 }"
      size="middle"
    >
      <template #bodyCell="{ column, index, record }">
        <template v-if="column.key === 'index'">
          {{ index + 1 }}
        </template>
        <template v-else-if="column.key === 'discountPercentage'">
          {{
            formatDiscountPercentage(
              (record as CouponTemplateApi.CouponTemplateRecord)
                .discountPercentage,
            )
          }}
        </template>
        <template v-else-if="column.key === 'isDefault'">
          <Radio
            :checked="defaultCouponId === record.id"
            :disabled="
              loading ||
              (settingDefaultId !== null && settingDefaultId !== record.id)
            "
            @click="emit('defaultChange', record.id)"
          />
        </template>
        <template v-else-if="column.key === 'action'">
          <div class="flex justify-center gap-1">
            <Button
              size="small"
              type="link"
              @click="
                emit('edit', record as CouponTemplateApi.CouponTemplateRecord)
              "
            >
              编辑
            </Button>
            <Button
              danger
              size="small"
              type="link"
              @click="
                emit('delete', record as CouponTemplateApi.CouponTemplateRecord)
              "
            >
              删除
            </Button>
          </div>
        </template>
      </template>
    </Table>
  </MallListTableCard>
</template>
