import { format } from "date-fns";
import { saveAs } from "file-saver";

/**
 * Aggregates DBE participation data.
 * @param {Array} contracts - List of contracts with subgrants.
 * @returns {Object} Aggregated data including total and DBE-specific amounts.
 */
export const aggregateParticipationData = (contracts: any[]) => {
  let totalAmount = 0;
  let dbeAmount = 0;

  contracts.forEach((contract) => {
    contract.subgrants.forEach((subgrant: any) => {
      totalAmount += subgrant.amount;
      if (subgrant.certified_dbe) {
        dbeAmount += subgrant.amount;
      }
    });
  });

  return { totalAmount, dbeAmount };
};

/**
 * Groups data by a specified key (e.g., year or contract type).
 * @param {Array} contracts - List of contracts with subgrants.
 * @param {string} key - The key to group by (e.g., "year", "contract_type").
 * @returns {Object} Grouped data.
 */
export const groupDataByKey = (contracts: any[], key: string) => {
  const groupedData: Record<string, number> = {};

  contracts.forEach((contract) => {
    contract.subgrants.forEach((subgrant: any) => {
      let groupKey: string;

      if (key === "year") {
        groupKey = format(new Date(subgrant.award_date), "yyyy");
      } else if (key === "contract_type") {
        groupKey = subgrant.contract_type || "Unknown";
      } else {
        throw new Error(`Unsupported grouping key: ${key}`);
      }

      groupedData[groupKey] = (groupedData[groupKey] || 0) + subgrant.amount;
    });
  });

  return groupedData;
};

/**
 * Calculates DBE participation percentage.
 * @param {number} dbeAmount - Total DBE amount.
 * @param {number} totalAmount - Total contract amount.
 * @returns {number} DBE participation percentage.
 */
export const calculateDbePercentage = (dbeAmount: number, totalAmount: number) => {
  if (totalAmount === 0) return 0;
  return (dbeAmount / totalAmount) * 100;
};

/**
 * Exports data to a CSV file.
 * @param {Array} data - The data to export.
 * @param {string} filename - The name of the CSV file.
 */
export const exportToCsv = (data: any[], filename: string) => {
  const csvContent = [
    Object.keys(data[0]), // Header row
    ...data.map((row) => Object.values(row)), // Data rows
  ]
    .map((row) => row.join(","))
    .join("\\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  saveAs(blob, filename);
};
