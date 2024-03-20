document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('toggle-one-off').addEventListener('click', function() {
        var oneOffFields = document.getElementById('one-off-fields');
        if (oneOffFields.style.display === 'none') {
            oneOffFields.style.display = 'block';
        } else {
            oneOffFields.style.display = 'none';
        }
    });

    document.getElementById('calculate').addEventListener('click', function() {
        const formatToNumber = (str) => str ? Number(str.replace(/,/g, '')) : 0;
        const formatNumberWithSeparators = (x) => x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

        let monthlyExpenditures = formatToNumber(document.getElementById('monthly-expenditures').value);
        let monthlyIncome = formatToNumber(document.getElementById('monthly-income').value);
        const savingsRate = parseFloat(document.getElementById('savings-rate').value) / 100;
        const initialBalance = formatToNumber(document.getElementById('initial-balance').value);
        const newMonthlyIncome = formatToNumber(document.getElementById('new-monthly-income').value);
        const incomeIncreaseYear = parseInt(document.getElementById('income-increase-year').value);

        const includeOneOff = document.getElementById('one-off-fields').style.display !== 'none';
        const oneOffAmount = includeOneOff ? formatToNumber(document.getElementById('one-off-amount').value) : 0;
        const oneOffMonth = includeOneOff ? parseInt(document.getElementById('one-off-month').value) : 0;

        const inflationRate = 0.062;
        const depositGrowthRate = 0.072;
        const investmentGrowthRate = 0.143;
        const retirementGoal = (monthlyExpenditures * 12) / 0.04;
        let totalSavings = initialBalance;
        let data = [];
        let months = 0;
        let retirementReached = false;

        while (!retirementReached) {
            months++;
            if (months > (incomeIncreaseYear * 12)) {
                monthlyIncome = newMonthlyIncome;
            }
            
            let monthlySavings = monthlyIncome - monthlyExpenditures;
            let investmentSavings = monthlySavings * savingsRate;
            let depositSavings = monthlySavings * (1 - savingsRate);
            
            let totalInvestment = totalSavings * savingsRate;
            let totalDeposit = totalSavings * (1 - savingsRate);
            
            let monthlyInvestmentReturn = totalInvestment * (investmentGrowthRate / 12);
            let monthlyDepositReturn = totalDeposit * (depositGrowthRate / 12);
            
            totalSavings += investmentSavings + monthlyInvestmentReturn + depositSavings + monthlyDepositReturn;

            // Subtract the one-off transaction in the specified month
            if (months === oneOffMonth) {
                totalSavings -= oneOffAmount;
                if (totalSavings < 0) totalSavings = 0;
            }

            // Adjust for inflation each year
            if (months % 12 === 0) {
                monthlyExpenditures *= (1 + inflationRate);
            }
            
            data.push(totalSavings);
            retirementReached = totalSavings >= retirementGoal;
        }

        const yearsToRetirement = Math.floor(months / 12);
        const remainingMonths = months % 12;
        document.getElementById('result').innerHTML = `
            <p>Bạn có thể đạt mục tiêu hưu trí sau: ${yearsToRetirement} năm và ${remainingMonths} tháng.</p>
            <p>Tổng tiết kiệm dự kiến là: ${formatNumberWithSeparators(totalSavings.toFixed(0))} VND.</p>
        `;

        // Update the chart with the new data up to the point retirement is reached
        updateChart(data.slice(0, months));
    });

    function updateChart(data) {
        const ctx = document.getElementById('savingsChart').getContext('2d');
        const labels = Array.from({length: data.length}, (_, i) => `Tháng ${i + 1}`);
        
        if (window.savingsChart && typeof window.savingsChart.destroy === 'function') {
            window.savingsChart.destroy();
        }
        
        window.savingsChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    label: 'Tổng số tiền để dành theo tháng',
                    data: data,
                    fill: false,
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
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Tháng'
                        },
                        autoSkip: true,
                        maxTicksLimit: 20
                    }
                }
            }
        });
    }
});
