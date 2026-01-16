import { PreferenceControls } from "@/components/preference-controls";
import { InsightDashboard } from "@/components/insight-dashboard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, BarChart3 } from "lucide-react";
import { useLocation } from "wouter";

export default function SettingsPage() {
  const [, setLocation] = useLocation();

  const handleSaveComplete = () => {
    setTimeout(() => {
      setLocation("/records");
    }, 500);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8 md:px-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold" data-testid="text-page-title">설정 및 분석</h1>
        <p className="text-muted-foreground leading-relaxed">
          선호도를 설정하고 식사 패턴을 분석해보세요.
        </p>
      </div>

      <Tabs defaultValue="preferences" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="preferences" className="gap-2" data-testid="tab-preferences">
            <Settings className="h-4 w-4" />
            선호도 설정
          </TabsTrigger>
          <TabsTrigger value="insights" className="gap-2" data-testid="tab-insights">
            <BarChart3 className="h-4 w-4" />
            분석 대시보드
          </TabsTrigger>
        </TabsList>

        <TabsContent value="preferences" className="space-y-4">
          <PreferenceControls onSaveComplete={handleSaveComplete} />
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <InsightDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
}
