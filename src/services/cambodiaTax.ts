import { User, SalaryBreakdown } from '../types';

export const calculatePayrollForUser = (user: User): SalaryBreakdown => {
    const baseSalary = user.salary || 0;
    const exchangeRate = 4100; // KHR per USD

    // Mock calculations adhering to Cambodian Tax Law logic (simplified)
    const allowances = {
        transport: 0,
        attendance: 0,
        meal: 0,
        seniority: 0
    };

    const overtime = {
        hours150: 0,
        amount150: 0,
        hours200: 0,
        amount200: 0,
        total: 0
    };

    const grossSalary = baseSalary + allowances.transport + allowances.attendance + allowances.meal + allowances.seniority + overtime.total;

    // NSSF (Pension + Health) - approx 2% from employee side (capped)
    const nssf = Math.min(grossSalary * 0.02, 10); // Simplified cap

    // Tax on Salary (TOS) Calculation
    // 1. Rebate for dependents
    const dependentRebate = (user.dependents || 0) * 37.5; // $37.5 per child (150,000 KHR)
    
    // 2. Taxable Base
    const taxableBase = grossSalary - dependentRebate;
    
    // 3. Progressive Tax Rate (Simplified USD brackets)
    let taxOnSalary = 0;
    if (taxableBase <= 375) taxOnSalary = 0;
    else if (taxableBase <= 500) taxOnSalary = (taxableBase - 375) * 0.05;
    else if (taxableBase <= 2125) taxOnSalary = (taxableBase - 500) * 0.10 + 6.25;
    else if (taxableBase <= 3125) taxOnSalary = (taxableBase - 2125) * 0.15 + 168.75;
    else if (taxableBase <= 31250) taxOnSalary = (taxableBase - 3125) * 0.20 + 318.75;
    else taxOnSalary = (taxableBase - 31250) * 0.20 + 5943.75; // 20% flat above threshold for simplicity in this mock

    const deductions = {
        nssf,
        taxOnSalary,
        absences: 0,
        advances: 0,
        total: nssf + taxOnSalary
    };

    const netSalary = grossSalary - deductions.total;

    return {
        baseSalary,
        proratedDays: 26,
        allowances,
        overtime,
        grossSalary,
        deductions,
        netSalary,
        exchangeRate,
        netSalaryKHR: netSalary * exchangeRate
    };
};
