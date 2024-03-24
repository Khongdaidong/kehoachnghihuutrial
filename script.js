document.addEventListener('DOMContentLoaded', function() {
    const incomeIncreaseTypeElement = document.getElementById('income-increase-type');
    const fixedIncomeIncreaseFields = document.getElementById('fixed-income-increase-fields');
    const percentageIncreaseGroup = document.getElementById('percentage-increase-group');

    incomeIncreaseTypeElement.addEventListener('change', function() {
        if (this.value === 'percentage') {
            fixedIncomeIncreaseFields.style.display = 'none';
            percentageIncreaseGroup.style.display = 'block';
        } else {
            fixedIncomeIncreaseFields.style.display = 'block';
            percentageIncreaseGroup.style.display = 'none';
        }
    });

    const adhocAnnualYesElement = document.getElementById('adhoc-annual-yes');
    const adhocMonthElement = document.getElementById('adhoc-month');

    // Listen for input changes on the ad-hoc month field
    adhocMonthElement.addEventListener('input', function() {
        if (document.getElementById('adhoc-annual-yes').checked && this.value > 12) {
            alert('Vui lòng nhập một số không lớn hơn 12 cho tháng nếu chi phí được áp dụng hàng năm.');
            this.value = ''; // Clear the input
        }
    });

    document.getElementById('calculate').addEventListener('click', function() {
        // Ensure ad-hoc month is valid when annual is selected
        if (document.getElementById('adhoc-annual-yes').checked && adhocMonthElement.value > 12) {
            alert('Vui lòng nhập một số không lớn hơn 12 cho tháng nếu chi phí được áp dụng hàng năm.');
            return; // Stop further execution
        }
    });
      
    // Ensure the month cannot be more than 12 if "Yes" is selected for annual expense
    adhocAnnualYesElement.addEventListener('change', function() {
        if (this.checked) {
            adhocMonthElement.max = 12;
        }
    });

    document.getElementById('calculate').addEventListener('click', function() {
        const formatToNumber = (str) => str ? Number(str.replace(/,/g, '')) : 0;
        let monthlyExpenditures = formatToNumber(document.getElementById('monthly-expenditures').value);
        let monthlyIncome = formatToNumber(document.getElementById('monthly-income').value);
        const savingsRate = parseFloat(document.getElementById('savings-rate').value) / 100;
        const initialBalance = formatToNumber(document.getElementById('initial-balance').value);
        const newMonthlyIncome = formatToNumber(document.getElementById('new-monthly-income').value);
        const incomeIncreaseYear = parseInt(document.getElementById('income-increase-year').value);
        const inflationRate = 0.062;
        const incomeIncreaseType = document.getElementById('income-increase-type').value;
        const annualPercentageIncrease = parseFloat(document.getElementById('annual-percentage-increase').value) / 100 || 0;

        const adhocExpense = formatToNumber(document.getElementById('adhoc-expense').value);
        let adhocMonth = parseInt(adhocMonthElement.value);
        const adhocAnnual = document.getElementById('adhoc-annual-yes').checked;

        let retirementGoal = (monthlyExpenditures * 12) / 0.04;
        let totalSavings = initialBalance;
        let data = [totalSavings];
        let months = 0;
        let retirementReached = false;

        while (!retirementReached) {
            months++;
            let currentYear = Math.floor(months / 12);
            
            if (incomeIncreaseType === 'fixed' && currentYear >= incomeIncreaseYear) {
                monthlyIncome = newMonthlyIncome;
            } else if (incomeIncreaseType === 'percentage' && months % 12 === 0) {
                monthlyIncome *= (1 + annualPercentageIncrease);
            }

            if (months % 12 === 0) {
                monthlyExpenditures *= (1 + inflationRate);
                retirementGoal = ((monthlyExpenditures * 12) / 0.04);
            }

            let monthlySavings = monthlyIncome - monthlyExpenditures;
            let investmentSavings = monthlySavings * savingsRate;
            let depositSavings = monthlySavings * (1 - savingsRate);
            let monthlyInvestmentReturn = (totalSavings * savingsRate) * (0.143 / 12);
            let monthlyDepositReturn = (totalSavings * (1 - savingsRate)) * (0.072 / 12);
            totalSavings += investmentSavings + monthlyInvestmentReturn + depositSavings + monthlyDepositReturn;

            // Handle ad-hoc expenses
            if (adhocExpense > 0 && adhocMonth) {
                if (adhocAnnual && months % 12 === adhocMonth - 1) {
                    totalSavings -= adhocExpense;
                } else if (!adhocAnnual && months === adhocMonth) {
                    totalSavings -= adhocExpense;
                }
            }

            data.push(totalSavings);
            retirementReached = totalSavings >= retirementGoal;
        }

        const yearsToRetirement = Math.floor(months / 12);
        const remainingMonths = months % 12;
        document.getElementById('result').innerHTML = `
        <p>Bạn có thể đạt mục tiêu hưu trí sau: ${yearsToRetirement} năm và ${remainingMonths} tháng.</p>
        <p>Tổng tiết kiệm dự kiến là: ${totalSavings.toLocaleString('en')} VND.</p>
    `;

        updateChart(data);
    });

    function updateChart(data) {
        const ctx = document.getElementById('savingsChart').getContext('2d');
        const labels = Array.from({ length: data.length }, (_, i) => `Tháng ${i}`);
        if (window.savingsChart && typeof window.savingsChart.destroy === 'function') {
            window.savingsChart.destroy();
        }

        window.savingsChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Tổng số tiền tiết kiệm trong suốt thời kỳ',
                    data: data,
                    borderColor: 'rgb(75, 192, 192)',
                    tension: 0.1
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Tổng tiền tiết kiệm (VND)'
                        },
                        ticks: {
                            callback: function(value) {
                                return value.toLocaleString('en-US', {
                                    maximumFractionDigits: 0
                                });
                            }
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed.y !== null) {
                                    label += context.parsed.y.toLocaleString('en-US', {
                                        maximumFractionDigits: 0
                                    }) + ' VND';
                                }
                                return label;
                            }
                        }
                    }
                }
            }
        });
    }
});
