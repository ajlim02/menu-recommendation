import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { mealTypes, mealTypeLabels } from "@shared/schema";
import { Plus, Calendar, Utensils } from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

const formSchema = z.object({
  date: z.string().min(1, "날짜를 선택해주세요"),
  mealType: z.enum(mealTypes, {
    required_error: "식사 유형을 선택해주세요",
  }),
  menuText: z.string().min(1, "메뉴를 입력해주세요").max(100),
});

type FormData = z.infer<typeof formSchema>;

export function MealRecordForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isExpanded, setIsExpanded] = useState(false);

  const today = format(new Date(), "yyyy-MM-dd");

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: today,
      mealType: "lunch",
      menuText: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      return apiRequest("POST", "/api/meal-records", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/meal-records"] });
      queryClient.invalidateQueries({ queryKey: ["/api/recommendations"] });
      form.reset({ date: today, mealType: "lunch", menuText: "" });
      setIsExpanded(false);
      toast({
        title: "기록 완료",
        description: "식사 기록이 추가되었어요.",
      });
    },
    onError: () => {
      toast({
        title: "오류 발생",
        description: "기록을 저장하는데 실패했어요.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    mutation.mutate(data);
  };

  if (!isExpanded) {
    return (
      <Card className="hover-elevate cursor-pointer" onClick={() => setIsExpanded(true)}>
        <CardContent className="flex items-center justify-center gap-2 py-6">
          <Plus className="h-5 w-5 text-muted-foreground" />
          <span className="text-muted-foreground" data-testid="text-add-record-prompt">
            오늘 뭐 드셨어요? 클릭해서 기록하기
          </span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Utensils className="h-5 w-5 text-primary" />
          식사 기록 추가
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      날짜
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        max={today}
                        data-testid="input-date"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="mealType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>식사 유형</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-meal-type">
                          <SelectValue placeholder="선택하세요" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {mealTypes.map((type) => (
                          <SelectItem key={type} value={type} data-testid={`option-${type}`}>
                            {mealTypeLabels[type]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="menuText"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>메뉴</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="예: 김치찌개, 된장찌개, 파스타..."
                      {...field}
                      data-testid="input-menu"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsExpanded(false)}
                className="flex-1"
                data-testid="button-cancel"
              >
                취소
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={mutation.isPending}
                data-testid="button-save-record"
              >
                {mutation.isPending ? "저장 중..." : "기록하기"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
