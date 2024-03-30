document.addEventListener('DOMContentLoaded', function() {
    const incomeIncreaseTypeElement = document.getElementById('income-increase-type');
    const fixedIncomeIncreaseFields = document.getElementById('fixed-income-increase-fields');
    const percentageIncreaseGroup = document.getElementById('percentage-increase-group');
    const toggleRetirementExpendituresElement = document.getElementById('toggle-retirement-expenditures');
    const retirementExpendituresGroup = document.getElementById('retirement-expenditures-group');
    const retirementExpendituresElement = document.getElementById('retirement-expenditures');
    const adhocAnnualYesElement = document.getElementById('adhoc-annual-yes');
    const adhocMonthElement = document.getElementById('adhoc-month');
    const calculateButton = document.getElementById('calculate');
    const resultDiv = document.getElementById('result');
    const adhocExpenseWarning = document.getElementById('adhoc-expense-warning');

    incomeIncreaseTypeElement.addEventListener('change', function() {
        fixedIncomeIncreaseFields.style.display = this.value === 'fixed' ? 'block' : 'none';
        percentageIncreaseGroup.style.display = this.value === 'percentage' ? 'block' : 'none';
    });

    toggleRetirementExpendituresElement.addEventListener('change', function() {
        retirementExpendituresGroup.style.display = this.checked ? 'block' : 'none';
    });
    
    document.getElementById('adhoc-month').addEventListener('input', function(e) {
        const isAnnual = document.getElementById('adhoc-annual-yes').checked;
        let input = parseInt(e.target.value, 10);
    
        if (isAnnual && input > 12) {
            e.target.value = 12; // Set the value to 12 if it's more than 12 and the expense is annual
            displayWarning('Tháng chi phí không thường xuyên phát sinh không thể lớn hơn 12 khi áp dụng hàng năm.');
        } else {
            clearWarning();
        }
    });
    
    function displayWarning(message) {
        const warningDiv = document.getElementById('adhoc-month-warning');
        warningDiv.style.display = 'block';
        warningDiv.innerText = message;
    }
    
    function clearWarning() {
        const warningDiv = document.getElementById('adhoc-month-warning');
        warningDiv.style.display = 'none';
    }
    
    function updateWarningMessage(message) {
        let warningMessageDiv = document.getElementById('balance-warning-message');
        // If the message div does not exist, create it
        if (!warningMessageDiv) {
            warningMessageDiv = document.createElement('div');
            warningMessageDiv.id = 'balance-warning-message';
            warningMessageDiv.style.color = 'red';
            warningMessageDiv.style.marginTop = '10px';
            warningMessageDiv.style.textAlign = 'center';
            document.querySelector('.chart-container').after(warningMessageDiv);
        }
        // Update the text of the warning message
        warningMessageDiv.innerText = message;
    }
    // You should also attach an event listener to the annual ad-hoc radio button
    // to clear the warning if the user switches back to a non-annual option
    document.getElementById('adhoc-annual-no').addEventListener('change', function(e) {
        clearWarning();
        document.getElementById('adhoc-month').value = ''; // Reset the month input when switching to non-annual
    });    
    
    document.getElementById('adhoc-expense-toggle').addEventListener('change', function() {
        document.getElementById('adhoc-expenses-container').style.display = this.checked ? 'block' : 'none';
    });
    
    calculateButton.addEventListener('click', function() {
        const formatToNumber = (str) => str ? Number(str.replace(/,/g, '')) : 0;
        let monthlyExpenditures = formatToNumber(document.getElementById('monthly-expenditures').value);
        let monthlyIncome = formatToNumber(document.getElementById('monthly-income').value);
        const savingsRate = parseFloat(document.getElementById('savings-rate').value) / 100;
        const initialBalance = formatToNumber(document.getElementById('initial-balance').value);
        const adhocExpense = formatToNumber(document.getElementById('adhoc-expense').value);
        let adhocMonth = parseInt(adhocMonthElement.value);
        const adhocAnnual = adhocAnnualYesElement.checked;

        let retirementGoal = (monthlyExpenditures * 12) / 0.04;
        if (toggleRetirementExpendituresElement.checked) {
            const retirementExpendituresInput = formatToNumber(retirementExpendituresElement.value);
            if (retirementExpendituresInput > 0) {
                retirementGoal = (retirementExpendituresInput * 12) / 0.04;
            }
        }

        let totalSavings = initialBalance;
        let data = [totalSavings];
        let months = 0;
        let retirementReached = false;
        let adhocExpenseAfterRetirement = false;
        let balanceDroppedBelowZero = false;

        while (!retirementReached && months < 600) { // 600 months is an arbitrary limit to prevent infinite loops
            months++;
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

            if (totalSavings < 0) {
                balanceDroppedBelowZero = true;
                totalSavings = 0; // Reset the total savings to 0
            }

            data.push(totalSavings);
            retirementReached = totalSavings >= retirementGoal;

            // If retirement goal is reached and adhoc expense is set for a later month, we flag it
            if (retirementReached && adhocExpense > 0 && adhocMonth > months) {
                adhocExpenseAfterRetirement = true;
                break; // Stop the loop if we have reached retirement and found an adhoc expense after retirement
            }
        }

        const yearsToRetirement = Math.floor(months / 12);
        const remainingMonths = months % 12;
        resultDiv.innerHTML = `<p>Bạn có thể đạt mục tiêu hưu trí sau: ${yearsToRetirement} năm và ${remainingMonths} tháng.</p>
                               <p>Tổng tiết kiệm dự kiến là: ${totalSavings.toLocaleString('en')} VND.</p>`;

        adhocExpenseWarning.style.display = adhocExpenseAfterRetirement ? 'block' : 'none';

        updateChart(data);
        // After the calculation loop and chart update
        if (balanceDroppedBelowZero) {
            updateWarningMessage('Lưu ý: Chi phí không thường xuyên đã làm cho tổng số tiết kiệm xuống dưới 0. Tổng số tiết kiệm sẽ bắt đầu lại từ 0 vào tháng sau.');
        } else {
            const warningMessageDiv = document.getElementById('balance-warning-message');
            if (warningMessageDiv) {
                warningMessageDiv.remove(); // Remove the warning message if the balance doesn't drop below zero
            }
        }
    });
    function updateChart(data) {
        const ctx = document.getElementById('savingsChart').getContext('2d');
        
        // Check if window.savingsChart exists and is a Chart instance before calling destroy()
        if (window.savingsChart instanceof Chart) {
            window.savingsChart.destroy();
        }
        
        window.savingsChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.map((_, i) => `Tháng ${i}`),
                datasets: [{
                    label: 'Tổng số tiền tiết kiệm',
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
                                return value.toLocaleString('en-US');
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
                                    label += new Intl.NumberFormat('en-US').format(context.parsed.y) + ' VND';
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
