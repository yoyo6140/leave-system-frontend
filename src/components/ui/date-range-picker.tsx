"use client";

import { useState } from "react";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";
import { type DateRange } from "react-day-picker";
import { CalendarIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DateRangePickerProps {
  value: DateRange | undefined;
  onChange: (range: DateRange | undefined) => void;
  placeholder?: string;
}

/**
 * 請假日期範圍選擇器。日曆內的點選只會改「暫存」的範圍，
 * 要按右下角「確認」才會真的套用到表單；「清除」只清暫存，
 * 沒按確認就關掉（點外面／Esc）等於放棄這次的選取。
 */
export function DateRangePicker({
  value,
  onChange,
  placeholder = "選擇請假日期",
}: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<DateRange | undefined>(value);

  // 開啟時用目前已套用的值重置暫存草稿，確保每次重新打開都不會殘留上次沒確認的選取
  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) setDraft(value); // 每次打開都用目前已套用的值重置暫存
  }

  // 按下「確認」才真正把暫存的日期範圍套用到表單
  function handleConfirm() {
    onChange(draft);
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="w-full justify-start px-3 font-normal text-left"
        >
          <CalendarIcon className="mr-2 size-4 text-muted-foreground" />
          {value?.from ? (
            value.to ? (
              <>
                {format(value.from, "yyyy/MM/dd", { locale: zhTW })} —{" "}
                {format(value.to, "yyyy/MM/dd", { locale: zhTW })}
              </>
            ) : (
              format(value.from, "yyyy/MM/dd", { locale: zhTW })
            )
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          defaultMonth={draft?.from}
          selected={draft}
          onSelect={setDraft}
          numberOfMonths={2}
          locale={zhTW}
        />
        <div className="flex items-center justify-end gap-2 border-t border-border px-3 py-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setDraft(undefined)}
          >
            清除
          </Button>
          <Button type="button" size="sm" onClick={handleConfirm}>
            確認
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
