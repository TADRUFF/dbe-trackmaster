import { Header } from "@/components/Header";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ReportGenerator } from "@/components/reports/ReportGenerator";
import { ParticipationStats } from "@/components/reports/ParticipationStats";

const Reports = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-tdot-gray">Reports</h1>
            <p className="text-gray-600">
              View and generate DBE participation reports
            </p>
          </div>
          <Tabs defaultValue="generate-report" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="generate-report">Generate Report</TabsTrigger>
              <TabsTrigger value="participation-stats">Participation Statistics</TabsTrigger>
            </TabsList>
            <TabsContent value="generate-report">
              <ReportGenerator />
            </TabsContent>
            <TabsContent value="participation-stats">
              <ParticipationStats />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Reports;