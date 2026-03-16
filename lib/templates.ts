export function generateFAClientCSV(): string {
  return `client_id,age,filing_status,federal_tax_bracket,state_tax_rate,risk_tolerance,investment_objective,time_horizon,annual_income,liquid_net_worth,total_net_worth,liquidity_needs,retirement_age_target,has_pension,social_security_start_age,num_dependents,annual_expenses,notes
C-1001,55,MFJ,0.32,0.05,Moderate,Retirement Income,10-15 years,250000,1500000,2500000,Low,65,true,67,2,120000,Example client
C-1002,42,Single,0.24,0.06,Moderate Aggressive,Growth,15+ years,180000,800000,1200000,Moderate,65,false,,0,90000,
C-1003,68,MFJ,0.22,0.04,Conservative,Capital Preservation,5-10 years,95000,600000,1100000,High,,,1,75000,Recently retired`;
}

export function generateFAHoldingsCSV(): string {
  return `client_id,ticker,shares,cost_basis,current_price,account_type,date_purchased,annual_dividend_yield,expense_ratio
C-1001,VTI,500,150,268,Traditional IRA,2018-03-15,,0.03
C-1001,BND,300,82,72,Traditional IRA,2019-01-10,,0.03
C-1001,AAPL,100,120,192,Taxable,2020-06-01,,
C-1002,VOO,200,350,512,401k,2021-01-15,,0.03
C-1002,QQQ,100,300,478,Roth IRA,2020-09-20,,0.20
C-1003,VTI,200,180,268,Taxable,2017-05-10,,0.03
C-1003,BND,400,78,72,Traditional IRA,2018-08-01,,0.03`;
}

export function generateAcctCSV(): string {
  return `client_id,filing_status,num_dependents,state_of_residence,w2_income,self_employment_income,business_income_loss,rental_income_loss,capital_gains_short,capital_gains_long,interest_income,dividend_income_qualified,dividend_income_ordinary,social_security_income,pension_income,ira_distributions,other_income,mortgage_interest,salt_paid,charitable_cash,charitable_noncash,medical_expenses,student_loan_interest,business_expenses,estimated_tax_payments,withholding,prior_year_overpayment,amt_preference_items,iso_exercise_spread,notes
C-2001,MFJ,2,CA,350000,0,0,0,10000,30000,5000,8000,2000,0,0,0,0,25000,40000,12000,3000,2000,0,0,35000,80000,0,15000,80000,ISO exercise this year
C-2002,Single,0,TX,150000,75000,0,0,0,5000,3000,4000,1000,0,0,0,0,10000,5000,8000,0,1000,0,25000,20000,30000,0,0,0,S-corp consulting
C-2003,MFJ,3,OH,120000,0,0,0,0,3000,2000,2500,800,0,0,0,0,8000,7000,5000,0,1200,1500,0,0,25000,1000,0,0,Straightforward`;
}
