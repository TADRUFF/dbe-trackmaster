import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate, formatCurrency } from "@/lib/format";
import { saveAs } from "file-saver";

interface ReportFilters {
  startDate: string;
  endDate: string;
  contractType: string;
  dbeCertified: string;
}

export const ReportGenerator = () => {
  const { control, handleSubmit, watch } = useForm<ReportFilters>({
    defaultValues: {
      startDate: "",
      endDate: "",
      contractType: "",
      dbeCertified: "",
    },
  });

  const [filteredData, setFilteredData] = useState<any[]>([]);

  const { data: contracts, isLoading } = useQuery({
    queryKey: ["contracts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contracts")
        .select(`
          *,
          subgrants (
            id,
            dbe_firm_name,
            naics_code,
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

  const onSubmit = (filters: ReportFilters) => {
    if (!contracts) return;

    const filtered = contracts.filter((contract: any) => {
      const matchesDate =
        (!filters.startDate || new Date(contract.award_date) >= new Date(filters.startDate)) &&
        (!filters.endDate || new Date(contract.award_date) <= new Date(filters.endDate));

      const matchesContractType =
        !filters.contractType ||
        contract.subgrants.some((subgrant: any) => subgrant.contract_type === filters.contractType);

      const matchesDbeCertified =
        !filters.dbeCertified ||
        contract.subgrants.some(
          (subgrant: any) =>
            (filters.dbeCertified === "yes" && subgrant.certified_dbe) ||
            (filters.dbeCertified === "no" && !subgrant.certified_dbe)
        );

      return matchesDate && matchesContractType && matchesDbeCertified;
    });

    setFilteredData(filtered);
  };

  const exportToCSV = () => {
    const csvContent = [
      ["TAD Project #", "Contract #", "Prime Contractor", "Amount", "DBE %", "Award Date"],
      ...filteredData.map((contract) => [
        contract.tad_project_number,
        contract.contract_number,
        contract.prime_contractor,
        formatCurrency(contract.original_amount),
        `${contract.dbe_percentage}%`,
        formatDate(contract.award_date),
      ]),
    ]
      .map((row) => row.join(","))
      .join("\\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, "report.csv");
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Controller
                name="startDate"
                control={control}
                render={({ field }) => <Input type="date" {...field} />}
              />
            </div>
            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Controller
                name="endDate"
                control={control}
                render={({ field }) => <Input type="date" {...field} />}
              />
            </div>
            <div>
              <Label htmlFor="contractType">Contract Type</Label>
              <Controller
                name="contractType"
                control={control}
                render={({ field }) => (
                  <Select {...field} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Subcontract">Subcontract</SelectItem>
                      <SelectItem value="Supplier">Supplier</SelectItem>
                      <SelectItem value="Manufacturer">Manufacturer</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div>
              <Label htmlFor="dbeCertified">DBE Certified</Label>
              <Controller
                name="dbeCertified"
                control={control}
                render={({ field }) => (
                  <Select {...field} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">Yes</SelectItem>
                      <SelectItem value="no">No</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button type="submit" className="bg-tdot-blue hover:bg-tdot-blue/90 text-white">
              Generate Report
            </Button>
          </div>
        </form>
      </Card>

      {filteredData.length > 0 && (
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Report Results</h2>
            <Button onClick={exportToCSV} className="bg-green-500 hover:bg-green-600 text-white">
              Export to CSV
            </Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>TAD Project #</TableHead>
                <TableHead>Contract #</TableHead>
                <TableHead>Prime Contractor</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">DBE %</TableHead>
                <TableHead>Award Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((contract) => (
                <TableRow key={contract.id}>
                  <TableCell>{contract.tad_project_number}</TableCell>
                  <TableCell>{contract.contract_number}</TableCell>
                  <TableCell>{contract.prime_contractor}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(contract.original_amount)}
                  </TableCell>
                  <TableCell className="text-right">{contract.dbe_percentage}%</TableCell>
                  <TableCell>{formatDate(contract.award_date)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
};
