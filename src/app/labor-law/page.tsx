"use client";

import { AlertCircle } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import { Card } from "@/components/ui/card";

const LEAVE_RULES = [
  {
    type: "特休假",
    law: "勞基法 第 38 條",
    color: "bg-blue-50 text-blue-700 border-blue-200",
    rules: [
      { label: "6 個月～未滿 1 年", value: "3 天（24 小時）" },
      { label: "1 年～未滿 2 年", value: "7 天（56 小時）" },
      { label: "2 年～未滿 3 年", value: "10 天（80 小時）" },
      { label: "3 年～未滿 5 年", value: "14 天（112 小時）" },
      { label: "5 年～未滿 10 年", value: "15 天（120 小時）" },
      { label: "10 年以上", value: "每年增加 1 天，最多 30 天" },
    ],
    note: "未休完之特休假，雇主應發給工資。",
  },
  {
    type: "病假",
    law: "勞工請假規則 第 4 條",
    color: "bg-red-50 text-red-700 border-red-200",
    rules: [
      {
        label: "普通傷病假（含住院）",
        value: "1 年內合計不超過 30 日（半薪）",
      },
      {
        label: "住院傷病假",
        value: "1 年內合計不超過 1 年（超過 30 日不支薪）",
      },
    ],
    note: "普通傷病假前 30 日工資折半給付；超過部分不支薪。",
  },
  {
    type: "事假",
    law: "勞工請假規則 第 7 條",
    color: "bg-amber-50 text-amber-700 border-amber-200",
    rules: [{ label: "全年合計", value: "不超過 14 日（112 小時）" }],
    note: "事假期間不支薪。",
  },
  {
    type: "婚假",
    law: "勞工請假規則 第 2 條",
    color: "bg-red-50 text-red-700 border-red-200",
    rules: [{ label: "本人結婚", value: "8 日（64 小時），全薪" }],
    note: "婚假應在結婚登記日前後 30 日內請畢。",
  },
  {
    type: "喪假",
    law: "勞工請假規則 第 3 條",
    color: "bg-red-50 text-red-700 border-red-200",
    rules: [
      { label: "父母、養父母、繼父母、配偶", value: "8 日（64 小時）" },
      { label: "子女、配偶父母、祖父母、外祖父母", value: "6 日（48 小時）" },
      {
        label: "兄弟姊妹、曾祖父母、配偶祖父母、外祖父母",
        value: "3 日（24 小時）",
      },
    ],
    note: "喪假期間工資照給。",
  },
  {
    type: "公假",
    law: "勞工請假規則 第 10 條",
    color: "bg-amber-50 text-amber-700 border-amber-200",
    rules: [{ label: "依法令規定", value: "天數依各法令規定，工資照給" }],
    note: "包含選舉投票、兵役、出庭作證等法定事由。",
  },
];

export default function LaborLawPage() {
  return (
    <AppLayout>
      <div>
        <div className="mb-6">
          <h1 className="text-xl font-semibold">勞基法 AI 參考</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            依據中華民國《勞動基準法》及《勞工請假規則》整理
          </p>
        </div>

        <div className="mb-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <span>
            以下資訊僅供參考，實際權益請以最新法令為準，或洽詢勞工局確認。
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {LEAVE_RULES.map((item) => (
            <Card
              key={item.type}
              padding="default"
              className={`border ${item.color}`}
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-semibold">{item.type}</span>
                <span className="text-xs opacity-60">{item.law}</span>
              </div>
              <div className="mb-3 flex flex-col gap-1.5">
                {item.rules.map((r) => (
                  <div
                    key={r.label}
                    className="flex justify-between gap-4 text-xs"
                  >
                    <span className="opacity-75">{r.label}</span>
                    <span className="font-medium shrink-0">{r.value}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs opacity-60 border-t border-current/10 pt-2">
                {item.note}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
