import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, Legend } from "recharts";
import { useMemo } from "react";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

export const ParticipationStats = () => {
  const { data: contracts, isLoading } = useQuery({
    queryKey: ["contracts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contracts")
        .select(`
          *,
          subgrants (
            id,
            amount,
            certified_dbe,
            contract_type,
            award_date
          )
        `);

      if (error) throw error;
      return data;
    },
  });

  const processedData = useMemo(() => {
    if (!contracts) return { dbeStats: [], contractTypes: [], trends: [] };

    let totalAmount = 0;
    let dbeAmount = 0;
    const contractTypeCounts: Record<string, number> = {};
    const trends: Record<string, number> = {};

    contracts.forEach((contract: any) => {
      contract.subgrants.forEach((subgrant: any) => {
        totalAmount += subgrant.amount;
        if (subgrant.certified_dbe) {
          dbeAmount += subgrant.amount;
        }

        // Count contract types
        if (subgrant.contract_type) {
          contractTypeCounts[subgrant.contract_type] =
            (contractTypeCounts[subgrant.contract_type] || 0) + 1;
        }

        // Track trends over time (by year)
        const year = new Date(subgrant.award_date).getFullYear();
        trends[year] = (trends[year] || 0) + subgrant.amount;
      });
    });

    const dbeStats = [
      { name: "DBE Participation", value: dbeAmount },
      { name: "Non-DBE Participation", value: totalAmount - dbeAmount },
    ];

    const contractTypes = Object.entries(contractTypeCounts).map(([type, count]) => ({
      name: type,
      value: count,
    }));

    const trendData = Object.entries(trends)
      .map(([year, amount]) => ({ year, amount }))
      .sort((a, b) => parseInt(a.year) - parseInt(b.year));

    return { dbeStats, contractTypes, trends: trendData };
  }, [contracts]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  const { dbeStats, contractTypes, trends } = processedData;

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">DBE Participation Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Pie Chart for DBE Participation */}
          <div>
            <h3 className="text-lg font-medium mb-2">DBE Participation</h3>
            <PieChart width={400} height={300}>
              <Pie
                data={dbeStats}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                fill="#8884d8"
                label
              >
                {dbeStats.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </div>

          {/* Bar Chart for Contract Distribution */}
          <div>
            <h3 className="text-lg font-medium mb-2">Contract Distribution by Type</h3>
            <BarChart width={400} height={300} data={contractTypes}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#82ca9d" />
            </BarChart>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Trends Over Time</h2>
        <LineChart width={600} height={300} data={trends}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="year" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="amount" stroke="#8884d8" activeDot={{ r: 8 }} />
        </LineChart>
      </Card>
    </div>
  );
};
