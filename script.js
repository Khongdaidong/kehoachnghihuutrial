document.addEventListener('DOMContentLoaded', function() {
    const incomeIncreaseTypeElement = document.getElementById('income-increase-type');
    const fixedIncomeIncreaseFields = document.getElementById('fixed-income-increase-fields');
    const percentageIncreaseGroup = document.getElementById('percentage-increase-group');

    // Toggle the display of the percentage increase input based on the selected income increase type
    incomeIncreaseTypeElement.addEventListener('change', function() {
        if (this.value === 'percentage') {
            fixedIncomeIncreaseFields.style.display = 'none';
            percentageIncreaseGroup.style.display = 'block';
        } else {
            fixedIncomeIncreaseFields.style.display = 'block';
            percentageIncreaseGroup.style.display = 'none';
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
        let retirementGoal = (monthlyExpenditures * 12) / 0.04;
        let totalSavings = initialBalance;
        let data = [totalSavings];
        let months = 0;
        let retirementReached = false;

        while (!retirementReached) {
            months++;
            let currentYear = Math.floor(months / 12);
            
            // Handle income increase based on the selected method
            if (incomeIncreaseType === 'fixed' && currentYear >= incomeIncreaseYear) {
                monthlyIncome = newMonthlyIncome;
            } else if (incomeIncreaseType === 'percentage' && months % 12 === 0) {
                monthlyIncome *= (1 + annualPercentageIncrease);
            }
            
            // Adjust monthly expenditures for inflation annually
            if (months % 12 === 0) {
                monthlyExpenditures *= (1 + inflationRate);
                retirementGoal = ((monthlyExpenditures * 12) / 0.04); // Update retirement goal based on new expenditures
            }

            let monthlySavings = monthlyIncome - monthlyExpenditures;
            let investmentSavings = monthlySavings * savingsRate;
            let depositSavings = monthlySavings * (1 - savingsRate);
            
            let monthlyInvestmentReturn = (totalSavings * savingsRate) * (0.143 / 12);
            let monthlyDepositReturn = (totalSavings * (1 - savingsRate)) * (0.072 / 12);
            
            totalSavings += investmentSavings + monthlyInvestmentReturn + depositSavings + monthlyDepositReturn;
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
                    label: 'Tổng số tiền để dành theo tháng',
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
                            text: 'Tổng số tiền để dành (VND)'
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
