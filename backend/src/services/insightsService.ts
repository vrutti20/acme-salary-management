import { COUNTRIES } from '../config';
import { fromMinor } from '../currency';
import { EmployeeRepository } from '../repositories/employeeRepository';
import { groupBy, histogram, summarize } from '../stats';

/** All insight money values are USD-normalised so countries are comparable. */
const usd = (minor: number) => Math.round(fromMinor(minor) * 100) / 100;

export class InsightsService {
  constructor(private repo: EmployeeRepository) {}

  byCountry() {
    const groups = groupBy(this.repo.salaryRows(), (r) => r.country);
    return [...groups.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([country, rows]) => {
        const s = summarize(rows.map((r) => r.salaryUsdMinor));
        return {
          country,
          currency: COUNTRIES[country],
          headcount: s.count,
          minUsd: usd(s.min),
          maxUsd: usd(s.max),
          avgUsd: usd(s.avg),
          medianUsd: usd(s.median),
        };
      });
  }

  byJobTitle(country?: string) {
    const groups = groupBy(this.repo.salaryRows(country), (r) => r.jobTitle);
    return [...groups.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([jobTitle, rows]) => {
        const s = summarize(rows.map((r) => r.salaryUsdMinor));
        return {
          jobTitle,
          headcount: s.count,
          minUsd: usd(s.min),
          maxUsd: usd(s.max),
          avgUsd: usd(s.avg),
          medianUsd: usd(s.median),
        };
      });
  }

  byDepartment() {
    const groups = groupBy(this.repo.salaryRows(), (r) => r.department);
    return [...groups.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([department, rows]) => {
        const s = summarize(rows.map((r) => r.salaryUsdMinor));
        return { department, headcount: s.count, totalPayrollUsd: usd(s.total), avgUsd: usd(s.avg) };
      });
  }

  distribution(bucketSizeUsd = 20000) {
    const widthMinor = bucketSizeUsd * 100;
    const values = this.repo.salaryRows().map((r) => r.salaryUsdMinor);
    return histogram(values, widthMinor).map((b) => ({
      fromUsd: usd(b.from),
      toUsd: usd(b.to),
      count: b.count,
    }));
  }
}
